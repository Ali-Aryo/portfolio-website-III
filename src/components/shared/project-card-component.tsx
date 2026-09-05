import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility for merging class names

// Define the props interface for type safety and clarity
export interface ProjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
    imgSrc: string;
    title: string;
    description: string;
    link: string;
    linkText?: string;
}

const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
    ({ className, imgSrc, title, description, link, linkText = "View Project", ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl liquid-glass border border-white/20 text-glass-text transition-all duration-500 ease-in-out hover:-translate-y-2 hover:border-white/35",
                    className
                )}
                {...props}
            >
                {/* Card Image Section */}
                <div className="aspect-video overflow-hidden">
                    <img
                        src={imgSrc}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                        loading="lazy"
                    />
                </div>

                {/* Card Content Section */}
                <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-heading text-xl font-semibold tracking-[0.03em] text-hero-fg transition-colors duration-300 group-hover:text-hero-accent [text-shadow:0_1px_10px_rgba(8,6,13,0.45)]">
                        {title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-[1.6] text-hero-muted md:text-base">{description}</p>

                    {/* Card Link/CTA */}
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/button mt-4 inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-glass-accent transition-all duration-300 hover:underline"
                        onClick={(e) => e.stopPropagation()} // Prevent card's onClick if it has one
                    >
                        {linkText}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/button:translate-x-1" />
                    </a>
                </div>
            </div>
        );
    }
);
ProjectCard.displayName = "ProjectCard";

export { ProjectCard };