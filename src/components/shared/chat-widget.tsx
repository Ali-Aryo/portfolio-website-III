import {
    useState,
    useRef,
    useEffect,
    Fragment,
    type FormEvent,
    type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MessageCircle, X, Send, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    // Which provider/model actually produced this answer. Optional because
    // user messages never have one, and because the Worker's fallback chain
    // (Gemini -> backup Gemini -> OpenRouter) is the only thing that knows
    // the value — an older/erroring response simply omits it.
    model?: string
}

// Anchored on the scheme rather than on bare `www.`/domain-shaped text: the
// Worker's SYSTEM_INSTRUCTION only ever lets the model emit URLs that appear
// verbatim in the retrieved "Known links" block, and every one of those is a
// full https:// URL. A looser pattern would only add false positives
// ("Node.js", "3.6-flash") without ever catching a real extra link.
const URL_PATTERN = /(https?:\/\/[^\s<>]+)/g

// Trailing punctuation belongs to the sentence, not the URL — "see
// https://example.com/a." ends a sentence. Closing brackets get the same
// treatment for the same reason.
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/

/**
 * Split plain-text answer prose into text + clickable links.
 *
 * The answers come back as plain prose on purpose (no Markdown — the widget
 * has no parser, see the Worker's formatting rule), with any URLs collected
 * into a trailing "Sources:" block. That makes a scheme-anchored split all
 * that's needed here: no Markdown link syntax to unwrap, no HTML to sanitise.
 * Rendering real <a> elements rather than injecting HTML also means model
 * output can never become markup.
 */
function renderWithLinks(text: string): ReactNode[] {
    // String.split with a capturing group alternates plain text (even index)
    // and captured URLs (odd index), and ignores the regex's lastIndex, so
    // the shared /g pattern above is safe to reuse across calls.
    return text.split(URL_PATTERN).map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>

        const trailing = part.match(TRAILING_PUNCTUATION)?.[0] ?? ''
        const href = trailing ? part.slice(0, -trailing.length) : part

        return (
            <Fragment key={i}>
                <a
                    href={href}
                    // New tab: the chat panel holds an in-progress
                    // conversation, and navigating away in place would throw
                    // it out. `noopener noreferrer` matches the convention
                    // every other external link on the site uses
                    // (project-detail-modal, Hero, site-footer).
                    target="_blank"
                    rel="noopener noreferrer"
                    // break-all, not break-words: a long URL has no spaces to
                    // wrap at, so it would otherwise blow out the 22rem
                    // compact panel's width.
                    className="break-all text-glass-accent underline decoration-glass-accent/40 underline-offset-2 transition-colors hover:text-hero-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-accent"
                >
                    {href}
                </a>
                {trailing}
            </Fragment>
        )
    })
}

// Rotated beside the input's "Type a message…" so a first-time visitor sees
// the kind of question the bot is actually good at (grounded in project
// data) instead of facing a blank box.
const EXAMPLE_PROMPTS = [
    'Has Ali ever worked with Python?',
    "What was Ali's capstone project?",
    "Which of Ali's projects have been deployed?",
]
const EXAMPLE_INTERVAL_MS = 3500

/**
 * One example prompt at a time, swapped every few seconds. Only mounted while
 * the input is empty, so the interval lives exactly as long as it's visible —
 * mount/unmount handles start/stop, no extra state in ChatWidget.
 */
function CyclingExample({ className }: { className?: string }) {
    const [index, setIndex] = useState(0)
    const reduceMotion = useReducedMotion() ?? false

    useEffect(() => {
        const id = setInterval(
            () => setIndex((i) => (i + 1) % EXAMPLE_PROMPTS.length),
            EXAMPLE_INTERVAL_MS
        )
        return () => clearInterval(id)
    }, [])

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.span
                key={index}
                // inline-block: a y-transform does nothing on a plain inline
                // span, and truncate needs a box of its own to clip against.
                className={cn('inline-block max-w-full truncate align-top italic', className)}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
            >
                e.g. “{EXAMPLE_PROMPTS[index]}”
            </motion.span>
        </AnimatePresence>
    )
}

// Vite only exposes env vars prefixed VITE_ to client code (see .env) —
// anything else stays server-side only, which is the whole reason secrets
// live in the Worker (env.GEMINI_API_KEY, later) and never here.
const API_URL = import.meta.env.VITE_CHAT_API_URL

/**
 * Floating chat widget — toggle button + panel, styled with the same
 * liquid-glass / hero-* tokens the rest of the page uses. Fixed-position,
 * so where it's rendered in the JSX tree doesn't matter, only that it's
 * rendered once.
 */
