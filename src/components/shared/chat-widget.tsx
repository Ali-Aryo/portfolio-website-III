import { useState, useRef, useEffect, type FormEvent } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
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
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Keep the panel scrolled to the latest message as the conversation grows.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    }, [messages, loading])

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

            const data: { answer: string } = await res.json()
            setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
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

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {open && (
                <div className="liquid-glass flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col rounded-3xl border border-white/20 p-4 text-hero-fg shadow-xl">
                    <div className="flex items-center justify-between pb-2">
                        <span className="font-heading text-sm font-semibold tracking-[0.04em]">
                            Ask about Ali's work
                        </span>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close chat"
                            className="rounded-full p-1 text-hero-muted transition hover:text-hero-fg"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-2 text-sm">
                        {messages.length === 0 && (
                            <p className="text-hero-muted">
                                Ask me something about Ali's projects — this is still a placeholder
                                echo response until the real LLM call is wired up.
                            </p>
                        )}
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'max-w-[85%] rounded-2xl px-3 py-2',
                                    m.role === 'user'
                                        ? 'ml-auto bg-hero-accent/20 text-hero-fg'
                                        : 'mr-auto bg-white/10 text-hero-fg'
                                )}
                            >
                                {m.content}
                            </div>
                        ))}
                        {loading && <p className="text-hero-muted">Thinking…</p>}
                        {error && <p className="text-red-300">{error}</p>}
                    </div>

                    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message…"
                            className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-hero-fg placeholder:text-hero-muted focus:outline-none focus:ring-1 focus:ring-hero-accent"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            aria-label="Send"
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-hero-accent text-hero-ink transition disabled:opacity-40"
                        >
                            <Send className="size-4" />
                        </button>
                    </form>
                </div>
            )}

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
