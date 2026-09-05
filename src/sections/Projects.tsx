import ProjectCards from '../components/ui/project-cards';

/**
 * The page's main content now that the hero is the only thing above it.
 *
 * Sits over the pinned SiteBackground rather than carrying a background of its
 * own — `relative z-10` and no background is the pattern for every section
 * below the hero.
 */
function Projects() {
    return (
        <section
            id="work"
            aria-labelledby="work-heading"
            className="relative z-10 flex min-h-svh w-full flex-col justify-center px-[clamp(1.5rem,6vw,7rem)] py-[12vh] text-hero-fg"
        >
            <div className="mb-12 px-8">
                <h2
                    id="work-heading"
                    className="font-heading text-3xl font-semibold tracking-[0.04em] text-hero-fg md:text-4xl [text-shadow:0_1px_10px_rgba(8,6,13,0.45)]"
                >
                    Selected Work
                </h2>
            </div>
            <ProjectCards />
        </section>
    )
}

export default Projects
