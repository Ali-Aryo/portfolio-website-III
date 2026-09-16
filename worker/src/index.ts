/**
 * Portfolio RAG chatbot — API worker.
 *
 * - Run `npm run dev` in this folder to start a local dev server
 * - Requires GEMINI_API_KEY, QDRANT_URL, QDRANT_API_KEY in .dev.vars locally
 *   (see .dev.vars.example). OPENROUTER_API_KEY is optional — without it,
 *   the chain just drops its last (OpenRouter) fallback tier, primary
 *   Gemini plus the same-key Gemini backup model still work on their own.
 * - Test locally with curl once it's running:
 *     curl -X POST http://localhost:8787/chat \
 *       -H "Content-Type: application/json" \
 *       -d '{"message":"hello"}'
 *
 * M7 pipeline for /chat, per the [[Embeddings & Vector Search]] note:
 *   1. embed the incoming question (RETRIEVAL_QUERY)
 *   2. search Qdrant for the closest stored chunks (pure vector math, no LLM)
 *   3. hand the retrieved chunk text to a generation model as context
 *   4. that model writes the actual answer (only step that touches language)
 *
 * M8: step 4 now tries an ordered list of providers (generateAnswer) rather
 * than a single hard-coded model, so one provider's outage (Gemini's 503s
 * during development) doesn't become a real visitor's error message. Order
 * is: primary Gemini model -> a second, lighter Gemini model under the
 * *same* key (covers a per-model capacity crunch or retirement — the two
 * failures actually hit so far, and each Gemini model gets its own rate
 * limit even under one key/project) -> OpenRouter as a last resort if the
 * whole Gemini API is unreachable.
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

const GEMINI_MODEL = "gemini-3.6-flash";
// Same-key backup: a second, lighter Gemini model tried before ever
// leaving Gemini. Each model gets its own RPM/RPD/TPM bucket even under one
// project/key (confirmed against Google's own rate-limit docs), so this
// genuinely dodges a per-model capacity crunch like the 3.8-flash 503s hit
// earlier — it just can't help if the whole Gemini API is down, since that
// takes every model under this key with it. Verify this id still exists
// and check its own limit in AI Studio before relying on it; model
// names/limits move fast, same lesson as GEMINI_MODEL above.
const GEMINI_BACKUP_MODEL = "gemini-3.5-flash-lite";

function geminiGenerateUrl(model: string): string {
	return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}
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
// to ingest.mjs for the same reason, applied here to every generation-side
// call since they all hit shared upstream infrastructure. The delay is
// wall-clock time spent awaiting a fetch, not CPU time, so it doesn't eat
// into a Worker's CPU-time limit — see [[Cloudflare Workers]].
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

// Shared between every provider below — one prompt-building function means
// a change to how context/links/question are framed can't drift between
// Gemini and a fallback provider without someone noticing.
function buildPrompt(context: string, links: string, message: string): string {
	return `Context:\n${context || "(no relevant context found)"}\n\nKnown links:\n${links || "(none)"
		}\n\nQuestion: ${message}`;
}

// ---- Generation, provider 1: Gemini ---------------------------------------

interface GeminiResponse {
	candidates?: {
		content?: {
			parts?: { text?: string }[];
		};
	}[];
}

async function askGemini(
	message: string,
	context: string,
	links: string,
	apiKey: string,
	model: string
): Promise<string> {
	const prompt = buildPrompt(context, links, message);

	const res = await fetchWithRetry(geminiGenerateUrl(model), {
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
			// Every 3.x-generation Gemini model (both GEMINI_MODEL and
			// GEMINI_BACKUP_MODEL right now) uses thinkingLevel
			generationConfig: {
				thinkingConfig: { thinkingLevel: "low" },
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

// ---- Generation, provider 2 (fallback): OpenRouter ------------------------

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// "openrouter/free" is OpenRouter's own auto-router for its free-tier
// models — it picks whichever currently-available free model best fits the
// request, rather than us hard-coding one specific model id. Deliberate:
// free-tier model lineups here churn fast (this project's own
// gemini-3.5-flash retiring within weeks is the same lesson), so pinning
// one specific OpenRouter free model would just recreate the exact
// staleness problem this fallback exists to protect against.
const OPENROUTER_MODEL = "openrouter/free";

interface OpenRouterResponse {
	choices?: { message?: { content?: string } }[];
}

async function askOpenRouter(
	message: string,
	context: string,
	links: string,
	apiKey: string
): Promise<string> {
	const prompt = buildPrompt(context, links, message);

	const res = await fetchWithRetry(OPENROUTER_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
			// Both optional, but OpenRouter's own docs recommend sending them —
			// identifies the calling app in OpenRouter's own dashboard/logs.
			"HTTP-Referer": "https://ali-shamsi-dev.netlify.app",
			"X-Title": "Ali Shamsi Portfolio Chatbot",
		},
		// OpenAI-compatible chat completions shape — a different request
		// format from Gemini's generateContent (messages[] with roles,
		// instead of a separate systemInstruction field + contents[]). This
		// is the de facto standard interface a huge number of providers and
		// tools speak, worth knowing beyond just this one integration.
		body: JSON.stringify({
			model: OPENROUTER_MODEL,
			messages: [
				{ role: "system", content: SYSTEM_INSTRUCTION },
				{ role: "user", content: prompt },
			],
		}),
	});

	if (!res.ok) {
		throw new Error(`OpenRouter API error: ${res.status} ${await res.text()}`);
	}

	const data = (await res.json()) as OpenRouterResponse;
	return data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
}

// ---- Generation orchestrator: try providers in order ----------------------

interface GenerationAttempt {
	model: string;
	run: () => Promise<string>;
}

// Tries each provider in order and returns the first success, along with
// which model actually answered (surfaced to the client — this is what a
// future "answered by ..." sub-message in the widget would read from).
// Only moves to the next provider on failure; a slow-but-successful primary
// still wins over a fast fallback. Extending this to a third provider later
// is just one more array entry, not a restructure.
async function generateAnswer(
	message: string,
	context: string,
	links: string,
	env: Env
): Promise<{ answer: string; model: string }> {
	const attempts: GenerationAttempt[] = [
		{
			model: GEMINI_MODEL,
			run: () => askGemini(message, context, links, env.GEMINI_API_KEY, GEMINI_MODEL),
		},
		{
			model: GEMINI_BACKUP_MODEL,
			run: () => askGemini(message, context, links, env.GEMINI_API_KEY, GEMINI_BACKUP_MODEL),
		},
	];

	if (env.OPENROUTER_API_KEY) {
		// TS narrowing on `env.OPENROUTER_API_KEY` (now known non-undefined)
		// doesn't survive into the closure below — it only holds for plain
		// variables, not object properties, since TS can't prove the
		// property won't change before the closure actually runs. Binding it
		// to a local const is the standard fix.
		const openRouterKey = env.OPENROUTER_API_KEY;
		attempts.push({
			model: OPENROUTER_MODEL,
			run: () => askOpenRouter(message, context, links, openRouterKey),
		});
	} else {
		console.log("OPENROUTER_API_KEY not set — fallback provider skipped.");
	}

	let lastErr: unknown;
	for (const attempt of attempts) {
		try {
			const answer = await attempt.run();
			return { answer, model: attempt.model };
		} catch (err) {
			console.error(`Generation via ${attempt.model} failed:`, err);
			lastErr = err;
		}
	}
	throw lastErr instanceof Error ? lastErr : new Error("All generation providers failed");
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

		// OPENROUTER_API_KEY is intentionally not required here — it's the
		// fallback provider, not the retrieval pipeline. Missing it just
		// means generateAnswer skips straight to (and only relies on) Gemini.
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
			const { answer, model } = await generateAnswer(message, context, links, env);
			return Response.json({ answer, model }, { headers: cors });
		} catch (err) {
			console.error("generateAnswer failed (all providers):", err);
			return Response.json(
				{ error: "Failed to get a response from the model" },
				{ status: 502, headers: cors }
			);
		}
	},
} satisfies ExportedHandler<Env>;
