/**
 * Cloudflare Turnstile — proves a /chat request came from a real browser on
 * this site, not a script calling the Worker directly (which CORS can't
 * stop). The Worker rejects any message without a valid, unused token.
 *
 * One fresh token per message: tokens are single-use and expire after five
 * minutes, so rendering a throwaway widget each time is simpler than keeping
 * one alive and tracking expiry/reset.
 *
 * The widget is in Managed mode (set in the Cloudflare dashboard), which can
 * ask a visitor it's unsure about to tick a checkbox. `interaction-only`
 * keeps it hidden for everyone else, so the container passed in has to be
 * somewhere the visitor can actually see and click — inside the chat panel,
 * not an offscreen element. Also works unchanged if the dashboard mode is
 * ever switched to Invisible (appearance is simply ignored there).
 */

interface TurnstileRenderOptions {
    sitekey: string
    callback: (token: string) => void
    // Returning true tells Turnstile the error was handled here, so it
    // doesn't also log its own console error.
    'error-callback': (errorCode: string) => boolean
    'before-interactive-callback': () => void
    // Fired by Turnstile when a shown checkbox isn't completed in time.
    'timeout-callback': () => void
    'unsupported-callback': () => void
    appearance: 'always' | 'execute' | 'interaction-only'
    theme: 'auto' | 'light' | 'dark'
    // Fail straight to error-callback instead of retrying in the background,
    // so a broken check surfaces as a message instead of a hang.
    retry: 'auto' | 'never'
    'refresh-expired': 'auto' | 'manual' | 'never'
}

interface TurnstileApi {
    render(container: HTMLElement, options: TurnstileRenderOptions): string | null | undefined
    remove(widgetId: string): void
}

declare global {
    interface Window {
        turnstile?: TurnstileApi
    }
}

// render=explicit: don't scan the page for widgets on load — they're only
// ever created from code, below.
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// Public by design (it ships in the page either way). Locally this is one of
// Cloudflare's test keys (see .env); the real key goes in for the production
// build at deploy time.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

// How long the automatic (no-checkbox) check gets before giving up, so a
// blocked script can't leave the chat on "Thinking…" forever. Cleared once a
// checkbox is shown — a person needs longer than a background check, and
// Turnstile's own timeout-callback covers an abandoned checkbox instead.
const AUTO_CHECK_TIMEOUT_MS = 15_000

let scriptPromise: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
    if (window.turnstile) return Promise.resolve(window.turnstile)
    scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = SCRIPT_URL
        script.onload = () =>
            window.turnstile
                ? resolve(window.turnstile)
                : reject(new Error('Turnstile script loaded without window.turnstile'))
        script.onerror = () => {
            // Forget the failed attempt so the next message can try again
            // (e.g. after a flaky connection recovers).
            scriptPromise = null
            script.remove()
            reject(new Error('Failed to load the Turnstile script'))
        }
        document.head.appendChild(script)
    })
    return scriptPromise
}

/**
 * Start downloading the Turnstile script ahead of time (called when the chat
 * opens), so the first message doesn't also wait on a script download.
 * Failures are ignored here — getTurnstileToken retries and reports them.
 */
export function preloadTurnstile(): void {
    loadTurnstile().catch(() => {})
}

/**
 * Get a fresh, single-use token to send with one /chat request.
 *
 * @param container Visible element the widget renders into. Stays empty
 *   unless Cloudflare decides this visitor needs to tick a checkbox.
 * @param onInteractive Called if that checkbox is about to be shown, so the
 *   UI can tell the visitor why their message is waiting.
 */
export async function getTurnstileToken(
    container: HTMLElement,
    onInteractive?: () => void
): Promise<string> {
    const turnstile = await loadTurnstile()
    // A child element per call, so remove() below always leaves the
    // caller's container exactly as it found it.
    const host = document.createElement('div')
    container.appendChild(host)
    let widgetId: string | null | undefined

    try {
        return await new Promise<string>((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error('Turnstile timed out')),
                AUTO_CHECK_TIMEOUT_MS
            )
            const fail = (reason: string) => {
                clearTimeout(timer)
                reject(new Error(reason))
            }
            widgetId = turnstile.render(host, {
                sitekey: SITE_KEY,
                callback: (token) => {
                    clearTimeout(timer)
                    resolve(token)
                },
                'error-callback': (errorCode) => {
                    fail(`Turnstile error ${errorCode}`)
                    return true
                },
                'before-interactive-callback': () => {
                    clearTimeout(timer)
                    onInteractive?.()
                },
                'timeout-callback': () => fail('Turnstile checkbox was not completed in time'),
                'unsupported-callback': () => fail('Browser not supported by Turnstile'),
                appearance: 'interaction-only',
                // Matches the site, which is dark-only.
                theme: 'dark',
                retry: 'never',
                'refresh-expired': 'never',
            })
        })
    } finally {
        if (widgetId) turnstile.remove(widgetId)
        host.remove()
    }
}
