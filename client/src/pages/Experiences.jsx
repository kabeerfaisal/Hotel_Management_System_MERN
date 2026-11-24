import { useRef } from 'react'
import { Link } from 'react-router-dom'

import { useHeroFadeUp, useStaggerReveal } from '../hooks/useLuxuryAnimations.js'

const EXPERIENCES = [
  {
    id: 'spa',
    category: 'Wellness',
    title: 'Royal Thermal Spa & Infinity Pool',
    hours: 'Open daily · 6:00 AM – 11:00 PM',
    description:
      'Descend into a candlelit thermal sanctuary of marble, steam, and still water. Our therapists blend ancient hammam rituals with contemporary recovery, while the heated infinity pool holds the skyline at its edge.',
    highlights: [
      'Thermal hammam & salt grotto',
      'Couples’ massage rituals',
      'Heated skyline infinity pool',
      'Private wellness suites',
    ],
    image:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'dining',
    category: 'Fine dining',
    title: 'The Saffron Rooftop Dining',
    hours: 'Dinner nightly · 6:30 PM – 11:30 PM',
    description:
      'Above the city, Saffron pairs an artisanal tasting menu with rare vintages and candlelit terraces. Our chefs work with seasonal produce and heirloom spice, composing each plate to the rhythm of the evening.',
    highlights: [
      'Chef’s artisanal tasting menu',
      'Candlelit private terraces',
      'Sommelier wine pairings',
      'Sunset aperitivo hour',
    ],
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'chauffeur',
    category: 'Journeys',
    title: 'Private Chauffeur & Airport Concierge',
    hours: 'Available 24 hours · 7 days a week',
    description:
      'Arrive without friction. Our concierge meets you at the aircraft, settles your luggage, and delivers you to the porte-cochère in a chauffeured flagship sedan — or takes you further, on a bespoke city tour.',
    highlights: [
      'Airport meet & greet',
      'Flagship sedan fleet',
      'Bespoke city tours',
      'Hourly atelier service',
    ],
    image:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=80',
  },
]

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=80'

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="size-4 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M12 8v4l2.5 2.5" />
    </svg>
  )
}

function Experiences() {
  const heroRef = useRef(null)
  const listRef = useRef(null)

  useHeroFadeUp(heroRef)
  useStaggerReveal(listRef)

  return (
    <section className="pb-16">
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950 shadow-2xl"
      >
        <img
          src={HERO_IMAGE}
          alt="Luxury infinity pool at dusk"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-900/20" />
        <div className="relative px-6 py-16 sm:px-10 sm:py-24">
          <p
            data-hero-animate
            className="text-xs font-semibold tracking-[0.28em] text-amber-300 uppercase"
          >
            The LuxuryStay collection
          </p>
          <h1
            data-hero-animate
            className="mt-4 max-w-3xl font-display text-4xl leading-tight text-white sm:text-6xl"
          >
            Curated Five-Star Experiences
          </h1>
          <p
            data-hero-animate
            className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base"
          >
            Wellness, gastronomy, and journeys designed around you — each one
            arranged by our concierge and reserved for your stay.
          </p>
        </div>
      </div>

      <div ref={listRef} className="mt-16 space-y-16 lg:space-y-24">
        {EXPERIENCES.map((experience, index) => {
          const imageFirst = index % 2 === 0

          return (
            <article
              key={experience.id}
              id={experience.id}
              data-reveal
              className="grid scroll-mt-24 items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              <div
                className={`${imageFirst ? '' : 'lg:order-2'} mx-auto w-full max-w-xl lg:max-w-none`}
              >
                <div className="rounded-[2rem] border border-amber-500/30 p-3 dark:border-amber-500/25">
                  <img
                    src={experience.image}
                    alt={experience.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-[1.55rem] object-cover"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
                  {experience.category}
                </p>
                <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
                  {experience.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                  {experience.description}
                </p>

                <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <ClockIcon />
                  {experience.hours}
                </p>

                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {experience.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/rooms"
                  className="mt-8 inline-flex rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  Reserve a Suite
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      <div
        data-reveal
        className="mt-16 overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-8 text-white shadow-2xl sm:p-12"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-amber-300 uppercase">
              Reserved for our guests
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              Make It Part of Your Stay
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              Every experience can be arranged before you arrive. Choose a suite
              and our concierge will prepare the rest.
            </p>
          </div>
          <Link
            to="/rooms"
            className="inline-flex shrink-0 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Reserve a Suite
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Experiences
