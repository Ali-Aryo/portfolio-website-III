import ProjectCards from '../components/ui/project-cards';

/**
 * Sits over the pinned SiteBackground rather than carrying a background of its
 * own — `relative z-10` and no background is the pattern for every section
 * below the hero.
 */
function Projects() {
    return (
        <section
            id="work"
            className="relative z-10 flex min-h-svh w-full flex-col justify-center px-[clamp(1.5rem,6vw,7rem)] py-[12vh] text-hero-fg"
        >
            <ProjectCards />
        </section>
    )
}

export default Projects
