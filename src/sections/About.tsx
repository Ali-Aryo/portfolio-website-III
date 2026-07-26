import ProjectCards from '../components/ui/project-cards';
import Timeline from '../components/ui/timeline'


/**
 * Sits over the pinned SiteBackground rather than carrying a background of its
 * own — `relative z-10` and no background is the pattern for every section
 * below the hero.
 */
function About() {
    return (
        <section
            id="about"
            className="relative z-10 flex min-h-svh w-full flex-col justify-center px-[clamp(1.5rem,6vw,7rem)] py-[12vh] text-hero-fg"
        >
            <Timeline />
            <div className="mt-[8vh]">
                <ProjectCards />
            </div>
        </section>
    )
}

export default About
