import type { ComponentType, SVGProps } from 'react'
import { GraduationCap, Mail } from 'lucide-react'
import { LinkedinIcon } from '../components/shared/brand-icons'

interface ContactLink {
    href: string
    label: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
}

const CONTACT_LINKS: ContactLink[] = [
    { href: 'mailto:aoa25@sfu.ca', label: 'aoa25@sfu.ca', icon: GraduationCap },
    { href: 'https://www.linkedin.com/in/aoa25', label: 'LinkedIn', icon: LinkedinIcon },
    { href: 'mailto:aliaryo2004@gmail.com', label: 'aliaryo2004@gmail.com', icon: Mail },
]

/**
 * Sits over the pinned SiteBackground rather than carrying a background of its
 * own — `relative z-10` and no background is the pattern for every section
 * below the hero.
 *
 * One pill per link rather than one bar holding three, unlike the reference
 * screenshot: at the "big and obvious" size requested, three items sharing a
 * single rounded-full bar either force it edge-to-edge on tablet widths or
 * collapse the dividers awkwardly on mobile. Separate pills wrap to their own
 * lines instead, so nothing pinches at any width.
 */
function Contact() {
    return (
        <section
            id="contact"
            aria-labelledby="contact-heading"
            className="relative z-10 flex min-h-svh w-full flex-col items-center justify-center px-[clamp(1.5rem,6vw,7rem)] py-[12vh] text-center text-hero-fg"
        >
            <h2
                id="contact-heading"
                className="font-heading text-3xl font-semibold tracking-[0.04em] text-hero-fg md:text-4xl [text-shadow:0_1px_10px_rgba(8,6,13,0.45)]"
            >
                Get in Touch
            </h2>
            <p className="mt-4 max-w-[36ch] text-[1.05rem] leading-[1.6] text-hero-muted">
                Reach out any of these ways — I'll get back to you.
            </p>

            <div className="mt-12 flex w-full max-w-3xl flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
                {CONTACT_LINKS.map(({ href, label, icon: Icon }) => (
                    <a
                        key={href}
                        href={href}
                        {...(href.startsWith('http')
                            ? { target: '_blank', rel: 'noreferrer' }
                            : {})}
                        className="group inline-flex flex-1 items-center justify-center gap-3 rounded-full border border-white/20 liquid-glass px-8 py-5 text-[1.05rem] font-medium text-hero-fg transition duration-200 hover:-translate-y-0.5 hover:border-white/45 motion-reduce:hover:translate-y-0 sm:flex-none"
                    >
                        <Icon className="size-6 shrink-0 text-hero-accent transition-colors duration-200 group-hover:text-hero-fg" aria-hidden="true" />
                        <span className="[text-shadow:0_1px_10px_rgba(8,6,13,0.45)]">{label}</span>
                    </a>
                ))}
            </div>
        </section>
    )
}

export default Contact
