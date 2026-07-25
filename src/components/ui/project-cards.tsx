import { ProjectCard } from "@/components/shared/project-card-component";

export default function ProjectCards() {
    return (
        <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2 lg:grid-cols-3">
            <ProjectCard
                title="Aero Landing Page"
                description="A comprehensive AI chatbot platform. This project focuses on the design and development of a user-friendly and visually appealing landing page."
                imgSrc="https://framerusercontent.com/images/hynA7mpUiyBRDcssvVKCDBT14IM.jpg"
                link="#"
            />
            <ProjectCard
                title="Dreamland App Concept"
                description="A dreamy mobile app prototype designed for mindfulness and relaxation, featuring calming animations and a serene user interface."
                imgSrc="https://framerusercontent.com/images/D4M3JTkvSAJaqyRe9AzUnHvL8Ao.jpg"
                link="#"
                linkText="Explore Concept"
            />
            <ProjectCard
                title="Quantum Analytics Dashboard"
                description="A data visualization tool for quantum computing experiments, providing real-time insights and complex data analysis."
                imgSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                link="#"
            />
        </div>
    );
}