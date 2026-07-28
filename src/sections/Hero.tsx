import { useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import heroVideo from '../assets/hero2.mp4'
import heroPoster from '../assets/hero2.jpeg'
import HeroNav from '../components/shared/hero-nav'
import { GithubIcon, LinkedinIcon } from '../components/shared/brand-icons'

function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)

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
    <section
      id="home"
      className="relative z-10 flex min-h-svh w-full items-center overflow-hidden text-hero-fg max-md:items-end max-md:pb-[12vh]"
    >
      {/* Video background */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
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
        <div className="absolute inset-0 hero-scrim max-md:hero-scrim-mobile" />
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
            <span className="block">Ali</span>
            <span className="block text-hero-accent">Shamsi</span>
          </h1>

          <p className="mt-[1.4rem] font-heading text-[clamp(1.3rem,2.6vw,1.75rem)] font-medium uppercase tracking-[0.16em] text-hero-accent [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]">
            Computer Engineer
          </p>

          <div className="mt-[2.2rem] flex items-center gap-[0.7rem] max-md:justify-center">
            <a
              href="https://github.com/Ali-Aryo"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="inline-flex size-14 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] text-hero-fg backdrop-blur-[4px] transition duration-200 hover:-translate-y-0.5 hover:border-white/55 hover:bg-white/[0.14] motion-reduce:hover:translate-y-0"
            >
              <GithubIcon className="size-6" />
            </a>
            <a
              href="https://www.linkedin.com/in/aoa25"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="inline-flex size-14 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] text-hero-fg backdrop-blur-[4px] transition duration-200 hover:-translate-y-0.5 hover:border-white/55 hover:bg-white/[0.14] motion-reduce:hover:translate-y-0"
            >
              <LinkedinIcon className="size-6" />
            </a>
          </div>

          <p className="mt-[1.6rem] flex items-center gap-[0.55rem] text-[0.9rem] tracking-[0.02em] text-hero-muted max-md:justify-center">
            <span
              className="h-2 w-2 rounded-full bg-[#4ade80] animate-status-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />
            Vancouver, BC · PST
          </p>
        </div>
      </div>

      {/* Bottom furniture. Stacking these means the scroll cue sits directly on
          top of the band without hard-coding the band's height. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center">
        <a
          href="#about"
          aria-label="Scroll to content"
          className="mb-[1.5rem] flex flex-col items-center gap-[0.35rem] no-underline animate-scroll-float motion-reduce:animate-none max-md:hidden"
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
      </div>
    </section>
  )
}

export default Hero
