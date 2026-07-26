import { useLayoutEffect, useRef, useState, type CSSProperties, type Ref } from 'react'
import {
  Boxes,
  Code,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Palette,
  Terminal,
  type LucideIcon,
} from 'lucide-react'

type Skill = {
  label: string
  Icon: LucideIcon
}

/* Placeholders — swap for real skills and icons. Any lucide-react icon works,
   and the count is free: both the copy count and the speed are measured. */
const SKILLS: Skill[] = [
  { label: 'TypeScript', Icon: Code },
  { label: 'React', Icon: Layers },
  { label: 'Python', Icon: Terminal },
  { label: 'PostgreSQL', Icon: Database },
  { label: 'Git', Icon: GitBranch },
  { label: 'C / C++', Icon: Cpu },
  { label: 'Docker', Icon: Boxes },
  { label: 'UI Design', Icon: Palette },
]

/* Deriving the duration from a speed keeps the pace identical no matter how
   many skills are in the list. */
const SPEED_PX_PER_SECOND = 40

function SkillList({
  listRef,
  ariaHidden = false,
}: {
  listRef?: Ref<HTMLUListElement>
  ariaHidden?: boolean
}) {
  return (
    <ul
      ref={listRef}
      className="flex shrink-0 items-center"
      aria-hidden={ariaHidden || undefined}
    >
      {SKILLS.map(({ label, Icon }) => (
        <li
          key={label}
          className="flex items-center gap-3 border-l border-white/15 px-[clamp(1.75rem,4vw,3.25rem)] py-[1.0rem]"
        >
          <Icon
            className="size-[1.05rem] shrink-0 text-glass-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span className="whitespace-nowrap font-mono text-[clamp(0.68rem,1vw,0.8rem)] uppercase tracking-[0.22em] text-glass-text [text-shadow:0_1px_10px_rgba(8,6,13,0.45)]">
            {label}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Continuously scrolling band of skills, sized to sit on the seam between the
 * hero video and the pinned backdrop below it.
 *
 * The track always travels exactly one list width per cycle — that is what
 * makes the loop seamless. It also means the copies *after* the first have to
 * cover the band on their own: with a fixed two copies, any viewport wider than
 * a single list ends the cycle with empty space, and the next copy's first item
 * snaps into place instead of sliding in. So the copy count is measured rather
 * than assumed.
 */
function SkillCarousel() {
  const bandRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [copies, setCopies] = useState(2)
  const [duration, setDuration] = useState<number | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const listWidth = listRef.current?.offsetWidth
      const bandWidth = bandRef.current?.offsetWidth
      if (!listWidth || !bandWidth) return

      // +1 so a whole list always trails the one covering the band.
      setCopies(Math.max(2, Math.ceil(bandWidth / listWidth) + 1))
      setDuration(listWidth / SPEED_PX_PER_SECOND)
    }

    measure()
    // Item padding is vw-based, so list width changes with the viewport.
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <section
      ref={bandRef}
      aria-label="Skills"
      className="relative z-10 w-full overflow-hidden liquid-glass"
    >
      <div className="skill-marquee-mask">
        <div
          className="flex w-max animate-skill-marquee hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={
            {
              '--marquee-copies': copies,
              ...(duration ? { animationDuration: `${duration}s` } : {}),
            } as CSSProperties
          }
        >
          {Array.from({ length: copies }, (_, i) => (
            <SkillList
              key={i}
              listRef={i === 0 ? listRef : undefined}
              ariaHidden={i > 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default SkillCarousel
