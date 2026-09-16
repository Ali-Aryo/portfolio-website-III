// Declaration merging: this combines with the ambient `interface Env` that
// `worker-configuration.d.ts` generates, adding the secrets we set via
// `.dev.vars` (locally) / `wrangler secret put` (deployed) — neither of
// which wrangler.jsonc knows about, so `npm run cf-typegen` won't pick it
// up on its own — `cf-typegen` passes `--env-file=/dev/null` on purpose so
// it *doesn't* scrape .dev.vars either, which would re-declare these as
// required strings and clash with OPENROUTER_API_KEY being optional here.
// Real bindings from wrangler.jsonc (CHAT_RATE_LIMITER) still come from
// the generated file. No import/export in this file on purpose: that's what
// keeps it a global augmentation instead of a separate module.
interface Env {
	GEMINI_API_KEY: string;
	QDRANT_URL: string;
	QDRANT_API_KEY: string;
	// Optional — the fallback generation provider (M8). Its absence just
	// means generateAnswer() skips straight to relying on Gemini alone.
	OPENROUTER_API_KEY?: string;
	// Required — the Worker returns 500 without it rather than skip the bot
	// check. Locally, Cloudflare's always-pass test secret (.dev.vars.example).
	TURNSTILE_SECRET_KEY: string;
}
