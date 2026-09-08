import { GithubIcon, LinkedinIcon } from './brand-icons'

/**
 * Sits over the pinned SiteBackground rather than carrying a background of its
 * own — `relative z-10` and no background is the pattern for every section
 * below the hero. The top border is what separates it from Contact instead.
 */
function SiteFooter() {
    const year = new Date().getFullYear()

    return (
        <footer className="relative z-10 w-full border-t border-white/10 px-[clamp(1.5rem,6vw,7rem)] py-8 text-hero-muted">
            <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
                <p className="text-sm">
                    &copy; {year} Ali Shamsi. Built with React, TypeScript &amp; Tailwind CSS.
                </p>

                <div className="flex items-center gap-3">
                    <a
                        href="https://github.com/Ali-Aryo"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="GitHub"
                        className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-hero-muted transition duration-200 hover:border-white/35 hover:text-hero-fg"
                    >
                        <GithubIcon className="size-4" />
                    </a>
                    <a
                        href="https://www.linkedin.com/in/aoa25"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="LinkedIn"
                        className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-hero-muted transition duration-200 hover:border-white/35 hover:text-hero-fg"
                    >
                        <LinkedinIcon className="size-4" />
                    </a>
                    <a
                        href="#home"
                        className="ml-1 text-sm text-hero-muted underline decoration-white/25 underline-offset-4 transition duration-200 hover:text-hero-fg"
                    >
                        Back to top
                    </a>
                </div>
            </div>
        </footer>
    )
}

export default SiteFooter
