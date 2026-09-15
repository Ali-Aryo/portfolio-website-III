// M5 demo — not part of the deployed Worker. Plain Node script (Node 22 has
// `fetch` built in, so no dependencies) to see what an embedding actually is
// and watch similarity search work, before we wire any of this into Qdrant.
//
// Run from worker/:   node scripts/embedding-demo.mjs

import { readFileSync } from "node:fs";

// Reuses the GEMINI_API_KEY you already set up for M4 — reads it straight
// out of .dev.vars instead of asking you to paste it anywhere new.
const devVars = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
const apiKey = devVars.match(/^GEMINI_API_KEY=(.+)$/m)?.[1]?.trim();
if (!apiKey) {
	throw new Error("GEMINI_API_KEY not found in worker/.dev.vars — did M4's setup complete?");
}

const EMBED_URL =
	"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

// taskType matters a lot for retrieval quality and is easy to forget: a
// query ("has Ali built anything with sensors?") and a document (a project
// summary) play different roles, so Gemini optimizes their embeddings
// differently depending on which one you say you're embedding. Skip this
// and both get a generic, unoptimized embedding — which is exactly what
// produced the confusing first ranking.
async function embed(text, taskType) {
	const res = await fetch(EMBED_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
		body: JSON.stringify({
			model: "models/gemini-embedding-001",
			content: { parts: [{ text }] },
			taskType,
			// 768 of a possible 128-3072 — plenty of precision for a handful
			// of project write-ups, cheaper to store than the 3072 default.
			output_dimensionality: 768,
		}),
	});
	if (!res.ok) {
		throw new Error(`Embedding API error: ${res.status} ${await res.text()}`);
	}
	const data = await res.json();
	// embedContent (singular — one input) responds with `embedding.values`.
	// Easy to mix up: batchEmbedContents (plural, many inputs at once)
	// responds with `embeddings[]` instead. My first draft used the plural
	// shape here by mistake — the fix is the field name, not the API call.
	return data.embedding.values;
}

// Cosine similarity: how "aligned" two vectors are, ignoring their length —
// 1 = pointing the same direction (near-identical meaning), 0 = unrelated,
// -1 = opposite. This is the actual math a vector DB runs under the hood.
function cosineSimilarity(a, b) {
	let dot = 0, normA = 0, normB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Real text, straight out of src/data/projects.ts — three project summaries
// with genuinely different subject matter (hardware, client web work,
// computer vision) so the ranking below is easy to sanity-check by eye.
const chunks = [
	{
		title: "PaddlePal",
		text: "PaddlePal Connect is a companion iOS app (Expo + React Native + TypeScript, Firebase Auth/Firestore) for a smart pickleball paddle whose handle embeds four force-sensitive resistor (FSR) zones sampled by an Arduino Nano RP2040 Connect and streamed over Bluetooth Low Energy. The app decodes each hit in real time to show shot zone, power (bucketed low/medium/high/super from the FSR peak), and shot type — Drive, Drop, Dink, Overhead, or Rally — classified on-device at session end by a rule-based cascade over peak gyro magnitude, force, windup duration, and zone from a trailing IMU (Inertial Meserment Sensor) window. Firmware runs a dual-core split (Core 0: IMU/BLE/motor feedback, Core 1: isolated FSR polling with hysteresis peak-hold hit detection) hardened by a 4-second hardware watchdog auto-reboot after a hard-to-root-cause I2C stall. The app ships a dark glassmorphic 'Kinetic Precision' design system, BLE auto-connect/reconnect, a seven-step in-context onboarding tour, and Firestore-backed session history with shots-per-zone and shot-type charts. A separate React 19 + Vite + Tailwind marketing site (PaddlePal-LandingPage-II) covers hero, technology, app, features, demo, and team sections. Built by Ali Shamsi, Peter Phuc, Salem Alsaiari, Robert Truong, and Allen Shapiro as a capstone project; completed and graded A on 2026-09-04.",
	},
	{
		title: "Saba Consulting Landing Page",
		text: "The SABA Management Consulting landing page is a single-page, dark-themed Next.js 16 (App Router, TypeScript, Tailwind CSS v4) marketing site built by Saeed for his own AI-infrastructure consulting practice, using a bespoke 'Obsidian Architect' design system: near-black background, glassmorphism via backdrop-blur cards, no hard borders (tonal shifts instead), and ghost borders at ≤15% opacity. It positions SABA as 'the bridge between AI demand and infrastructure supply,' converting abstract AI demand signals and fragmented site options into structured deals, and speaks to three audiences at once: AI-native labs and enterprise AI teams needing GPU capacity and power-ready sites, LPS providers (land, power, and shell owners) needing qualified AI offtakers and bankable contracts, and neo-clouds or capital partners needing de-risked infrastructure opportunities. Page sections run Header, Hero (typing-effect headline cycling through phrases like 'Execution for AI Cluster Deals' and 'Sovereign AI Compute'), Positioning, Core Competencies, Global Insights, and a Contact section with a React Hook Form + Zod lead-capture form (name, work email, inquiry focus) submitting to Netlify Forms with honeypot spam protection. Built end-to-end in a single day, 2026-04-21; deployed on Netlify via pnpm; complete and live with no further activity since.",
	},
	{
		title: "SteadyScript",
		text: "SteadyScript is a biofeedback pen and webapp for real-time hand-tremor tracking, built for fine-motor therapy for people with Parkinson's disease, stroke survivors, and people with acquired brain injuries. A colored marker on a pen is tracked through browser webcam frames streamed over WebSocket to a Python FastAPI backend, which runs OpenCV HSV color segmentation at roughly 30 FPS to locate the marker each frame; a custom lateral jitter detection algorithm — the team's core technical contribution — computes stability and tremor metrics that separate involuntary wobble from intentional hand motion. Results stream back to a React 18/19 + TypeScript + Vite + Tailwind + Framer Motion frontend as a live MJPEG overlay with a running stability score and Recharts session-history graphs, while an Arduino Uno driven over PySerial gives physical LED feedback so users can train eyes-free without watching a screen. Session flow runs a tremor baseline test, metronome-synced mobility tests, and a performance summary, across Learn, Practice, Review, and an optional Trace mode. Built by Aiko Sumarno, Danish Hakim, Ali-Aryo Otufat-Shamsi, and Anthony Chan at nwHacks 2026, where it won Best Beginner Project and Best Wellness-Related Hack (PCCA).",
	},
];

const query = "Has Ali built a website?";

console.log(`Query: "${query}"\n`);

const queryVec = await embed(query, "RETRIEVAL_QUERY");
console.log(`Embedding is a plain array of ${queryVec.length} numbers. First 5: [${queryVec.slice(0, 5).map((n) => n.toFixed(4)).join(", ")}, ...]\n`);

const ranked = [];
for (const chunk of chunks) {
	const vec = await embed(chunk.text, "RETRIEVAL_DOCUMENT");
	ranked.push({ ...chunk, score: cosineSimilarity(queryVec, vec) });
}
ranked.sort((a, b) => b.score - a.score);

console.log("Ranked by similarity to the query:");
for (const { title, score } of ranked) {
	console.log(`  ${score.toFixed(4)}  ${title}`);
}
