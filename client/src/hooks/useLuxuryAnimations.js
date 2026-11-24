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
    let fallbackTimer

    const revealImmediately = () => {
      const items = scope.querySelectorAll('[data-reveal]')
      items.forEach((el) => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
    }

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return

      context = gsap.context(() => {
        const items = gsap.utils.toArray('[data-reveal]')
        if (!items.length) return

        if (prefersReducedMotion()) {
          gsap.set(items, { clearProps: 'opacity,transform' })
          return
        }

        const rect = scope.getBoundingClientRect()
        const alreadyInOrPastView = rect.top <= window.innerHeight * 0.92

        if (alreadyInOrPastView) {
          gsap.fromTo(
            items,
            { y: 20, opacity: 0.2 },
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              ease: 'power3.out',
              stagger: 0.08,
              clearProps: 'opacity,transform',
            }
          )
          return
        }

        gsap.from(items, {
          y: 36,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.09,
          clearProps: 'opacity,transform',
          scrollTrigger: {
            trigger: scope,
            start: 'top 88%',
            once: true,
          },
        })
      }, scope)

      ScrollTrigger.refresh()
      refreshTimer = window.setTimeout(() => {
        if (cancelled) return
        ScrollTrigger.refresh()
        window.dispatchEvent(new Event('luxurystay:scroll-ready'))
      }, 150)

      fallbackTimer = window.setTimeout(() => {
        if (!cancelled) {
          revealImmediately()
        }
      }, 1800)
    }).catch(() => {
      if (!cancelled) {
        revealImmediately()
      }
    })

    return () => {
      cancelled = true
      window.clearTimeout(refreshTimer)
      window.clearTimeout(fallbackTimer)
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
