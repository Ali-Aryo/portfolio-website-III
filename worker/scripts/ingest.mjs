// M6 — chunks every project in knowledge/projects.json (overview,
// per-highlight, tech, per-outcome, keywords), embeds each chunk with
// Gemini, and upserts them into Qdrant with metadata so a retrieved chunk
// can be traced back to its source project and section.
//
// Run from worker/:   node scripts/ingest.mjs

import { readFileSync } from "node:fs";

const devVars = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
function readVar(name) {
	const value = devVars.match(new RegExp(`^${name}=(.+)$`, "m"))?.[1]?.trim();
	if (!value) throw new Error(`${name} not found in worker/.dev.vars`);
	return value;
}

const GEMINI_API_KEY = readVar("GEMINI_API_KEY");
const QDRANT_URL = readVar("QDRANT_URL");
const QDRANT_API_KEY = readVar("QDRANT_API_KEY");
const COLLECTION = "portfolio_chunks";

const EMBED_URL =
	"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Free tier for gemini-embedding-001 is capped at 100 requests/minute — we
// have 136 chunks, so we will hit it. Two defenses: a proactive delay
// between calls to mostly avoid tripping the limit at all, and a reactive
// retry (below) that reads Google's own retryDelay instead of guessing.
const EMBED_DELAY_MS = 700;

async function embed(text, attempt = 1) {
	const res = await fetch(EMBED_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
		body: JSON.stringify({
			model: "models/gemini-embedding-001",
			content: { parts: [{ text }] },
			// Everything going into storage is a document, never a query —
			// see the M5 note on why mixing these up silently hurts retrieval.
			taskType: "RETRIEVAL_DOCUMENT",
			output_dimensionality: 768,
		}),
	});

	if (res.status === 429 && attempt <= 4) {
		const body = await res.json().catch(() => null);
		const retryInfo = body?.error?.details?.find((d) =>
			d["@type"]?.includes("RetryInfo")
		);
		const retrySeconds = Number(retryInfo?.retryDelay?.replace("s", "")) || 15 * attempt;
		console.log(
			`  Rate limited (attempt ${attempt}/4) — waiting ${retrySeconds}s per Google's retryDelay...`
		);
		await sleep(retrySeconds * 1000);
		return embed(text, attempt + 1);
	}

	if (!res.ok) throw new Error(`Embedding error: ${res.status} ${await res.text()}`);
	const data = await res.json();
	return data.embedding.values;
}

const projects = JSON.parse(
	readFileSync(new URL("../knowledge/projects.json", import.meta.url), "utf8")
);

// Build the chunk list first (all metadata, no vectors yet) — keeps the
// "what are we chunking into" step separate from "call the embedding API",
// which makes both easier to reason about and to change independently.
//
// tags/domains ride along on every chunk's payload (not embedded into the
// text itself) purely as metadata — cheap to add now, and it's what would
// let a future version filter Qdrant results by tag (e.g. "Hardware" only)
// instead of relying on semantic similarity alone.
const chunks = [];
for (const p of projects) {
	// links rides along so a retrieved chunk can carry a real, citable URL
	// (GitHub, live site) into the final answer instead of the model having
	// to describe the project with no source to point to.
	const meta = {
		slug: p.slug,
		title: p.title,
		tags: p.tags ?? [],
		domains: p.domains ?? [],
		links: p.links ?? [],
	};

	chunks.push({
		...meta,
		section: "overview",
		text: `${p.title}. ${p.summary} ${p.overview}`,
	});

	p.highlights.forEach((highlight, i) => {
		chunks.push({ ...meta, section: `highlight-${i}`, text: `${p.title}: ${highlight}` });
	});

	if (p.tech?.length) {
		chunks.push({
			...meta,
			section: "tech",
			text: `${p.title} was built with: ${p.tech.join(", ")}.`,
		});
	}

	// outcomes are the same shape as highlights (specific, self-contained
	// bullets) and answer a question nothing else here covers: "what came of
	// this / what was the impact" — exactly what a recruiter reading the
	// chatbot's answers is likely to want.
	p.outcomes?.forEach((outcome, i) => {
		chunks.push({ ...meta, section: `outcome-${i}`, text: `${p.title}: ${outcome}` });
	});

	// keywords are mostly redundant with the overview/highlight prose (that's
	// deliberate — good writing doesn't read like a tag cloud), so folding
	// them into an existing chunk would just dilute it. The few that earn
	// their keep are acronyms/model numbers/shorthand that never make it into
	// natural sentences (e.g. "RP2040", "FSR") but that a technical visitor
	// might type literally — a dedicated chunk gets that literal token into
	// the embedding space without disturbing the chunks meant to answer
	// "what is this project".
	if (p.keywords?.length) {
		chunks.push({
			...meta,
			section: "keywords",
			text: `${p.title} is also known by or related to: ${p.keywords.join(", ")}.`,
		});
	}
}

console.log(`Embedding and upserting ${chunks.length} chunks from ${projects.length} projects...`);

// Upsert one point at a time, right after it's embedded, instead of
// collecting everything and sending one big PUT at the end. That original
// approach meant a crash partway through (e.g. the rate limit above) threw
// away every embedding computed before it — nothing had actually reached
// Qdrant yet. Per-point upserts mean progress survives a crash, and
// re-running is safe: ids are deterministic (index + 1) and content is
// unchanged, so Qdrant just overwrites the same points rather than
// duplicating them.
for (const [i, chunk] of chunks.entries()) {
	const vector = await embed(chunk.text);
	const point = { id: i + 1, vector, payload: chunk };

	const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", "api-key": QDRANT_API_KEY },
		body: JSON.stringify({ points: [point] }),
	});
	if (!res.ok) {
		throw new Error(`Qdrant upsert error: ${res.status} ${JSON.stringify(await res.json())}`);
	}

	console.log(`  [${i + 1}/${chunks.length}] ${chunk.title} (${chunk.section})`);
	await sleep(EMBED_DELAY_MS);
}

console.log(`\nUpserted ${chunks.length} points into "${COLLECTION}".`);
