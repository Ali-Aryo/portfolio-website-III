import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

/**
 * First-load intro screen. Purely decorative — nothing is actually waiting on
 * it, so the counter is driven by a fixed-duration tween rather than by real
 * load progress.
 *
 * Three beats, deliberately sequential rather than overlapped — the lift only
 * starts once the type is gone, so the staircase is the only thing moving:
 *   1. the wordmark rises in and a 000 -> 100 counter runs the rail across
 *   2. the type and the wash fade back out, leaving flat ink
 *   3. that ink splits into vertical slabs which lift away one after another,
 *      uncovering the hero video that has been playing underneath the whole time
 *
 * Every opaque pixel belongs to a slab. Nothing behind them may carry a
 * background or the lift has nothing to uncover.
 *
 * `onComplete` fires once the last slab has cleared, which is the cue for the
 * hero to begin its own staggered entrance. The parent is expected to unmount
 * this component in response — self-rendering `null` instead would keep the
 * effects alive and leave the scroll lock on for the rest of the session.
 */

/** Vertical slabs the panel breaks into on exit. */
const STAIRS = 8
/** How long the counter takes to reach 100. */
const COUNT_SECONDS = 1.5
/** How long the type and wash take to clear before the lift begins. */
const TYPE_FADE_SECONDS = 0.35
/**
 * Per-slab offset for the lift. Wide enough that the slabs read as a staircase
 * rather than as one panel with soft edges — at a tighter offset than this they
 * travel close enough together to look like a single sheet.
 */
const STAIR_STAGGER = 0.09
const LIFT_SECONDS = 0.8

/**
 * Hard ceiling on the whole intro, in ms — comfortably past the ~3.5s the
 * sequence actually needs.
 *
 * This panel covers the entire site and holds the scroll lock, so anything that
 * strands the animation strands the page with it. Backgrounded tabs are the
 * realistic case: browsers suspend requestAnimationFrame while a tab is hidden,
 * so a load that happens off-screen sits frozen mid-sequence. It does resume on
 * return, but this guarantees the site is reachable either way.
 */
const FAILSAFE_MS = 7000

/** easeOutQuint — the counter sprints early then eases onto 100. */
const EASE_OUT = [0.22, 1, 0.36, 1] as const
/** easeInOutQuart — gives the slabs weight as they leave. */
const EASE_LIFT = [0.76, 0, 0.24, 1] as const

type PreloaderProps = {
  onComplete: () => void
}

function Preloader({ onComplete }: PreloaderProps) {
  const [phase, setPhase] = useState<'counting' | 'exiting'>('counting')
  // onComplete lands in a setState, but the parent may re-render between the
  // stagger starting and finishing — a ref keeps the callback current without
  // the effects below re-running and restarting the animation.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  const count = useMotionValue(0)
  const label = useTransform(count, (v) => String(Math.round(v)).padStart(3, '0'))
  const railWidth = useTransform(count, (v) => `${v}%`)

  useEffect(() => {
    const controls = animate(count, 100, {
      duration: COUNT_SECONDS,
      delay: 0.25,
      ease: EASE_OUT,
      onComplete: () => setPhase('exiting'),
    })
    return () => controls.stop()
  }, [count])

  useEffect(() => {
    const timer = window.setTimeout(() => onCompleteRef.current(), FAILSAFE_MS)
    return () => window.clearTimeout(timer)
  }, [])

  // The page is covered, so there is nothing to scroll to. Locking also stops a
  // trackpad flick during the intro from landing us halfway down the page.
  useEffect(() => {
    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight

    // Hiding the overflow takes the scrollbar with it, which widens the layout
    // viewport — 15px on this machine. Releasing the lock snaps it back, and
    // since the hero video is `object-cover`, a width change recrops it: the
    // background appears to rezoom at the exact moment the slabs finish.
    // Holding the gutter open keeps the page the same width throughout. Zero
    // under overlay scrollbars, where there was never anything to compensate.
    const gutter = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (gutter > 0) body.style.paddingRight = `${gutter}px`

    // A refresh part-way down the page would otherwise reveal the middle of the
    // site behind the slabs. Deep links keep their target.
    if (!window.location.hash) window.scrollTo(0, 0)

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
    }
  }, [])

  return (
    // Transparent on purpose. Giving this element the ink instead of (or as well
    // as) the slabs makes them lift black off identical black: the staircase
    // becomes invisible and the video only appears when the whole panel
    // unmounts, as one hard cut.
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {/* Slabs. Positioned rather than flexed, with a 1px bleed, because
          `flex-1` rounds each width independently and leaves hairline seams of
          video showing through before the lift even starts. */}
      <motion.div
        className="absolute inset-0"
        initial="cover"
        animate={phase === 'exiting' ? 'lift' : 'cover'}
        variants={{
          cover: {},
          lift: {
            transition: {
              delayChildren: TYPE_FADE_SECONDS,
              staggerChildren: STAIR_STAGGER,
            },
          },
        }}
        onAnimationComplete={(definition) => {
          if (definition === 'lift') onCompleteRef.current()
        }}
      >
        {Array.from({ length: STAIRS }, (_, i) => (
          <motion.div
            key={i}
            className="absolute inset-y-0 bg-hero-ink"
            style={{ left: `${(i / STAIRS) * 100}%`, width: `calc(${100 / STAIRS}% + 1px)` }}
            // Both ends are percentages on purpose. A `0` origin against a
            // `-101%` target leaves Framer interpolating px to %.
            variants={{ cover: { y: '0%' }, lift: { y: '-101%' } }}
            transition={{ duration: LIFT_SECONDS, ease: EASE_LIFT }}
          />
        ))}
      </motion.div>

      {/* Keeps the panel from reading as flat black — a cool wash picked from
          the same spray tones as the glass tokens. It layers over the slabs, so
          it has to clear with the type; left up, it would hang over the video
          for the whole reveal. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
        transition={{ duration: TYPE_FADE_SECONDS, ease: 'easeIn' }}
        style={{
          background:
            'radial-gradient(120% 90% at 50% 42%, rgba(143, 195, 224, 0.14) 0%, rgba(143, 195, 224, 0.04) 42%, rgba(8, 6, 13, 0) 72%)',
        }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
        initial={{ opacity: 0, y: 14 }}
        animate={
          phase === 'exiting'
            ? { opacity: 0, y: -10, transition: { duration: TYPE_FADE_SECONDS, ease: 'easeIn' } }
            : { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.15, ease: EASE_OUT } }
        }
      >
        {/* Same split as the hero headline, so the intro and the page it opens
            onto are visibly the same wordmark. */}
        <p className="m-0 font-heading text-[clamp(1.75rem,6vw,3.25rem)] font-bold uppercase tracking-[0.14em] text-hero-fg">
          Ali <span className="text-hero-accent">Shamsi</span>
        </p>

        <div className="mt-[clamp(1.5rem,4vw,2.25rem)] w-[min(420px,74vw)]">
          <div className="h-px w-full overflow-hidden bg-white/15">
            <motion.div
              className="h-full bg-hero-accent shadow-[0_0_10px_var(--color-hero-accent)]"
              style={{ width: railWidth }}
            />
          </div>

          <div className="mt-3 flex items-baseline justify-between font-mono text-[0.7rem] uppercase tracking-[0.32em] text-hero-muted">
            <span>Loading</span>
            {/* tabular-nums stops the counter from jittering the rail's right
                edge as digits change width. */}
            <motion.span className="tabular-nums text-hero-accent">{label}</motion.span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Preloader
