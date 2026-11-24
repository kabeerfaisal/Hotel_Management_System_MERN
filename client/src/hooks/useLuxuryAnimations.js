import { useEffect } from 'react'

let gsapModulePromise

/**
 * Load GSAP + ScrollTrigger as a separate chunk and register the plugin once.
 */
function loadGsap() {
  if (!gsapModulePromise) {
    gsapModulePromise = Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.gsap ?? gsapModule.default
      const ScrollTrigger =
        scrollTriggerModule.ScrollTrigger ?? scrollTriggerModule.default

      gsap.registerPlugin(ScrollTrigger)

      return { gsap, ScrollTrigger }
    })
  }

  return gsapModulePromise
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Fade-up entrance for hero content on mount.
 * Animates elements marked with [data-hero-animate] inside the scope.
 */
export function useHeroFadeUp(scopeRef) {
  useEffect(() => {
    const scope = scopeRef.current
    if (!scope) return undefined

    let cancelled = false
    let context

    loadGsap().then(({ gsap }) => {
      if (cancelled) return

      context = gsap.context(() => {
        const items = gsap.utils.toArray('[data-hero-animate]')
        if (!items.length) return

        if (prefersReducedMotion()) {
          gsap.set(items, { clearProps: 'opacity,transform' })
          return
        }

        gsap.from(items, {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.08,
        })
      }, scope)
    })

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [scopeRef])
}

/**
 * Staggered reveal on scroll for elements marked with [data-reveal].
 * Pass a primitive renderKey (e.g. loading state + item count) so cards
 * animate again when async data arrives.
 */
export function useStaggerReveal(scopeRef, renderKey = '') {
  useEffect(() => {
    const scope = scopeRef.current
    if (!scope) return undefined

    let cancelled = false
    let context
    let refreshTimer

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return

      context = gsap.context(() => {
        const items = gsap.utils.toArray('[data-reveal]')
        if (!items.length) return

        if (prefersReducedMotion()) {
          gsap.set(items, { clearProps: 'opacity,transform' })
          return
        }

        gsap.from(items, {
          y: 36,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.09,
          // Hand the elements back to CSS once revealed so nothing can get
          // stuck at opacity: 0 after a refresh or route change.
          clearProps: 'opacity,transform',
          scrollTrigger: {
            trigger: scope,
            start: 'top 85%',
            once: true,
          },
        })
      }, scope)

      // Recalculate trigger positions after mount, then again once async
      // content (room cards, booking rows) has finished laying out.
      ScrollTrigger.refresh()
      refreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh()
        window.dispatchEvent(new Event('luxurystay:scroll-ready'))
      }, 150)
    })

    return () => {
      cancelled = true
      window.clearTimeout(refreshTimer)
      context?.revert()
    }
  }, [scopeRef, renderKey])
}

/**
 * Subtle GSAP hover lift for elements marked with [data-hover-lift].
 */
export function useHoverLift(scopeRef, renderKey = '') {
  useEffect(() => {
    const scope = scopeRef.current
    if (!scope || prefersReducedMotion()) return undefined

    let cancelled = false
    let gsapRef
    let targets = []
    const removeListeners = []

    loadGsap().then(({ gsap }) => {
      if (cancelled) return

      gsapRef = gsap
      targets = gsap.utils.toArray('[data-hover-lift]')

      targets.forEach((element) => {
        const onEnter = () => {
          gsap.to(element, { y: -6, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
        }
        const onLeave = () => {
          gsap.to(element, { y: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
        }

        element.addEventListener('pointerenter', onEnter)
        element.addEventListener('pointerleave', onLeave)

        removeListeners.push(() => {
          element.removeEventListener('pointerenter', onEnter)
          element.removeEventListener('pointerleave', onLeave)
        })
      })
    })

    return () => {
      cancelled = true
      removeListeners.forEach((removeListener) => removeListener())
      if (gsapRef) {
        targets.forEach((element) => {
          gsapRef.killTweensOf(element)
          gsapRef.set(element, { clearProps: 'transform' })
        })
      }
    }
  }, [scopeRef, renderKey])
}

/**
 * Lightweight page fade for non-guest pages.
 */
export function usePageFade(scopeRef) {
  useEffect(() => {
    const scope = scopeRef.current
    if (!scope) return undefined

    let cancelled = false
    let context

    loadGsap().then(({ gsap }) => {
      if (cancelled) return

      context = gsap.context(() => {
        if (prefersReducedMotion()) {
          gsap.set(scope, { clearProps: 'opacity,transform' })
          return
        }

        gsap.from(scope, {
          opacity: 0,
          y: 14,
          duration: 0.55,
          ease: 'power2.out',
        })
      }, scope)
    })

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [scopeRef])
}
