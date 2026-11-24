import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Fired by useStaggerReveal once the deferred ScrollTrigger refresh is done.
const SCROLL_READY_EVENT = 'luxurystay:scroll-ready'

/**
 * Route scroll manager: deep links (e.g. /experiences#spa) glide to their
 * section, while every plain route change opens at the top of the page.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return undefined
    }

    const targetId = decodeURIComponent(hash.slice(1))
    const target = document.getElementById(targetId)

    if (!target) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return undefined
    }

    // Reposition after ScrollTrigger refreshes too, so the reveal calculations
    // cannot snap the page back to the top mid-scroll.
    const scrollToTarget = () => {
      const currentTarget = document.getElementById(targetId)
      currentTarget?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const frame = window.requestAnimationFrame(scrollToTarget)
    window.addEventListener(SCROLL_READY_EVENT, scrollToTarget)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener(SCROLL_READY_EVENT, scrollToTarget)
    }
  }, [pathname, hash])

  return null
}

export default ScrollToTop
