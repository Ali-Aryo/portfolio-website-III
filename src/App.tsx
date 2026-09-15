import { useState } from 'react'
import SiteBackground from './components/shared/site-background'
import Preloader from './components/shared/preloader'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
import Contact from './sections/Contact'
import SiteFooter from './components/shared/site-footer'
import ChatWidget from './components/shared/chat-widget'
// Parked, not deleted — both still build, they are just not in the page:
// import SkillCarousel from './components/shared/skill-carousel'
// import About from './sections/About'   // holds the Timeline

/**
 * The intro is decoration, so it is the first thing to go when the OS asks for
 * less movement: no panel, no stagger, the hero just renders finished.
 *
 * Read once at module scope rather than through a listener — flipping the
 * setting mid-visit should not tear down a running intro.
 */
const skipIntro =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function App() {
  // Doubles as the preloader's "finished" flag and the hero's entrance cue,
  // which is what keeps the two sequences from drifting apart.
  const [heroReady, setHeroReady] = useState(skipIntro)

  return (
    <>
      {/* Unmounted rather than hidden once it is done, so its scroll lock and
          its effects are actually torn down. */}
      {!skipIntro && !heroReady && <Preloader onComplete={() => setHeroReady(true)} />}

      {/* Pinned backdrop for the whole page. Anything that should scroll over
          it needs `relative z-10` and no background of its own. */}
      <SiteBackground />
      <Hero ready={heroReady} />
      <Projects />
      <Contact />
      <SiteFooter />
      <ChatWidget />
    </>
  )
}

export default App
