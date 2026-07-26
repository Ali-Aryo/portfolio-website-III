import backgroundImage from '../../assets/hero2.jpeg'

/**
 * The pinned backdrop for everything below the hero.
 *
 * A fixed-position layer rather than `background-attachment: fixed`, which iOS
 * Safari has never handled properly. The hero video covers this while it is in
 * view; scrolling past reveals it, and it then stays put while cards and
 * timelines move over the top.
 *
 * Sections layered on this need `relative z-10` and no background of their own.
 */
function SiteBackground() {
  return (
    // The ink base shows for the moment before the image decodes, so the first
    // paint is never a white flash.
    <div className="fixed inset-0 z-0 bg-hero-ink" aria-hidden="true">
      <img
        src={backgroundImage}
        alt=""
        className="h-full w-full object-cover saturate-[0.85]"
      />
      {/* Knocks the artwork back so foreground content stays legible. */}
      <div className="absolute inset-0 site-bg-scrim" />
    </div>
  )
}

export default SiteBackground
