import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import heroVideo from '../assets/hero2.mp4'
import heroPoster from '../assets/hero2-poster.jpg'
import HeroNav from '../components/shared/hero-nav'
import ExperienceModal from '../components/shared/experience-modal'
import { GithubIcon, LinkedinIcon } from '../components/shared/brand-icons'
import { GraduationCap, Mail } from 'lucide-react'
import {
  HERO_DELAY,
  SOCIAL_STEP,
  glassFade,
  glassShift,
  rise,
  scrimFade,
} from '../lib/hero-intro'

type HeroProps = {
  /**
   * Flips true when the preloader has finished, releasing the staggered
   * entrance. Already true on the first render when the intro is skipped
   * (reduced motion), in which case nothing animates at all.
   */
  ready: boolean
}

// The transition list is explicit rather than Tailwind's blanket `transition`,
// which also covers opacity — the property Framer drives on these elements for
// the entrance. Hover only ever changes these three.
const socialLinkClass =
  'inline-flex size-14 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] text-hero-fg backdrop-blur-[4px] transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-white/55 hover:bg-white/[0.14] motion-reduce:hover:translate-y-0'

function Hero({ ready }: HeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [experienceOpen, setExperienceOpen] = useState(false)
  // Captured once: if the hero mounts already-ready there is no entrance to
  // play, and starting from `hidden` would flash the whole column in.
  const [startedReady] = useState(ready)

  // Respect users who prefer reduced motion: keep the poster frame, don't play.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReducedMotion) {
      video.removeAttribute('autoplay')
      video.pause()
    }
  }, [])

  return (
    // Variant root for the entrance. Descendants opt in simply by carrying a
    // `variants` prop — see lib/hero-intro for the running order.
    <motion.section
      id="home"
      className="relative z-10 flex min-h-svh w-full items-center overflow-hidden text-hero-fg max-md:items-end max-md:pb-[12vh]"
      initial={startedReady ? 'visible' : 'hidden'}
      animate={ready ? 'visible' : 'hidden'}
    >
      {/* Video background. Deliberately outside the entrance: it is playing
          behind the preloader and is the first thing the slabs uncover. */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* The poster is frame 0 of hero2.mp4, extracted at the video's own
            2560x1388. It has to match: `object-cover` recrops when the element
            stops painting the poster and starts painting decoded frames, so a
            poster with a different aspect ratio makes the background visibly
            jump the moment playback begins. The old one was hero2.jpeg at
            2752x1536 (1.79 vs 1.84), which read as a ~3% rezoom. */}
        <video
          ref={videoRef}
          className="block h-full w-full object-cover"
          src={heroVideo}
          poster={heroPoster}
          autoPlay
          loop
          muted
          playsInline
        />
        <motion.div
          className="absolute inset-0 hero-scrim max-md:hero-scrim-mobile"
          variants={scrimFade}
        />
      </div>

      <HeroNav />

      {/* Content (right side). The max-width is what keeps the column from
          running to the edge of very wide monitors — without it the text sat at
          ~88% across a 2560px screen, with only 336px left for a 128px headline. */}
      <div className="relative z-10 mx-auto flex w-full max-w-[2000px] justify-end px-[clamp(1.5rem,5vw,5rem)] max-md:justify-center">
        {/* Every row below shares this column's edges — the flex rows only
            re-centre under md, so nothing drifts out of alignment on desktop. */}
        <div className="w-[min(560px,100%)] text-left max-md:w-full max-md:text-center">
          {/* Tracking is positive for Cinzel — the old -0.03em was tuned for
              Geist and crowds an inscriptional serif's wide letterforms. */}
          <h1 className="m-0 font-heading text-[clamp(3.5rem,9vw,8rem)] font-bold leading-[0.95] tracking-[0.01em] text-hero-fg [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]">
            <motion.span className="block" variants={rise(HERO_DELAY.nameFirst, 28)}>
              Ali
            </motion.span>
            <motion.span
              className="block text-hero-accent"
              variants={rise(HERO_DELAY.nameSecond, 28)}
            >
              Shamsi
            </motion.span>
          </h1>

          <motion.p
            className="mt-[1.4rem] font-heading text-[clamp(1.3rem,2.6vw,1.75rem)] font-medium uppercase tracking-[0.16em] text-hero-accent [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]"
            variants={rise(HERO_DELAY.role)}
          >
            Computer Engineer
          </motion.p>
          <motion.p
            className="mt-1 font-heading text-[clamp(1.3rem,2.6vw,1.75rem)] font-medium uppercase tracking-[0.16em] text-hero-accent [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]"
            variants={rise(HERO_DELAY.school)}
          >
            Simon Fraser University
          </motion.p>
          {/* Travel on the wrapper, fade on the frosted button itself — see
              glassShift in lib/hero-intro. */}
          <motion.div
            className="mt-3.5 flex items-center max-md:justify-center"
            variants={glassShift(HERO_DELAY.experience)}
          >
            <motion.button
              type="button"
              onClick={() => setExperienceOpen(true)}
              aria-haspopup="dialog"
              variants={glassFade(HERO_DELAY.experience)}
              className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/20 bg-white/[0.08] px-5 py-2.5 backdrop-blur-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-[background-color,border-color] duration-200 hover:border-white/35 hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-accent"
            >
              <span className="size-2 rounded-full bg-hero-accent shadow-[0_0_8px_var(--color-hero-accent)]" aria-hidden="true" />
              <span className="font-mono text-[clamp(0.92rem,1.8vw,1.12rem)] uppercase tracking-[0.14em] text-hero-fg">
                Prev. SWE Co-op at <span className="font-bold text-hero-accent">TELUS</span>
              </span>
            </motion.button>
          </motion.div>

          <ExperienceModal open={experienceOpen} onClose={() => setExperienceOpen(false)} />

          {/* The travel stays on the wrapper so Framer's inline `transform`
              cannot beat the anchor's own hover lift, while the fade sits on the
              anchor because it is the frosted element. */}
          <div className="mt-[2.2rem] flex items-center gap-[0.7rem] max-md:justify-center">
            <motion.span
              className="inline-flex"
              variants={glassShift(HERO_DELAY.socials + 0 * SOCIAL_STEP)}
            >
              <motion.a
                href="https://github.com/Ali-Aryo"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                variants={glassFade(HERO_DELAY.socials + 0 * SOCIAL_STEP)}
                className={socialLinkClass}
              >
                <GithubIcon className="size-6" />
              </motion.a>
            </motion.span>
            <motion.span
              className="inline-flex"
              variants={glassShift(HERO_DELAY.socials + 1 * SOCIAL_STEP)}
            >
              <motion.a
                href="https://www.linkedin.com/in/aoa25"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                variants={glassFade(HERO_DELAY.socials + 1 * SOCIAL_STEP)}
                className={socialLinkClass}
              >
                <LinkedinIcon className="size-6" />
              </motion.a>
            </motion.span>
            <motion.span
              className="inline-flex"
              variants={glassShift(HERO_DELAY.socials + 2 * SOCIAL_STEP)}
            >
              <motion.a
                href="mailto:aliaryo2004@gmail.com"
                aria-label="Email (Gmail)"
                variants={glassFade(HERO_DELAY.socials + 2 * SOCIAL_STEP)}
                className={socialLinkClass}
              >
                <Mail className="size-6" />
              </motion.a>
            </motion.span>
            <motion.span
              className="inline-flex"
              variants={glassShift(HERO_DELAY.socials + 3 * SOCIAL_STEP)}
            >
              <motion.a
                href="mailto:aoa25@sfu.ca"
                aria-label="Email (SFU)"
                variants={glassFade(HERO_DELAY.socials + 3 * SOCIAL_STEP)}
                className={socialLinkClass}
              >
                <GraduationCap className="size-7" />
              </motion.a>
            </motion.span>
          </div>

          <motion.p
            className="mt-[1.6rem] flex items-center gap-[0.55rem] text-[0.9rem] tracking-[0.02em] text-hero-muted max-md:justify-center"
            variants={rise(HERO_DELAY.status)}
          >
            <span
              className="h-2 w-2 rounded-full bg-[#4ade80] animate-status-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />
            Vancouver, BC · PST
          </motion.p>
        </div>
      </div>

      {/* Bottom furniture. Stacking these means the scroll cue sits directly on
          top of the band without hard-coding the band's height. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center">
        {/* Entrance and the idle float are on separate elements on purpose —
            both are transforms, so sharing one element would have the keyframe
            and Framer's inline style overwrite each other. */}
        <motion.div
          className="mb-[1.5rem] max-md:hidden"
          variants={rise(HERO_DELAY.scrollCue)}
        >
          <a
            href="#work"
            aria-label="Scroll to content"
            className="flex flex-col items-center gap-[0.35rem] no-underline animate-scroll-float motion-reduce:animate-none"
          >
            {/* Opacity is owned by the keyframe alone — tinting the colour too
                stacked with it and bottomed out around 54% over the bright falls. */}
            <span className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-hero-fg [text-shadow:0_1px_3px_rgba(8,6,13,0.9),0_2px_16px_rgba(8,6,13,0.7)]">
              Scroll
            </span>
            <ChevronDown
              className="size-4 text-hero-fg [filter:drop-shadow(0_1px_3px_rgba(8,6,13,0.9))]"
              strokeWidth={2}
              aria-hidden="true"
            />
          </a>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default Hero
