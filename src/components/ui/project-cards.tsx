import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ProjectCard } from '@/components/shared/project-card-component'
import ProjectFilter, { type ActiveFilter } from '@/components/shared/project-filter'
import ProjectDetailModal from '@/components/shared/project-detail-modal'
import { findProjectBySlug, projects, usedTags, type Project } from '@/data/projects'

/* Long enough to read as a wave across the grid, short enough that the last
   card is not still arriving after the first is settled. Capped so a large
   grid does not turn the tail into a wait. */
const STAGGER_STEP = 0.04
const MAX_STAGGER = 0.32

/* Tighter than the arrival wave, so re-filtering reads as the grid reshuffling
   rather than introducing itself again. */
const SWAP_STAGGER_STEP = 0.025
const MAX_SWAP_STAGGER = 0.15

const SHOWN = { opacity: 1, scale: 1, y: 0 }

/* The reveal the section gets the one time it is first scrolled to. */
const INTRO_FROM = { opacity: 0, scale: 0.92, y: 16 }
const INTRO_VIEWPORT = { once: true, amount: 0.2 }

/* Filter swaps enter from exactly what an exit leaves on, so a card arriving
   and a card leaving are one gesture run in opposite directions. */
const SWAP_FROM = { opacity: 0, scale: 0.94 }

/** The project named by the current URL hash, if any. */
function projectFromHash(): Project | null {
    const slug = window.location.hash.replace(/^#/, '')
    return slug ? (findProjectBySlug(slug) ?? null) : null
}

export default function ProjectCards() {
    const [filter, setFilter] = useState<ActiveFilter>('All')
    /* Which of the two entrances the cards are currently using. The staggered
       reveal belongs to the one time the grid is first scrolled to; touching
       the filter retires it in favour of the swap.

       It has to be tracked here rather than left to the cards' own
       `viewport={{ once: true }}`, which only dedupes per mount: cards are
       keyed by slug inside AnimatePresence, so every card that re-enters the
       filtered set is a brand new mount and would replay the arrival wave. */
    const [introDone, setIntroDone] = useState(false)
    /* Read straight from the hash on first render rather than in an effect,
       so a shared link paints with the modal already open instead of showing
       the bare grid for a frame first. */
    const [active, setActive] = useState<Project | null>(projectFromHash)
    const reduceMotion = useReducedMotion() ?? false
    const playIntro = !reduceMotion && !introDone

    /* Whether the currently open modal owns a history entry we pushed. Deep
       linking straight to #some-project does not, so closing that must not call
       history.back() — it would navigate away from the site entirely. */
    const pushedRef = useRef(false)

    const tags = useMemo(() => usedTags(projects), [])
    const visible = useMemo(
        () =>
            filter === 'All'
                ? projects
                : projects.filter((project) => project.tags.includes(filter)),
        [filter],
    )

    // The URL is the source of truth for which project is open: it makes every
    // project shareable, and it makes the browser back button close the modal,
    // which is what users reach for first on mobile.
    useEffect(() => {
        const syncFromHash = () => {
            const next = projectFromHash()
            setActive(next)
            pushedRef.current = next !== null
        }
        // Both events are needed and neither is redundant: popstate covers
        // back/forward, hashchange covers the hash being edited in the address
        // bar or reached from an in-page anchor. pushState fires neither, so
        // our own opens never round-trip through here. Both handlers derive
        // state from the same place, so a double fire is a no-op.
        window.addEventListener('popstate', syncFromHash)
        window.addEventListener('hashchange', syncFromHash)
        return () => {
            window.removeEventListener('popstate', syncFromHash)
            window.removeEventListener('hashchange', syncFromHash)
        }
    }, [])

    const changeFilter = useCallback((next: ActiveFilter) => {
        setIntroDone(true)
        setFilter(next)
    }, [])

    const openProject = useCallback((project: Project) => {
        window.history.pushState(null, '', `#${project.slug}`)
        pushedRef.current = true
        setActive(project)
    }, [])

    const closeProject = useCallback(() => {
        if (pushedRef.current) {
            // Pops our own entry; the popstate handler clears `active`.
            window.history.back()
            return
        }
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setActive(null)
    }, [])

    return (
        <>
            <ProjectFilter
                tags={tags}
                active={filter}
                onChange={changeFilter}
                resultCount={visible.length}
            />

            <motion.div
                layout={!reduceMotion}
                className="grid grid-cols-1 gap-8 px-8 pb-8 md:grid-cols-2 lg:grid-cols-3"
            >
                {/* popLayout takes leaving cards out of flow immediately, so the
                    survivors slide into their new positions instead of waiting
                    for the exit animation to finish. */}
                <AnimatePresence mode="popLayout">
                    {visible.map((project, index) => (
                        <motion.div
                            key={project.slug}
                            layout={!reduceMotion}
                            initial={
                                reduceMotion ? false : playIntro ? INTRO_FROM : SWAP_FROM
                            }
                            /* The arrival wave is driven by whileInView because the
                               grid sits below the fold on load, and animating on
                               mount would play it off-screen before anyone scrolls
                               to see it.

                               A swap is the opposite case: it is a response to a
                               click that has already happened, so it runs on
                               `animate` and plays wherever the card lands —
                               viewport-gating it would strand cards that arrive
                               below the fold, invisible until scrolled to. */
                            whileInView={playIntro ? SHOWN : undefined}
                            viewport={playIntro ? INTRO_VIEWPORT : undefined}
                            animate={playIntro ? undefined : SHOWN}
                            exit={reduceMotion ? undefined : SWAP_FROM}
                            transition={{
                                duration: reduceMotion ? 0 : playIntro ? 0.4 : 0.3,
                                ease: 'easeOut',
                                delay: reduceMotion
                                    ? 0
                                    : playIntro
                                      ? Math.min(index * STAGGER_STEP, MAX_STAGGER)
                                      : Math.min(
                                            index * SWAP_STAGGER_STEP,
                                            MAX_SWAP_STAGGER,
                                        ),
                            }}
                            className="flex"
                        >
                            <ProjectCard
                                project={project}
                                onOpen={openProject}
                                className="w-full"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            <ProjectDetailModal project={active} onClose={closeProject} />
        </>
    )
}
