import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'

const FOCUSABLE =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ExperienceModalProps {
    open: boolean
    onClose: () => void
}

/** Shared heading treatment, matching ProjectDetailModal's SectionLabel. */
function SectionLabel({ children }: { children: string }) {
    return (
        <h3 className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-glass-accent">
            {children}
        </h3>
    )
}

/**
 * Detail popup for the "Prev. SWE Co-op at TELUS" pill in the hero.
 *
 * Deliberately mirrors ProjectDetailModal's dialog mechanics (portal, focus
 * trap, Escape to close, scroll lock, focus restore) rather than sharing a
 * generic component with it — the two have different content shapes (one
 * project, no gallery/links) and diverging early keeps each simple.
 */
function ExperienceModal({ open, onClose }: ExperienceModalProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const restoreFocusRef = useRef<HTMLElement | null>(null)
    const reduceMotion = useReducedMotion() ?? false

    useEffect(() => {
        if (!open) return
        const { body, documentElement } = document
        const scrollbar = window.innerWidth - documentElement.clientWidth
        const prevOverflow = body.style.overflow
        const prevPadding = body.style.paddingRight
        body.style.overflow = 'hidden'
        if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
        return () => {
            body.style.overflow = prevOverflow
            body.style.paddingRight = prevPadding
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const previous = document.activeElement
        restoreFocusRef.current =
            previous instanceof HTMLElement && previous !== document.body
                ? previous
                : null
        panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
        return () => {
            const target = restoreFocusRef.current
            if (target?.isConnected) target.focus()
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
                return
            }
            if (event.key !== 'Tab') return
            const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
            if (!focusables?.length) return
            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                    <div
                        className="absolute inset-0 bg-hero-ink/75 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="experience-detail-title"
                        className="relative flex max-h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl liquid-glass border border-white/20 text-glass-text"
                        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}
                    >
                        <button
                            type="button"
                            data-autofocus
                            onClick={onClose}
                            aria-label="Close details"
                            className="absolute right-4 top-4 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full liquid-glass border border-white/25 text-hero-fg transition-colors duration-300 hover:border-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-accent"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="overflow-y-auto overscroll-contain p-6 md:p-10">
                            <div>
                                <h2
                                    id="experience-detail-title"
                                    className="font-heading text-2xl font-semibold tracking-[0.03em] text-hero-fg md:text-3xl [text-shadow:0_1px_10px_rgba(8,6,13,0.45)]"
                                >
                                    Software Engineer Co-op
                                </h2>
                                <p className="mt-2 text-sm tracking-[0.06em] text-glass-accent md:text-base">
                                    TELUS · May 2025 — Dec 2025
                                </p>
                                <ul className="mt-4 flex flex-wrap gap-2">
                                    {['Python', 'Terraform', 'Google Cloud Platform', 'Looker SDK', 'Git'].map((tag) => (
                                        <li
                                            key={tag}
                                            className="rounded-full border border-white/20 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-hero-muted"
                                        >
                                            {tag}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <section className="mt-8">
                                <SectionLabel>Overview</SectionLabel>
                                <p className="text-sm leading-[1.7] text-hero-muted md:text-base">
                                    I safeguarded TELUS’s client data by deploying a scheduled Python Cloud
                                    Function to Google Cloud Platform, provisioned entirely through
                                    Terraform, so every client’s Looker data was backed up automatically
                                    each day rather than depending on anyone remembering to run it by
                                    hand. I cut the team’s reporting overhead by building a Python CLI
                                    tool on the Looker SDK that replaced a set of repetitive manual
                                    reporting tasks with single commands, measured directly in the hours
                                    of routine work it took off the team’s plate. I closed the loop
                                    between those two systems by extending the CLI to mass-export Looker
                                    data as JSON into a Google Cloud Storage bucket, turning it into the
                                    restore path behind the daily backups and giving the team a safer,
                                    faster way to recover a client’s dashboards. And I raised the whole
                                    Agile team’s workflow by writing the first comprehensive
                                    documentation of our Git process — releases, tags, and pull requests
                                    — replacing ad hoc habits with a standard the team adopted going
                                    forward.
                                </p>
                            </section>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    )
}

export default ExperienceModal
