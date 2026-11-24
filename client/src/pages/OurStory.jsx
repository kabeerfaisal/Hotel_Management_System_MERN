import { useRef } from 'react'
import { Link } from 'react-router-dom'

import { useHeroFadeUp, useHoverLift, useStaggerReveal } from '../hooks/useLuxuryAnimations.js'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=2000&q=80'

const STORY_IMAGE =
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=80'

const PILLARS = [
  {
    number: '01',
    title: 'Bespoke Craftsmanship',
    copy: 'Hand-finished joinery, hand-loomed textiles, and commissioned art give every suite a character that cannot be replicated.',
  },
  {
    number: '02',
    title: 'Effortless Technology',
    copy: 'Silent smart climate, one-touch lighting, and discreet service requests — technology that disappears into the stay.',
  },
  {
    number: '03',
    title: 'Sustainable Luxury',
    copy: 'Local materials, low-impact operations, and long-term partnerships with artisan communities across Pakistan.',
  },
]

const STATS = [
  { value: '5★', label: '5-Star Excellence' },
  { value: '24/7', label: '24/7 Concierge' },
  { value: '100%', label: '100% Guest Satisfaction' },
]

const MILESTONES = [
  { year: '1998', title: 'The first retreat', copy: 'A 24-room house opens on the Clifton promenade.' },
  { year: '2007', title: 'The thermal wing', copy: 'Hammam, spa, and the first rooftop restaurant.' },
  { year: '2019', title: 'Smart suites', copy: 'A quiet technology-led renovation of every floor.' },
  { year: '2026', title: 'Signature experiences', copy: 'Curated wellness, dining, and chauffeur collections.' },
]

function OurStory() {
  const heroRef = useRef(null)
  const storyRef = useRef(null)
  const pillarsRef = useRef(null)

  useHeroFadeUp(heroRef)
  useStaggerReveal(storyRef)
  useStaggerReveal(pillarsRef)
  useHoverLift(pillarsRef)

  return (
    <section className="pb-16">
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950 shadow-2xl"
      >
        <img
          src={HERO_IMAGE}
          alt="Historic luxury hotel corridor"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-900/25" />
        <div className="relative px-6 py-16 sm:px-10 sm:py-24">
          <p
            data-hero-animate
            className="text-xs font-semibold tracking-[0.28em] text-amber-300 uppercase"
          >
            Since 1998
          </p>
          <h1
            data-hero-animate
            className="mt-4 max-w-3xl font-display text-4xl leading-tight text-white sm:text-6xl"
          >
            The Heritage of LuxuryStay Hospitality
          </h1>
          <p
            data-hero-animate
            className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base"
          >
            Timeless architecture, the warmth of Pakistani hospitality, and the
            quiet intelligence of a modern smart suite.
          </p>
        </div>
      </div>

      <div ref={storyRef} className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div data-reveal>
          <p className="text-xs font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
            Our vision
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            A house built around the guest
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
            LuxuryStay began with a simple conviction: that a great hotel should
            feel inevitable — the light already right, the bed already turned, the
            coffee already remembered. We commissioned local architects and
            artisans to shape a house that would age gracefully and belong to its
            city.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
            That vision has never changed. Around it we have layered the warmth of
            Pakistani hospitality and the quiet convenience of smart-suite
            technology: considered rather than conspicuous, personal rather than
            performative.
          </p>
        </div>

        <div data-reveal className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-[2rem] border border-amber-500/30 p-3 dark:border-amber-500/25">
            <img
              src={STORY_IMAGE}
              alt="Luxury hotel suite interior"
              loading="lazy"
              className="aspect-[4/5] w-full rounded-[1.55rem] object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-4 rounded-2xl border border-stone-200 bg-white px-5 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-amber-700 uppercase dark:text-amber-400">
              Est. 1998
            </p>
            <p className="mt-1 font-display text-lg">A legacy of quiet luxury</p>
          </div>
        </div>
      </div>

      <div ref={pillarsRef} className="mt-20">
        <div data-reveal>
          <p className="text-xs font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
            Our philosophy
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Three Pillars of the House
          </h2>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.number}
              data-reveal
              data-hover-lift
              className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-amber-500/15 dark:bg-slate-900"
            >
              <p className="font-display text-2xl text-amber-600 dark:text-amber-400">
                {pillar.number}
              </p>
              <h3 className="mt-3 font-display text-xl">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {pillar.copy}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div
        data-reveal
        className="mt-16 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10 dark:border-amber-500/15 dark:bg-slate-900"
      >
        <dl className="grid gap-8 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <dd className="font-display text-4xl tracking-tight">{stat.value}</dd>
              <dt className="mt-2 text-[0.65rem] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-6 border-t border-stone-200 pt-8 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800">
          {MILESTONES.map((milestone) => (
            <div key={milestone.year}>
              <p className="font-display text-lg text-amber-700 dark:text-amber-400">
                {milestone.year}
              </p>
              <p className="mt-1 text-sm font-semibold">{milestone.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {milestone.copy}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        data-reveal
        className="mt-16 overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-8 text-white shadow-2xl sm:p-12"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-amber-300 uppercase">
              Continue the story
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              Stay With Us
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              Choose a suite and let the next chapter of your journey begin at
              LuxuryStay.
            </p>
          </div>
          <Link
            to="/rooms"
            className="inline-flex shrink-0 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Reserve Your Stay
          </Link>
        </div>
      </div>
    </section>
  )
}

export default OurStory