function ChatWidget() {
    const [open, setOpen] = useState(false)
    const [fullscreen, setFullscreen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Keep the panel scrolled to the latest message as the conversation grows.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    }, [messages, loading])

    // Full screen is a view of the same conversation, not a separate mode to
    // keep around once the chat itself is closed — closing the widget while
    // full screen would otherwise reopen full screen next time, surprising.
    // Reset during render rather than in an effect: same pattern (and the
    // same reasoning) as project-detail-modal.tsx's lastSlug/setZoomed reset
    // — an effect here would either lag a frame or trip the
    // cascading-render lint, and this is React's documented answer for
    // "some state needs to reset when a prop/other state changes."
    const [lastOpen, setLastOpen] = useState(open)
    if (open !== lastOpen) {
        setLastOpen(open)
        if (!open) setFullscreen(false)
    }

    // Escape backs out of full screen first, same "topmost layer first"
    // convention as project-detail-modal's lightbox-over-dialog handling.
    useEffect(() => {
        if (!fullscreen) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                setFullscreen(false)
            }
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [fullscreen])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        const trimmed = input.trim()
        if (!trimmed || loading) return

        setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
        setInput('')
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed }),
            })

            if (!res.ok) {
                throw new Error(`Worker responded with ${res.status}`)
            }

            // `model` is which provider in the Worker's fallback chain
            // actually answered. Optional on the wire so a Worker that
            // predates it (or any future error path) still parses cleanly.
            const data: { answer: string; model?: string } = await res.json()
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.answer, model: data.model },
            ])
        } catch (err) {
            // A CORS rejection and a network failure both surface here as a
            // generic "Failed to fetch" TypeError — the browser console has
            // the real reason (check the Network tab / console for the
            // actual CORS error message), this catch just can't see it.
            console.error(err)
            setError('Could not reach the chat API — check the console for details.')
        } finally {
            setLoading(false)
        }
    }

    // Shared between both sizes — only the wrapping container differs (see
    // `panel` below). Keeping one copy means the compact <-> full screen
    // toggle can never let the two views drift apart.
    const panelBody = (
        <>
            <div className="flex items-center justify-between pb-2">
                <span className="font-heading text-sm font-semibold tracking-[0.04em]">
                    Ask about Ali's work
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setFullscreen((v) => !v)}
                        aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
                        className="rounded-full p-1 text-hero-muted transition hover:text-hero-fg"
                    >
                        {fullscreen ? (
                            <Minimize2 className="size-4" />
                        ) : (
                            <Maximize2 className="size-4" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close chat"
                        className="rounded-full p-1 text-hero-muted transition hover:text-hero-fg"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto py-2 text-sm"
            >
                {messages.length === 0 && (
                    <p className="text-hero-muted">
                        Hi! Ask me anything about Ali's projects — what he built, the tech
                        behind it, and how it turned out. Answers come straight from his
                        portfolio, with links to the code or live site where there are any.
                    </p>
                )}
                {messages.map((m, i) => (
                    // Column wrapper rather than the bubble sitting directly
                    // in the list: the "answered by" line has to sit under
                    // the bubble and share its side, which an ml-auto/mr-auto
                    // bubble alone can't express for two stacked elements.
                    <div
                        key={i}
                        className={cn(
                            'flex flex-col',
                            m.role === 'user' ? 'items-end' : 'items-start'
                        )}
                    >
                        <div
                            className={cn(
                                // whitespace-pre-wrap so the answer's own line
                                // breaks survive — the "Sources:" block the
                                // Worker asks for is one link per line, which
                                // would otherwise collapse into one run-on line.
                                'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2',
                                m.role === 'user'
                                    ? 'bg-hero-accent/20 text-hero-fg'
                                    : 'bg-white/10 text-hero-fg'
                            )}
                        >
                            {m.role === 'assistant' ? renderWithLinks(m.content) : m.content}
                        </div>
                        {m.model && (
                            <span className="mt-1 px-3 font-mono text-[0.68rem] tracking-[0.04em] text-hero-muted">
                                Answered by {m.model}
                            </span>
                        )}
                    </div>
                ))}
                {loading && <p className="text-hero-muted">Thinking…</p>}
                {error && <p className="text-red-300">{error}</p>}
            </div>

            <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        // Full screen draws its own placeholder overlay (below),
                        // so the accessible name can't rely on `placeholder`.
                        aria-label="Type a message"
                        placeholder={fullscreen ? undefined : 'Type a message…'}
                        className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-hero-fg placeholder:text-hero-muted focus:outline-none focus:ring-1 focus:ring-hero-accent"
                    />
                    {/* Full screen has the width for the example to sit right
                        beside "Type a message…" inside the input. A native
                        placeholder can't animate or style half its text, hence
                        the overlay. aria-hidden: the input has its own label,
                        and re-announcing a new example every few seconds would
                        just be noise; pointer-events-none so clicks reach the
                        input underneath. */}
                    {fullscreen && !input && (
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-4 right-4 flex items-center gap-1.5 overflow-hidden text-sm text-hero-muted"
                        >
                            <span className="shrink-0">Type a message…</span>
                            <CyclingExample className="min-w-0" />
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label="Send"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-hero-accent text-hero-ink transition disabled:opacity-40"
                >
                    <Send className="size-4" />
                </button>
            </form>
            {/* The compact panel's input is ~120px short of fitting even the
                shortest example beside "Type a message…" (measured), so there
                it gets its own line under the input instead. Fixed height and
                always rendered, so the message list above doesn't jump by a
                line every time the visitor starts or clears their typing. */}
            {!fullscreen && (
                <p aria-hidden="true" className="mt-1.5 h-4 px-4 text-xs text-hero-muted">
                    {!input && <CyclingExample />}
                </p>
            )}
        </>
    )

    // Compact: the small corner panel, unchanged from before.
    const compactPanel = (
        <div className="liquid-glass flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col rounded-3xl border border-white/20 p-4 text-hero-fg shadow-xl">
            {panelBody}
        </div>
    )

    const fullscreenPanel = createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <div
                className="absolute inset-0 bg-hero-ink/75 backdrop-blur-sm"
                onClick={() => setFullscreen(false)}
                aria-hidden="true"
            />
            <div className="liquid-glass relative flex h-[90svh] w-full max-w-4xl flex-col rounded-3xl border border-white/20 p-6 text-hero-fg shadow-xl">
                {panelBody}
            </div>
        </div>,
        document.body
    )

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {open && !fullscreen && compactPanel}
            {open && fullscreen && fullscreenPanel}

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Close chat' : 'Open chat'}
                className="liquid-glass inline-flex size-14 items-center justify-center rounded-full border border-white/20 text-hero-fg shadow-xl transition hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
                {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
            </button>
        </div>
    )
}

export default ChatWidget
