import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/data/projects";

export interface ProjectCardProps
    extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick"> {
    project: Project;
    onOpen: (project: Project) => void;
}

/**
 * One project in the grid. The whole card is a single button that opens the
 * detail view — the old inner "View Project" anchor was a nested interactive
 * element inside a clickable div, which gave keyboard users two stops with only
 * one of them reachable and neither announcing what it did. The arrow row is
 * now purely a visual affordance; every real link lives in the detail view.
 */
const ProjectCard = React.forwardRef<HTMLButtonElement, ProjectCardProps>(
    ({ className, project, onOpen, ...props }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                onClick={() => onOpen(project)}
                aria-label={`View details for ${project.title}`}
                className={cn(
                    "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl liquid-glass border border-white/20 text-left text-glass-text transition-all duration-500 ease-in-out hover:-translate-y-2 hover:border-white/35",
                    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-glass-accent",
                    className
                )}
                {...props}
            >
                <div className="aspect-video overflow-hidden">
                    <img
                        src={project.cover}
                        alt={project.coverAlt}
                        className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                        loading="lazy"
                    />
                </div>

                <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-heading text-xl font-semibold tracking-[0.03em] text-hero-fg transition-colors duration-300 group-hover:text-hero-accent [text-shadow:0_1px_10px_rgba(8,6,13,0.45)]">
                        {project.title}
                    </h3>

                    {/* Subtitle, not a tag: this says who the work was for,
                        which the uppercase pills below deliberately do not. The
                        accent colour keeps the two rows from reading as one
                        block of metadata. */}
                    {project.context && (
                        <p className="mt-1.5 text-[0.8rem] tracking-[0.06em] text-glass-accent">
                            {project.context}
                        </p>
                    )}

                    {/* Non-interactive on the card: filtering happens from the
                        chip row above the grid, so these are labels, not
                        controls. */}
                    <ul className="mt-3 flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                            <li
                                key={tag}
                                className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-hero-muted"
                            >
                                {tag}
                            </li>
                        ))}
                    </ul>

                    <p className="mt-3 flex-1 text-sm leading-[1.6] text-hero-muted md:text-base">
                        {project.summary}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-glass-accent">
                        View Project
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                </div>
            </button>
        );
    }
);
ProjectCard.displayName = "ProjectCard";

export { ProjectCard };
