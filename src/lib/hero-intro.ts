import type { Variants } from 'framer-motion'

/**
 * Shared choreography for the hero's first-load entrance.
 *
 * The hero section is the variant root: it flips to `visible` once the
 * preloader's slabs have cleared, and every descendant carrying one of these
 * variants inherits that label through Framer's context. Order is therefore
 * expressed purely as delays here rather than as nesting in the JSX, which
 * keeps the markup's structure free to follow the layout.
 *
 * Delays are seconds measured from the moment the hero goes `visible`. The gap
 * before `scrim` is deliberate — it is the beat where the video plays clean,
 * with no wash and no type over it.
 */

/** easeOutQuint. */
const EASE = [0.22, 1, 0.36, 1] as const

export const HERO_DELAY = {
  scrim: 0.35,
  nav: 0.6,
  nameFirst: 0.78,
  nameSecond: 0.9,
  role: 1.08,
  school: 1.18,
  experience: 1.34,
  /** Icons fan out from here, one every SOCIAL_STEP. */
  socials: 1.5,
  status: 1.86,
  scrollCue: 2.0,
} as const

export const SOCIAL_STEP = 0.08

/**
 * Fade-and-rise. `distance` is the travel in pixels — the headline lines use a
 * longer one so they land with more weight than the small print.
 */
export function rise(delay: number, distance = 16): Variants {
  return {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay, ease: EASE },
    },
  }
}

/**
 * The same motion as `rise`, split across two elements.
 *
 * `backdrop-filter` samples whatever is painted behind the element, but only
 * within its "backdrop root" — and an ancestor with opacity below 1 becomes
 * one. So a glass element fading in from an animated wrapper has nothing to
 * sample for the whole entrance, then snaps to its real blur the instant the
 * wrapper reaches exactly 1. That end-of-animation pop is visible on anything
 * frosted: the experience pill and the social buttons.
 *
 * An element's *own* opacity does not do this, and neither does an ancestor
 * transform. So the wrapper keeps the travel and the glass itself takes the
 * fade. Both must be given the same delay to stay one gesture.
 */
export function glassShift(delay: number, distance = 16): Variants {
  return {
    hidden: { y: distance },
    visible: { y: 0, transition: { duration: 0.7, delay, ease: EASE } },
  }
}

/** Partner to `glassShift` — belongs on the frosted element itself. */
export function glassFade(delay: number): Variants {
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.7, delay, ease: EASE } },
  }
}

/**
 * Opacity only, for the scrim. Sliding a full-bleed gradient would drag its
 * edge across the video; this just brings the wash up underneath the type.
 */
export const scrimFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, delay: HERO_DELAY.scrim, ease: 'easeOut' },
  },
}
