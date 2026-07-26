import type { ReactNode } from 'react'

type GlassLinkProps = {
  href: string
  children: ReactNode
  external?: boolean
}

/**
 * Bare text until hovered, when a frosted glass rectangle fades in behind it.
 *
 * The glass lives on its own absolutely-positioned layer so that *opacity*
 * carries the transition. Putting backdrop-filter straight on the link and
 * revealing it with `hover:` snaps instead of fading — a filter cannot
 * interpolate from `none`, so the blur would pop in fully formed.
 *
 * The border is always present and merely transparent, so nothing reflows on
 * hover.
 */
function GlassLink({ href, children, external = false }: GlassLinkProps) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="group relative inline-flex items-center justify-center px-[1.15rem] py-[0.62rem] text-[0.95rem] font-medium text-hero-fg no-underline [text-shadow:0_1px_10px_rgba(8,6,13,0.55)]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 liquid-glass border border-white/30 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <span className="relative">{children}</span>
    </a>
  )
}

/**
 * Sits in the top-right of the hero. Shares the content column's max-width and
 * padding so its right edge lines up with the heading beneath it.
 */
function HeroNav() {
  return (
    <nav
      aria-label="Primary"
      className="absolute inset-x-0 top-0 z-30 mx-auto flex w-full max-w-[2000px] items-center justify-end gap-[0.3rem] px-[clamp(1.5rem,5vw,5rem)] py-[clamp(1rem,1.8vw,1.8rem)] max-md:justify-center max-md:px-[0.75rem]"
    >
      <GlassLink href="#work">View Work</GlassLink>
      <GlassLink href="#contact">Get in Touch</GlassLink>
      {/* Drop the PDF at public/resume.pdf for this to resolve. */}
      <GlassLink href="/resume.pdf" external>
        View Resume
      </GlassLink>
    </nav>
  )
}

export default HeroNav
