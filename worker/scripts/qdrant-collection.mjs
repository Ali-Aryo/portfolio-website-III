// M6 — run once (safe to re-run: Qdrant just re-applies the same config)
// to create the collection our chunks will live in.
// DONT RE RUN
// Run from worker/:   node scripts/qdrant-collection.mjs

import { readFileSync } from "node:fs";

const devVars = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
function readVar(name) {
	const value = devVars.match(new RegExp(`^${name}=(.+)$`, "m"))?.[1]?.trim();
	if (!value) throw new Error(`${name} not found in worker/.dev.vars`);
	return value;
}

const QDRANT_URL = readVar("QDRANT_URL");
const QDRANT_API_KEY = readVar("QDRANT_API_KEY");
const COLLECTION = "portfolio_chunks";

const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
	method: "PUT",
	headers: { "Content-Type": "application/json", "api-key": QDRANT_API_KEY },
	body: JSON.stringify({
		vectors: {
			size: 768, // must match the output_dimensionality we chose in M5
			distance: "Cosine", // same metric we computed by hand in embedding-demo.mjs
		},
	}),
});

const body = await res.json();
if (!res.ok) {
	throw new Error(`Qdrant error: ${res.status} ${JSON.stringify(body)}`);
}
console.log(`Collection "${COLLECTION}" ready:`, body.result);
