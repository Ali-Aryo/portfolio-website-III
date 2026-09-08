import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Maximize2, X } from 'lucide-react'
import type { Project, ProjectImage } from '@/data/projects'

const FOCUSABLE =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ProjectDetailModalProps {
    project: Project | null
    onClose: () => void
}

/** Shared heading treatment for the detail view's sections. */
function SectionLabel({ children }: { children: string }) {
    return (
        <h3 className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-glass-accent">
            {children}
        </h3>
    )
}

/**
 * Detail view for one project, as a modal over the dimmed grid.
 *
 * Open/close state lives in the parent and is mirrored in the URL hash, so this
 * component only handles presentation plus the three things a dialog owes the
 * user: Escape closes it, focus is trapped inside it while open and restored to
 * the trigger afterwards, and the page behind it does not scroll.
 */
function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const restoreFocusRef = useRef<HTMLElement | null>(null)
    const reduceMotion = useReducedMotion() ?? false
    const isOpen = project !== null

    /* The gallery image being viewed full size, layered above this dialog. */
    const [zoomed, setZoomed] = useState<ProjectImage | null>(null)
    const lightboxRef = useRef<HTMLDivElement>(null)
    const zoomTriggerRef = useRef<HTMLElement | null>(null)

    /* Drop the lightbox when the modal closes or switches project — otherwise
       reopening the modal would restore a stale zoomed image. Adjusting state
       during render is React's documented answer for this; an effect would
       either lag a frame or trip the cascading-render rule. */
    const slug = project?.slug ?? null
    const [lastSlug, setLastSlug] = useState(slug)
    if (slug !== lastSlug) {
        setLastSlug(slug)
        setZoomed(null)
    }

    // Freeze the page behind the modal. Padding compensates for the scrollbar
    // that overflow:hidden removes — without it the whole layout jumps left by
    // its width the moment the modal opens.
    useEffect(() => {
        if (!isOpen) return
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
    }, [isOpen])

    // Remember whatever opened the modal so focus can go back there on close —
    // otherwise closing drops the caret at the top of the document and a
    // keyboard user has to tab through the whole page to get back to the grid.
    useEffect(() => {
        if (!isOpen) return
        const previous = document.activeElement
        // <body> is what activeElement reports when nothing is focused; storing
        // it would make the restore below a silent no-op that strands focus on
        // a node we are about to unmount.
        restoreFocusRef.current =
            previous instanceof HTMLElement && previous !== document.body
                ? previous
                : null
        // React has committed the DOM by the time an effect runs, so the node is
        // already there to focus. Deferring to requestAnimationFrame would mean
        // no focus at all on a backgrounded tab, where rAF never fires.
        panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
        return () => {
            const target = restoreFocusRef.current
            if (target?.isConnected) target.focus()
        }
    }, [isOpen])

    // Escape closes; Tab cycles within the panel rather than escaping to the
    // page behind, which is still rendered and still focusable.
    useEffect(() => {
        if (!isOpen) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                // Topmost layer first: Escape in the lightbox returns you to the
                // project, it does not dismiss everything you were reading.
                if (zoomed) setZoomed(null)
                else onClose()
                return
            }
            if (event.key !== 'Tab') return
            // Trap within whichever layer is on top, or Tab would walk into the
            // dialog underneath the lightbox.
            const scope = zoomed ? lightboxRef.current : panelRef.current
            const focusables = scope?.querySelectorAll<HTMLElement>(FOCUSABLE)
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
    }, [isOpen, onClose, zoomed])

    /* Portalled to <body> rather than left inline in the projects section.
       A position:fixed overlay is only reliably viewport-anchored if no
       ancestor creates a containing block — and `transform`, `filter` and
       `backdrop-filter` all do. This page is full of backdrop-filtered glass,
       so rendering in place is a latent bug waiting for someone to wrap the
       grid in one. */
    // Mirrors the dialog's own focus handling one layer up: into the lightbox on
    // open, back to the thumbnail that opened it on close.
    useEffect(() => {
        if (!zoomed) return
        lightboxRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
        return () => {
            const trigger = zoomTriggerRef.current
            if (trigger?.isConnected) trigger.focus()
        }
    }, [zoomed])

    return (
        <>
        {createPortal(
        <AnimatePresence>
            {project && (
                <motion.div
                    // z-50 sits above the z-10 sections and the z-0 backdrop.
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
                        aria-labelledby="project-detail-title"
                        className="relative flex max-h-[90svh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl liquid-glass border border-white/20 text-glass-text"
                        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        // Exit is quicker than enter: leaving should feel like
                        // getting out of the way, not like another animation to
                        // sit through.
                        exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}
                    >
                        <button
                            type="button"
                            data-autofocus
                            onClick={onClose}
                            aria-label="Close project details"
                            className="absolute right-4 top-4 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full liquid-glass border border-white/25 text-hero-fg transition-colors duration-300 hover:border-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-accent"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="overflow-y-auto overscroll-contain">
                            <div className="aspect-video w-full overflow-hidden">
                                <img
                                    src={project.cover}
                                    alt={project.coverAlt}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <div className="flex flex-col gap-8 p-6 md:p-10">
                                <div>
                                    <h2
                                        id="project-detail-title"
                                        className="font-heading text-2xl font-semibold tracking-[0.03em] text-hero-fg md:text-3xl [text-shadow:0_1px_10px_rgba(8,6,13,0.45)]"
                                    >
                                        {project.title}
                                    </h2>
                                    {project.context && (
                                        <p className="mt-2 text-sm tracking-[0.06em] text-glass-accent md:text-base">
                                            {project.context}
                                        </p>
                                    )}
                                    <ul className="mt-4 flex flex-wrap gap-2">
                                        {project.tags.map((tag) => (
                                            <li
                                                key={tag}
                                                className="rounded-full border border-white/20 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-hero-muted"
                                            >
                                                {tag}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Kept up here \u2014 rather than at the bottom of the
                                        write-up \u2014 so the links are visible without
                                        scrolling. Full width under the tags rather than
                                        beside the title: that gap is not reliably wide
                                        enough to hold every link without wrapping oddly. */}
                                    {project.links && project.links.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            {project.links.map((link) => (
                                                <a
                                                    key={link.href}
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group/link inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-glass-accent transition-colors duration-300 hover:border-white/40 hover:text-hero-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-accent"
                                                >
                                                    {link.label}
                                                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {project.overview && (
                                    <section>
                                        <SectionLabel>Overview</SectionLabel>
                                        <p className="text-sm leading-[1.7] text-hero-muted md:text-base">
                                            {project.overview}
                                        </p>
                                    </section>
                                )}

                                {project.highlights && project.highlights.length > 0 && (
                                    <section>
                                        <SectionLabel>What I Built</SectionLabel>
                                        <ul className="flex flex-col gap-3">
                                            {project.highlights.map((highlight) => (
                                                <li
                                                    key={highlight}
                                                    className="flex gap-3 text-sm leading-[1.7] text-hero-muted md:text-base"
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-glass-accent"
                                                    />
                                                    {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {project.gallery && project.gallery.length > 0 && (
                                    <section>
                                        <SectionLabel>Gallery</SectionLabel>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {project.gallery.map((image) => (
                                                <button
                                                    key={image.src}
                                                    type="button"
                                                    aria-label={`View full size: ${image.alt}`}
                                                    onClick={(event) => {
                                                        zoomTriggerRef.current = event.currentTarget
                                                        setZoomed(image)
                                                    }}
                                                    className="group/zoom relative aspect-video w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/15 transition-colors duration-300 hover:border-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-accent"
                                                >
                                                    <img
                                                        src={image.src}
                                                        alt={image.alt}
                                                        loading="lazy"
                                                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/zoom:scale-105"
                                                    />
                                                    {/* Hover alone would leave the
                                                        affordance invisible on touch,
                                                        so the badge is always present
                                                        and merely brightens on hover. */}
                                                    <span
                                                        aria-hidden="true"
                                                        className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full liquid-glass border border-white/25 text-hero-fg opacity-70 transition-opacity duration-300 group-hover/zoom:opacity-100"
                                                    >
                                                        <Maximize2 className="h-3.5 w-3.5" />
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {project.tech && project.tech.length > 0 && (
                                    <section>
                                        <SectionLabel>Tech Stack</SectionLabel>
                                        <ul className="flex flex-wrap gap-2">
                                            {project.tech.map((item) => (
                                                <li
                                                    key={item}
                                                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-hero-fg md:text-sm"
                                                >
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
        )}

        {createPortal(
            <AnimatePresence>
                {project && zoomed && (
                    <motion.div
                        /* Above the dialog's z-50 so it covers it completely —
                           the layer underneath stays mounted and scrolled where
                           it was, so closing returns you to your place. */
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <div
                            className="absolute inset-0 cursor-zoom-out bg-hero-ink/92 backdrop-blur-md"
                            onClick={() => setZoomed(null)}
                            aria-hidden="true"
                        />

                        <motion.div
                            ref={lightboxRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label={zoomed.alt}
                            className="relative flex max-h-full max-w-full flex-col items-center gap-3"
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                            transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
                        >
                            <button
                                type="button"
                                data-autofocus
                                onClick={() => setZoomed(null)}
                                aria-label="Close full size image"
                                className="absolute -top-2 right-0 z-10 grid h-11 w-11 -translate-y-full cursor-pointer place-items-center rounded-full liquid-glass border border-white/25 text-hero-fg transition-colors duration-300 hover:border-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-accent md:-top-3"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* object-contain against viewport-relative caps: the
                                image gets as large as it can without ever being
                                cropped or forcing the page to scroll. */}
                            <img
                                src={zoomed.src}
                                alt={zoomed.alt}
                                className="max-h-[82svh] max-w-[92vw] rounded-xl border border-white/15 object-contain"
                            />
                            <p className="max-w-[92vw] text-center text-sm text-hero-muted">
                                {zoomed.alt}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body,
        )}
        </>
    )
}

export default ProjectDetailModal
