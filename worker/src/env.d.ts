// Declaration merging: this combines with the ambient `interface Env` that
// `worker-configuration.d.ts` generates, adding the secrets we set via
// `.dev.vars` (locally) / `wrangler secret put` (deployed) — neither of
// which wrangler.jsonc knows about, so `npm run cf-typegen` won't pick it
// up on its own. No import/export in this file on purpose: that's what
// keeps it a global augmentation instead of a separate module.
interface Env {
	GEMINI_API_KEY: string;
	QDRANT_URL: string;
	QDRANT_API_KEY: string;
}
