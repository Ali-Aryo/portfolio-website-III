import { ProjectCard } from "@/components/shared/project-card-component"
import sabaImage from "@/assets/sabalandingpage.png"
import steadyscriptImage from "@/assets/steadyscript.png"
import phishnetImage from "@/assets/phishnet.png"
import portfolio2Image from "@/assets/websiteportfolio2.png"
import portfolioImage from "@/assets/websiteportfolio.png"


export default function ProjectCards() {
    return (
        <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2 lg:grid-cols-3">
            <ProjectCard
                title="Saba Management Consulting Landing Page"
                description="A data visualization tool for quantum computing experiments, providing real-time insights and complex data analysis."
                imgSrc={sabaImage}
                link="#"
            />
            <ProjectCard
                title="SteadyScript"
                description="A comprehensive AI chatbot platform. This project focuses on the design and development of a user-friendly and visually appealing landing page."
                imgSrc={steadyscriptImage}
                link="#"
            />
            <ProjectCard
                title="PaddlePal"
                description="A data visualization tool for quantum computing experiments, providing real-time insights and complex data analysis."
                imgSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                link="#"
            />
            <ProjectCard
                title="Website Portfolio II"
                description="A comprehensive AI chatbot platform. This project focuses on the design and development of a user-friendly and visually appealing landing page."
                imgSrc={portfolio2Image}
                link="#"
            />
            <ProjectCard
                title="Therassist"
                description="A dreamy mobile app prototype designed for mindfulness and relaxation, featuring calming animations and a serene user interface."
                imgSrc="https://framerusercontent.com/images/D4M3JTkvSAJaqyRe9AzUnHvL8Ao.jpg"
                link="#"
                linkText="Explore Concept"
            />
            <ProjectCard
                title="Phishnet.AI"
                description="A data visualization tool for quantum computing experiments, providing real-time insights and complex data analysis."
                imgSrc={phishnetImage}
                link="#"
            />

            <ProjectCard
                title="Website Portfolio"
                description="A dreamy mobile app prototype designed for mindfulness and relaxation, featuring calming animations and a serene user interface."
                imgSrc={portfolioImage}
                link="#"
                linkText="Explore Concept"
            />
            <ProjectCard
                title="Quantum Analytics Dashboard"
                description="A data visualization tool for quantum computing experiments, providing real-time insights and complex data analysis."
                imgSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                link="#"
            />
            <ProjectCard
                title="Mindful Memories"
                description="A data visualization tool for quantum computing experiments, providing real-time insights and complex data analysis."
                imgSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                link="#"
            />
        </div>
    );
}