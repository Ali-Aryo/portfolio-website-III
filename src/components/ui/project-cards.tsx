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

/** The project named by the current URL hash, if any. */
function projectFromHash(): Project | null {
    const slug = window.location.hash.replace(/^#/, '')
    return slug ? (findProjectBySlug(slug) ?? null) : null
}

export default function ProjectCards() {
    const [filter, setFilter] = useState<ActiveFilter>('All')
    /* Read straight from the hash on first render rather than in an effect,
       so a shared link paints with the modal already open instead of showing
       the bare grid for a frame first. */
    const [active, setActive] = useState<Project | null>(projectFromHash)
    const reduceMotion = useReducedMotion() ?? false

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
                onChange={setFilter}
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
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 16 }}
                            /* whileInView rather than animate: the grid sits below
                               the fold on load, so animating on mount plays the
                               reveal off-screen before anyone scrolls to see it.
                               `once: true` means it only plays the first time each
                               card enters view, not on every scroll past it. */
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
                            transition={{
                                duration: reduceMotion ? 0 : 0.4,
                                ease: 'easeOut',
                                delay: reduceMotion
                                    ? 0
                                    : Math.min(index * STAGGER_STEP, MAX_STAGGER),
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
