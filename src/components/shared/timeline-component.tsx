import {
    useScroll,
    useTransform,
    useReducedMotion,
    motion,
    type MotionProps,
} from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface TimelineEntry {
    title: string
    content: ReactNode
}

/* How far past the viewport's bottom edge an element must cross before it
   reveals — and, since `once` is false, the same boundary it fades back out
   at when scrolled back above. Negative shrinks the effective viewport, so a
   bigger negative number delays the trigger further down the page. This is a
   viewport-relative boundary rather than "% of the element visible", so it
   stays correct even for entries taller than the viewport (an image-heavy
   entry can never satisfy a visible-fraction threshold, but it will always
   eventually cross a fixed line). */
const TRIGGER_MARGIN = '0px 0px -20% 0px'

/**
 * Reveal props for one element as its node comes into view. `once: false`
 * means it plays in reverse — fading back to `initial` — when scrolled back
 * above the trigger line, not just once on first arrival.
 *
 * Returns nothing under prefers-reduced-motion, so elements render at their
 * final state rather than animating.
 */
function reveal(
    reduceMotion: boolean,
    { delay = 0, fromX = 0, fromY = 0, fromScale = 1, duration = 0.6 } = {},
): MotionProps {
    if (reduceMotion) return {}
    return {
        initial: { opacity: 0, x: fromX, y: fromY, scale: fromScale },
        whileInView: { opacity: 1, x: 0, y: 0, scale: 1 },
        viewport: { once: false, margin: TRIGGER_MARGIN },
        transition: { duration, ease: 'easeOut', delay },
    }
}

/**
 * Scroll-linked timeline. Adapted from the Aceternity component: the opaque
 * page background and light-mode text colours were stripped so the pinned
 * SiteBackground shows through, the rail uses the site's water blue, and each
 * entry's content now reveals (and un-reveals) as its node is reached. Dates
 * stay static — only the marker dot and the entry content animate.
 */
export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
    const ref = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState(0)
    const reduceMotion = useReducedMotion() ?? false

    // ResizeObserver rather than a resize listener: entry heights also change
    // when webfonts land or content reflows, not just when the window changes.
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const measure = () => setHeight(el.getBoundingClientRect().height)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    /* Offsets are viewport-relative on BOTH ends, so the scroll range is
       `containerHeight + 0.3 * viewportHeight` — always positive and generous.
       Aceternity's original `['start 10%', 'end 50%']` yields
       `containerHeight - 0.4 * viewportHeight`, which collapses to nothing on a
       short timeline and goes negative on a tall viewport. */
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start 80%', 'end 50%'],
    })

    const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height])
    const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])

    return (
        <div className="w-full" ref={containerRef}>
            <div ref={ref} className="relative mx-auto max-w-5xl pb-10">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="flex justify-start pt-10 md:gap-10 md:pt-32"
                    >
                        <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
                            {/* The node itself pops as the rail arrives. */}
                            <motion.div
                                {...reveal(reduceMotion, {
                                    fromScale: 0.4,
                                    duration: 0.4,
                                })}
                                className="absolute left-3 flex size-10 items-center justify-center rounded-full border border-white/15 bg-hero-ink/70 backdrop-blur-[4px]"
                            >
                                <div className="size-3 rounded-full bg-glass-accent/80" />
                            </motion.div>

                            {/* Dates are always visible — no motion wrapper. */}
                            <h3 className="hidden font-heading text-xl font-bold tracking-[0.04em] text-hero-fg md:block md:pl-20 md:text-4xl">
                                {item.title}
                            </h3>
                        </div>

                        <motion.div
                            {...reveal(reduceMotion, { delay: 0.12, fromY: 28 })}
                            className="relative w-full pl-20 pr-4 md:pl-4"
                        >
                            <h3 className="mb-4 block text-left font-heading text-2xl font-bold tracking-[0.04em] text-hero-fg md:hidden">
                                {item.title}
                            </h3>
                            {item.content}
                        </motion.div>
                    </div>
                ))}

                {/* The rail. Fixed height so the fill can animate against it. */}
                <div
                    style={{ height: height + 'px' }}
                    className="absolute left-8 top-0 w-[2px] overflow-hidden bg-gradient-to-b from-transparent via-white/20 to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
                >
                    <motion.div
                        style={{ height: heightTransform, opacity: opacityTransform }}
                        className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-glass-accent via-glass-edge to-transparent"
                    />
                </div>
            </div>
        </div>
    )
}
