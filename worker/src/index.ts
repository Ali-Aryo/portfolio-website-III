/**
 * Portfolio RAG chatbot — API worker.
 *
 * - Run `npm run dev` in this folder to start a local dev server
 * - Requires GEMINI_API_KEY, QDRANT_URL, QDRANT_API_KEY in .dev.vars locally
 *   (see .dev.vars.example)
 * - Test locally with curl once it's running:
 *     curl -X POST http://localhost:8787/chat \
 *       -H "Content-Type: application/json" \
 *       -d '{"message":"hello"}'
 *
 * M7 pipeline for /chat, per the [[Embeddings & Vector Search]] note:
 *   1. embed the incoming question (RETRIEVAL_QUERY)
 *   2. search Qdrant for the closest stored chunks (pure vector math, no LLM)
 *   3. hand the retrieved chunk text to Gemini as grounding context
 *   4. Gemini writes the actual answer (only step that touches language)
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const ALLOWED_ORIGINS = new Set([
	"http://localhost:5173",
	"https://ali-shamsi-dev.netlify.app",
]);

function corsHeaders(origin: string | null): HeadersInit {
	if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};
}

const GEMINI_GENERATE_URL =
	"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";
const GEMINI_EMBED_URL =
	"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";
const QDRANT_COLLECTION = "portfolio_chunks";
const TOP_K = 5; // top-k over a hard score cutoff — see the anisotropy note
// in [[Embeddings & Vector Search]] for why a fixed threshold doesn't work.

// 429 (rate limited) and 503 (temporarily overloaded, seen live on
// generateContent — "high demand, try again later") are *transient*: the
// request itself was fine, the service just wasn't ready for it yet, and a
// short retry usually just works. Other error codes (400 bad request,
// 401/403 auth) won't fix themselves on a retry, so those are returned
// as-is instead of wasting attempts on them. Same idea as the retry added
// to ingest.mjs for the same reason, applied here to both Gemini calls
// since both hit the same upstream infrastructure. The delay is wall-clock
// time spent awaiting a fetch, not CPU time, so it doesn't eat into a
// Worker's CPU-time limit — see [[Cloudflare Workers]].
async function fetchWithRetry(url: string, init: RequestInit, maxAttempts = 3): Promise<Response> {
	let res: Response;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		res = await fetch(url, init);
		if (res.ok || attempt === maxAttempts) return res;
		if (res.status !== 429 && res.status !== 503) return res;
		const waitMs = attempt * 1000; // linear backoff: 1s, 2s, ...
		console.log(
			`  ${url} returned ${res.status}, retrying in ${waitMs}ms (attempt ${attempt}/${maxAttempts})...`
		);
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}
	return res!;
}

// ---- Retrieval: embed the question, then search Qdrant -------------------

interface EmbedResponse {
	embedding?: { values?: number[] };
}

async function embedQuery(text: string, apiKey: string): Promise<number[]> {
	const res = await fetchWithRetry(GEMINI_EMBED_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
		body: JSON.stringify({
			model: "models/gemini-embedding-001",
			content: { parts: [{ text }] },
			// The live question is what we're searching *with* — RETRIEVAL_QUERY,
			// the opposite of the RETRIEVAL_DOCUMENT used when chunks were
			// ingested (worker/scripts/ingest.mjs). Mixing these up doesn't
			// error, it just silently degrades ranking — see the M5 note.
			taskType: "RETRIEVAL_QUERY",
			output_dimensionality: 768, // must match ingestion — different
			// dimensionality means vectors that aren't even comparable.
		}),
	});
	if (!res.ok) {
		throw new Error(`Embedding error: ${res.status} ${await res.text()}`);
	}
	const data = (await res.json()) as EmbedResponse;
	if (!data.embedding?.values) {
		throw new Error("Embedding response missing embedding.values");
	}
	return data.embedding.values;
}

// Only the payload fields we actually use below — Qdrant returns more, but
// declaring the full shape here would just be noise.
interface QdrantPoint {
	score: number;
	payload: {
		slug: string;
		title: string;
		section: string;
		text: string;
		links?: { label: string; href: string }[];
	};
}

interface QdrantSearchResponse {
	result?: QdrantPoint[];
}

async function searchQdrant(
	vector: number[],
	qdrantUrl: string,
	qdrantApiKey: string
): Promise<QdrantPoint[]> {
	const res = await fetch(`${qdrantUrl}/collections/${QDRANT_COLLECTION}/points/search`, {
		method: "POST",
		headers: { "Content-Type": "application/json", "api-key": qdrantApiKey },
		body: JSON.stringify({ vector, limit: TOP_K, with_payload: true }),
	});
	if (!res.ok) {
		throw new Error(`Qdrant search error: ${res.status} ${await res.text()}`);
	}
	const data = (await res.json()) as QdrantSearchResponse;
	return data.result ?? [];
}

// ---- Grounding: turn retrieved chunks into prompt context -----------------

function buildContext(points: QdrantPoint[]): string {
	return points
		.map((p, i) => `[${i + 1}] ${p.payload.title} (${p.payload.section}): ${p.payload.text}`)
		.join("\n");
}

// Dedup links by project so the same GitHub/live-site URL isn't repeated
// once per chunk when several chunks from the same project got retrieved.
function buildLinksNote(points: QdrantPoint[]): string {
	const byProject = new Map<string, { title: string; links: { label: string; href: string }[] }>();
	for (const p of points) {
		if (!byProject.has(p.payload.slug) && p.payload.links?.length) {
			byProject.set(p.payload.slug, { title: p.payload.title, links: p.payload.links });
		}
	}
	return [...byProject.values()]
		.map((p) => `${p.title} — ${p.links.map((l) => `${l.label}: ${l.href}`).join(", ")}`)
		.join("\n");
}

// ---- Generation: Gemini writes the actual answer, grounded on context -----

interface GeminiResponse {
	candidates?: {
		content?: {
			parts?: { text?: string }[];
		};
	}[];
}
//System Prompt
const SYSTEM_INSTRUCTION =
	"You are the assistant embedded in Ali Shamsi's software portfolio site, answering " +
	"questions from visitors (recruiters, collaborators, etc.) about his projects. Answer " +
	"using ONLY the context provided below the question — it was retrieved from Ali's real " +
	"project data. Don't invent details that aren't in it. If the context doesn't actually " +
	"answer the question, say plainly that you don't have that in Ali's portfolio rather " +
	"than guessing. Speak about Ali in the third person, keep answers conversational and " +
	"concise.\n\n" +
	"Formatting: reply in plain conversational prose — no Markdown syntax at all (no *, **, " +
	"#, bullet points, or numbered lists). The chat widget displays your response as plain " +
	"text, so Markdown symbols would show up as literal characters instead of being styled.\n\n" +
	"Links: only ever mention a URL that appears verbatim in the \"Known links\" section " +
	"below the question. Never guess, invent, or reuse a link from a different project, and " +
	"never rely on outside/background knowledge to produce a URL, even one you believe is " +
	"correct — if a project has no entry in Known links, do not include a link for it at " +
	"all. When you do use one or more links, list them together at the very end of your " +
	"answer under a line that reads exactly \"Sources:\", one per line, rather than inline " +
	"in the middle of a sentence.";

async function askGemini(message: string, context: string, links: string, apiKey: string): Promise<string> {
	const prompt = `Context:\n${context || "(no relevant context found)"}\n\nKnown links:\n${links || "(none)"
		}\n\nQuestion: ${message}`;

	const res = await fetchWithRetry(GEMINI_GENERATE_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			// Header, not a `?key=` query param — keeps the key out of URLs
			// that might end up in server logs somewhere along the way.
			"x-goog-api-key": apiKey,
		},
		body: JSON.stringify({
			systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
			contents: [{ parts: [{ text: prompt }] }],
			// Swapped from gemini-3.8-flash to gemini-2.5-flash (2026-09-14) —
			// 3.8-flash was new enough to still be capacity-constrained
			// (Google's own dashboard showed a 20-requests/DAY ceiling on it,
			// vs. a far more established model here) and was throwing 503
			// "high demand" errors even well under that quota. 2.5-flash is
			// the older, far more heavily-provisioned model, at the cost of
			// being a generation behind.
			//
			// Different generation, different thinking control too — this is
			// NOT the thinkingLevel low/medium/high used on 3.x models
			// (that field is 3.x-only; using it on 2.5 risks unexpected
			// behavior per Google's own docs). 2.5-series models instead use
			// thinkingBudget, a token count for hidden reasoning (0–24576,
			// dynamic/-1 by default). thinkingBudget: 0 disables thinking
			// entirely — the actual lowest-latency setting for this model,
			// same goal as "low" was serving on 3.8-flash.
			generationConfig: {
				thinkingConfig: { thinkingBudget: 0 },
			},
		}),
	});

	if (!res.ok) {
		throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
	}

	const data = (await res.json()) as GeminiResponse;
	// Optional chaining down the response shape — any of these levels could
	// be missing (e.g. the model returned nothing usable), so fall back
	// instead of throwing.
	return (
		data.candidates?.[0]?.content?.parts?.[0]?.text ??
		"Sorry, I couldn't generate a response."
	);
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const origin = request.headers.get("Origin");
		const cors = corsHeaders(origin);

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: cors });
		}

		if (url.pathname !== "/chat") {
			return new Response("Not found", { status: 404, headers: cors });
		}
		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405, headers: cors });
		}

		let body: { message?: string };
		try {
			body = await request.json();
		} catch {
			return Response.json({ error: "Body must be valid JSON" }, { status: 400, headers: cors });
		}

		const message = body.message ?? "";
		if (!message.trim()) {
			return Response.json({ error: "message must not be empty" }, { status: 400, headers: cors });
		}

		if (!env.GEMINI_API_KEY || !env.QDRANT_URL || !env.QDRANT_API_KEY) {
			// Misconfiguration, not a client error — 500, not 400.
			return Response.json(
				{ error: "Server misconfigured: missing GEMINI_API_KEY, QDRANT_URL, or QDRANT_API_KEY" },
				{ status: 500, headers: cors }
			);
		}

		let queryVector: number[];
		try {
			queryVector = await embedQuery(message, env.GEMINI_API_KEY);
		} catch (err) {
			console.error("embedQuery failed:", err);
			return Response.json({ error: "Failed to embed the question" }, { status: 502, headers: cors });
		}

		let points: QdrantPoint[];
		try {
			points = await searchQdrant(queryVector, env.QDRANT_URL, env.QDRANT_API_KEY);
		} catch (err) {
			console.error("searchQdrant failed:", err);
			return Response.json({ error: "Failed to search the knowledge base" }, { status: 502, headers: cors });
		}

		const context = buildContext(points);
		const links = buildLinksNote(points);

		try {
			const answer = await askGemini(message, context, links, env.GEMINI_API_KEY);
			return Response.json({ answer }, { headers: cors });
		} catch (err) {
			console.error("askGemini failed:", err);
			return Response.json(
				{ error: "Failed to get a response from the model" },
				{ status: 502, headers: cors }
			);
		}
	},
} satisfies ExportedHandler<Env>;
