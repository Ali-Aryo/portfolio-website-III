import { useEffect, useRef } from 'react'
import aboutVideo from '../assets/About.mp4'
import aboutPoster from '../assets/About.png'


function About() {
    const videoRef = useRef<HTMLVideoElement>(null)

    // Respect users who prefer reduced motion: keep the poster frame, don't play.
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches

        if (prefersReducedMotion) {
            video.removeAttribute('autoplay')
            video.pause()
        }
    }, [])

    return (
        <section
            id="about"
            className="relative flex min-h-svh w-full items-center justify-end overflow-hidden text-hero-fg max-md:items-end max-md:justify-center max-md:pb-[12vh]"
        >
            {/* Video div */}
            <div
                className="absolute inset-0 z-0"
                aria-hidden="true">
                <video
                    ref={videoRef}
                    className="block h-full w-full object-cover"
                    src={aboutVideo}
                    poster={aboutPoster}
                    autoPlay
                    loop
                    muted
                    playsInline
                />

                {/* not sure if needed - check what do */}
                <div className="absolute inset-0 hero-scrim max-md:hero-scrim-mobile" />
            </div>
        </section>
    )
}

export default About