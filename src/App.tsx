import SiteBackground from './components/shared/site-background'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
// Parked, not deleted — both still build, they are just not in the page:
// import SkillCarousel from './components/shared/skill-carousel'
// import About from './sections/About'   // holds the Timeline

function App() {
  return (
    <>
      {/* Pinned backdrop for the whole page. Anything that should scroll over
          it needs `relative z-10` and no background of its own. */}
      <SiteBackground />
      <Hero />
      <Projects />
    </>
  )
}

export default App
