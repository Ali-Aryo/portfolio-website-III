import { Timeline, type TimelineEntry } from '@/components/shared/timeline-component'

/* Placeholder entries — replace with your own. `content` is a ReactNode, so it
   takes anything: paragraphs, bullet lists, images, cards. */
const ENTRIES: TimelineEntry[] = [
    {
        title: 'Dec 2026',
        content: (
            <div>
                <h4 className="text-base font-semibold text-hero-fg md:text-lg">
                    Graduation (expected)
                </h4>
                <p className="mb-3 text-sm font-medium text-hero-accent">
                    Simon Fraser University · Burnaby, BC
                </p>
                <ul className="list-disc space-y-1.5 pl-4 text-sm text-hero-muted md:text-base">
                    <li>Bachelor of Applied Science (BAS)</li>
                    <li>Computer Engineering</li>
                </ul>
            </div>
        ),
    },
    {
        title: 'May 2026',
        content: (
            <h4 className="text-base font-semibold text-hero-fg md:text-lg">
                Dean’s Honour Roll 2026
            </h4>
        ),
    },
    {
        title: 'Jan 2026',
        content: (
            <h4 className="text-base font-semibold text-hero-fg md:text-lg">
                Winner at NWHacks2026
                <p className="mb-3 text-sm font-medium text-hero-accent">
                    Best Wellness Related Hack
                </p>
                <p className="mb-3 text-sm font-medium text-hero-accent">
                    Best First Time Hacker Project
                </p>

            </h4>
        ),
    },
    {
        title: 'May – Dec 2025',
        content: (
            <div>
                <h4 className="text-base font-semibold text-hero-fg md:text-lg">
                    Software Engineer (Co-op)
                </h4>
                <p className="mb-3 text-sm font-medium text-hero-accent">
                    TELUS · Vancouver, BC
                </p>
                <ul className="list-disc space-y-1.5 pl-4 text-sm text-hero-muted md:text-base">
                    <li>
                        Deployed scheduled Python Cloud Functions to GCP via Terraform to automate daily client data backups.
                    </li>
                    <li>
                        Developed a Python CLI tool using the Looker SDK for automated reporting and JSON data exports to Google Cloud Storage.
                    </li>
                    <li>
                        Created team documentation on Git workflows (releases, tags, pull requests) to standardize development procedures.
                    </li>
                </ul>
            </div>
        ),
    },
    {
        title: 'Sep 2022 – Sep 2025',
        content: (
            <div>
                <h4 className="text-base font-semibold text-hero-fg md:text-lg">
                    Firmware Developer
                </h4>
                <p className="mb-3 text-sm font-medium text-hero-accent">
                    Robot Soccer Club · Simon Fraser University
                </p>
                <ul className="list-disc space-y-1.5 pl-4 text-sm text-hero-muted md:text-base">
                    <li>
                        Developed and maintained embedded firmware in C for soccer-playing robot control systems powered by ARM-based microcontrollers.
                    </li>
                    <li>
                        Implemented and configured a GitLab CI/CD pipeline to automate codebase building and testing, improving deployment reliability.
                    </li>
                    <li>
                        Implemented and tested embedded drivers for I2C, SPI, and UART communication protocols for seamless hardware integration.
                    </li>
                </ul>
            </div>
        ),
    },

    {
        title: 'Sep 2022',
        content: (
            <h4 className="text-base font-semibold text-hero-fg md:text-lg">
                Undergrad Started
            </h4>
        ),
    },
]

function ProjectTimeline() {
    return (
        <div className="w-full">
            <h2 className="mb-3 font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-bold uppercase tracking-[0.06em] text-hero-fg">
                Journey
            </h2>
            <p className="italic mb-4 max-w-[46ch] text-sm leading-[1.6] text-hero-muted md:text-base">
                'Never leave that till tomorrow which you can do today'
            </p>
            <Timeline data={ENTRIES} />
        </div>
    )
}

export default ProjectTimeline
