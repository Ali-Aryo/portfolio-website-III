import { useEffect, useRef } from 'react'
import heroVideo from '../assets/hero25.mp4'
import heroPoster from '../assets/hero-poster.jpg'

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
      className="relative flex min-h-svh w-full items-center justify-end overflow-hidden text-hero-fg max-md:items-end max-md:justify-center max-md:pb-[12vh]"
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

      {/* Content (right side) */}
      <div className="relative z-10 w-[min(560px,90%)] px-[clamp(1.5rem,6vw,7rem)] text-left ml-auto max-md:ml-0 max-md:w-full max-md:text-center">
        <p className="mb-[1.1rem] text-[clamp(0.8rem,1.4vw,0.95rem)] font-medium uppercase tracking-[0.16em] text-hero-accent [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]">
          Computer Engineer · Software Engineer
        </p>

        <h1 className="m-0 font-heading text-[clamp(3.5rem,9vw,8rem)] font-bold leading-[0.92] tracking-[-0.03em] text-hero-fg [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]">
          <span className="block">Ali</span>
          <span className="block text-hero-accent">Shamsi</span>
        </h1>

        <p className="mt-[1.6rem] max-w-[42ch] text-[clamp(1rem,1.5vw,1.15rem)] leading-[1.55] text-hero-muted [text-shadow:0_1px_14px_rgba(0,0,0,0.5)] max-md:mx-auto">
          Fourth-year Computer Engineering student in Vancouver, building
          thoughtful, well-crafted software — and always learning.
        </p>

        <div className="mt-[2.2rem] flex flex-wrap gap-[0.85rem] max-md:justify-center">
          <a
            href="#work"
            className="inline-flex items-center justify-center rounded-full bg-hero-fg px-[1.6rem] py-[0.8rem] text-[0.98rem] font-semibold text-hero-ink no-underline shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-10px_rgba(0,0,0,0.7)] motion-reduce:hover:translate-y-0"
          >
            View Work
          </a>
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/[0.06] px-[1.6rem] py-[0.8rem] text-[0.98rem] font-semibold text-hero-fg no-underline backdrop-blur-[4px] transition duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/[0.14] motion-reduce:hover:translate-y-0"
          >
            Get in Touch
          </a>
        </div>

        <p className="mt-[2.4rem] flex items-center gap-[0.55rem] text-[0.9rem] tracking-[0.02em] text-hero-muted max-md:justify-center">
          <span
            className="h-2 w-2 rounded-full bg-[#4ade80] animate-status-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
          Vancouver, BC · PST
        </p>
      </div>
    </section>
  )
}

export default Hero
