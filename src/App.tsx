import SiteBackground from './components/shared/site-background'
import Hero from './sections/Hero'
import About from './sections/About'
import Projects from './sections/Projects'

function App() {
  return (
    <>
      {/* Pinned backdrop for the whole page. Anything that should scroll over
          it needs `relative z-10` and no background of its own. */}
      <SiteBackground />
      <Hero />
      <About />

    </>
  )
}

export default App
