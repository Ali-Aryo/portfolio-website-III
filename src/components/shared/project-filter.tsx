import { cn } from '@/lib/utils'
import type { ProjectTag } from '@/data/projects'

export type ActiveFilter = ProjectTag | 'All'

interface ProjectFilterProps {
    tags: ProjectTag[]
    active: ActiveFilter
    onChange: (filter: ActiveFilter) => void
    /** Announced to screen readers after the grid updates. */
    resultCount: number
}

/**
 * Single-select chip row: "All" plus one chip per tag in use. Implemented as a
 * radio group rather than buttons — the choice is one-of-N and exclusive, which
 * also buys arrow-key navigation from the browser for free.
 */
function ProjectFilter({ tags, active, onChange, resultCount }: ProjectFilterProps) {
    const options: ActiveFilter[] = ['All', ...tags]

    return (
        <div className="mb-10 px-8">
            {/* Horizontal scroll rather than wrapping: on a narrow screen a
                wrapped row pushes the grid down unpredictably as tags are added. */}
            <div
                role="radiogroup"
                aria-label="Filter projects by type"
                className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {options.map((option) => {
                    const isActive = option === active
                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            onClick={() => onChange(option)}
                            className={cn(
                                // min-h-11 keeps the tap target at 44px even though
                                // the label is small.
                                'shrink-0 snap-start cursor-pointer rounded-full border px-5 min-h-11',
                                'font-mono text-[0.72rem] uppercase tracking-[0.18em]',
                                'transition-all duration-300 ease-out',
                                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-accent',
                                isActive
                                    ? 'liquid-glass border-white/45 text-hero-fg'
                                    : 'border-white/15 text-hero-muted hover:border-white/30 hover:text-hero-fg',
                            )}
                        >
                            {option}
                        </button>
                    )
                })}
            </div>

            {/* The grid changing under a filter press is a visual-only cue; this
                gives assistive tech the same information. */}
            <p aria-live="polite" className="sr-only">
                {resultCount} {resultCount === 1 ? 'project' : 'projects'} shown
            </p>
        </div>
    )
}

export default ProjectFilter
