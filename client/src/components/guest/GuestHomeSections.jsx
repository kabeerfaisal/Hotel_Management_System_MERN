import { useRef } from 'react'
import { Link } from 'react-router-dom'

import {
  useHoverLift,
  useStaggerReveal,
} from '../../hooks/useLuxuryAnimations.js'
import { formatPKR } from '../../utils/formatters.js'
import { getRoomImage } from '../../utils/roomImages.js'

const eyebrowClass =
  'text-xs font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400'

const linkClass =
  'text-sm font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400'

const HIGHLIGHTS = [
  {
    title: '24/7 Butler & Concierge',
    copy: 'A dedicated team anticipating every request, day or night.',
    icon: 'bell',
  },
  {
    title: 'Michelin-Inspired Dining',
    copy: 'Seasonal tasting menus and cellar pairings at Saffron.',
    icon: 'dining',
  },
  {
    title: 'Thermal Spa & Infinity Pool',
    copy: 'Hammam rituals, hydrotherapy, and skyline-edge swims.',
    icon: 'spa',
  },
  {
    title: 'Private Airport Chauffeur',
    copy: 'Door-to-door transfers in a chauffeured flagship sedan.',
    icon: 'car',
  },
]

const EXPERIENCES = [
  {
    title: 'Royal Spa & Wellness',
    copy: 'Thermal pools, hammam rituals, and bespoke treatments drawn from ancient practice.',
    href: '/experiences#spa',
    image:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'The Saffron Rooftop Dining',
    copy: 'Chef-led tasting menus, rare vintages, and a skyline that turns gold at dusk.',
    href: '/experiences#dining',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Private Concierge & Chauffeur',
    copy: 'Curated itineraries, reservations, and a chauffeured car whenever you wish.',
    href: '/experiences#chauffeur',
    image:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1000&q=80',
  },
]

const STORY_STATS = [
  { value: '5★', label: 'Star rated' },
  { value: '24/7', label: 'Concierge' },
  { value: '100%', label: 'Comfort' },
]

const VOICES = [
  {
    quote:
      'The butler knew our coffee order before we did. Every detail felt considered, never staged.',
    name: 'Ayesha & Hamza',
    detail: 'Presidential Suite · 3 nights',
  },
  {
    quote:
      'Dinner at Saffron was the finest meal of our year, and the spa ritual reset the whole trip.',
    name: 'Daniel Whitmore',
    detail: 'Deluxe Room · 5 nights',
  },
  {
    quote:
      'A quiet, beautiful hotel with service that anticipates rather than reacts. We will return.',
    name: 'Fatima Al-Rashid',
    detail: 'Suite · 2 nights',
  },
]

const STORY_IMAGE =
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80'

function HighlightIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="size-5"
      aria-hidden="true"
    >
      {name === 'bell' ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16M5 18a7 7 0 0 1 14 0" />
          <path strokeLinecap="round" d="M12 6V4M9 21h6" />
        </>
      ) : null}
      {name === 'dining' ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16M6 18a6 6 0 0 1 12 0" />
          <path strokeLinecap="round" d="M12 9V6M10 6h4" />
        </>
      ) : null}
      {name === 'spa' ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c3 3.8 3 8.2 0 12-3-3.8-3-8.2 0-12Z" />
          <path strokeLinecap="round" d="M5 13c2.6.4 4.7 2.4 5.3 5M19 13c-2.6.4-4.7 2.4-5.3 5M4 20h16" />
        </>
      ) : null}
      {name === 'car' ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v-3l2-5h12l2 5v3M4 16h16M4 16v2m16-2v2" />
          <circle cx="8" cy="13" r="1" />
          <circle cx="16" cy="13" r="1" />
        </>
      ) : null}
    </svg>
  )
}

export function HotelHighlights() {
  const scopeRef = useRef(null)
  useStaggerReveal(scopeRef)

  return (
    <section ref={scopeRef} aria-label="Hotel highlights" className="mt-10">
      <div className="rounded-3xl border border-stone-200 bg-white p-2 shadow-sm dark:border-amber-500/15 dark:bg-slate-900">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((highlight) => (
            <div
              key={highlight.title}
              data-reveal
              className="flex items-start gap-3 rounded-2xl px-4 py-5 transition-colors hover:bg-amber-50/70 dark:hover:bg-amber-500/5"
            >
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
              >
                <HighlightIcon name={highlight.icon} />
              </span>
              <div>
                <p className="text-sm font-semibold">{highlight.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {highlight.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FeaturedSuites({ rooms, isLoading }) {
  const scopeRef = useRef(null)
  const renderKey = `${isLoading}-${rooms.length}`

  useStaggerReveal(scopeRef, renderKey)
  useHoverLift(scopeRef, renderKey)

  const featured = rooms.slice(0, 3)

  return (
    <section ref={scopeRef} aria-labelledby="featured-suites-title" className="mt-16">
      <div
        data-reveal
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className={eyebrowClass}>Curated for you</p>
          <h2
            id="featured-suites-title"
            className="mt-2 font-display text-3xl tracking-tight sm:text-4xl"
          >
            Featured Suites &amp; Rooms
          </h2>
        </div>
        <Link to="/rooms" className={linkClass}>
          View All Suites →
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              data-reveal
              className="h-96 animate-pulse rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : featured.length === 0 ? (
        <div
          data-reveal
          className="mt-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-white to-amber-50 p-10 text-center shadow-sm dark:from-slate-900 dark:to-slate-950"
        >
          <p className="font-display text-2xl">Suites are being refreshed</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Our reservations team is preparing the next collection of rooms.
          </p>
          <Link
            to="/rooms"
            className="mt-6 inline-flex rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            Explore All Suites
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((room) => (
            <article
              key={room._id}
              data-reveal
              data-hover-lift
              className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-2xl dark:border-amber-500/15 dark:bg-slate-900"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={getRoomImage(room.type)}
                  alt={`${room.type} room`}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                <span className="absolute top-4 left-4 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-800 backdrop-blur">
                  Available
                </span>
                <p className="absolute bottom-4 left-4 text-[0.65rem] font-semibold tracking-[0.22em] text-amber-200 uppercase">
                  Room {room.roomNumber}
                </p>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-2xl">{room.type}</h3>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-amber-600/30 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                    Up to {room.capacity ?? 2} guests
                  </span>
                  {(room.amenities ?? []).slice(0, 2).map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                  <div>
                    <p className="text-xs tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                      Per night
                    </p>
                    <p className="mt-1 font-display text-2xl">
                      {formatPKR(room.pricePerNight)}
                    </p>
                  </div>
                  <Link
                    to="/rooms"
                    className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                  >
                    Explore &amp; Book
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function SignatureExperiences() {
  const scopeRef = useRef(null)
  useStaggerReveal(scopeRef)
  useHoverLift(scopeRef)

  return (
    <section
      ref={scopeRef}
      aria-labelledby="signature-experiences-title"
      className="mt-16"
    >
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={eyebrowClass}>Beyond the suite</p>
          <h2
            id="signature-experiences-title"
            className="mt-2 font-display text-3xl tracking-tight sm:text-4xl"
          >
            Signature Experiences
          </h2>
        </div>
        <Link to="/experiences" className={linkClass}>
          Explore All Experiences →
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {EXPERIENCES.map((experience) => (
          <Link
            key={experience.title}
            to={experience.href}
            data-reveal
            data-hover-lift
            className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-stone-200 shadow-sm dark:border-amber-500/15"
          >
            <img
              src={experience.image}
              alt={experience.title}
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <h3 className="font-display text-2xl">{experience.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {experience.copy}
              </p>
              <span className="mt-4 inline-flex text-xs font-semibold tracking-[0.18em] text-amber-300 uppercase">
                Discover →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function OurStory() {
  const scopeRef = useRef(null)
  useStaggerReveal(scopeRef)

  return (
    <section ref={scopeRef} aria-labelledby="our-story-title" className="mt-16">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div data-reveal>
          <p className={eyebrowClass}>About LuxuryStay</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2
              id="our-story-title"
              className="mt-2 font-display text-3xl tracking-tight sm:text-4xl"
            >
              Our Story
            </h2>
            <Link to="/our-story" className={linkClass}>
              Read Our Story →
            </Link>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
            Since 1998, LuxuryStay has quietly redefined hospitality on the
            subcontinent: a house where the architecture recedes, the light is
            considered, and service feels like intuition rather than instruction.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
            Each of our suites is composed for rest — deep beds, natural
            materials, and a dedicated team who remember how you take your
            coffee. Arrive as a guest; leave feeling you have somewhere to
            return to.
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-stone-200 pt-6 dark:border-slate-800">
            {STORY_STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-3xl tracking-tight">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-[0.65rem] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <div data-reveal className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-[2rem] border border-amber-500/30 p-3 dark:border-amber-500/25">
            <img
              src={STORY_IMAGE}
              alt="Framed luxury hotel interior"
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
    </section>
  )
}

export function GuestVoices() {
  const scopeRef = useRef(null)
  useStaggerReveal(scopeRef)
  useHoverLift(scopeRef)

  return (
    <section ref={scopeRef} aria-labelledby="guest-voices-title" className="mt-16">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={eyebrowClass}>Guest voices</p>
          <h2
            id="guest-voices-title"
            className="mt-2 font-display text-3xl tracking-tight sm:text-4xl"
          >
            Words From Our Guests
          </h2>
        </div>
        <Link to="/feedback" className={linkClass}>
          Leave Your Feedback →
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {VOICES.map((voice) => (
          <article
            key={voice.name}
            data-reveal
            data-hover-lift
            className="flex flex-col rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-amber-500/15 dark:bg-slate-900"
          >
            <span
              aria-hidden="true"
              className="font-display text-4xl leading-none text-amber-500/80"
            >
              “
            </span>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {voice.quote}
            </p>
            <footer className="mt-5 flex items-center gap-3 border-t border-stone-200 pt-4 dark:border-slate-800">
              <span className="flex size-10 items-center justify-center rounded-full bg-amber-100 font-display text-sm font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                {voice.name.charAt(0)}
              </span>
              <div>
                <p className="text-sm font-semibold">{voice.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {voice.detail}
                </p>
              </div>
            </footer>
          </article>
        ))}
      </div>

      <div
        data-reveal
        className="mt-10 overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-8 text-white shadow-2xl sm:p-12"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-amber-300 uppercase">
              Your next chapter
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              Reserve Your Stay
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              Choose your suite, share your dates, and let our concierge prepare
              the rest — from arrival to the final evening ritual.
            </p>
          </div>
          <Link
            to="/rooms"
            className="inline-flex shrink-0 items-center rounded-full bg-amber-500 px-7 py-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Reserve Your Stay
          </Link>
        </div>
      </div>
    </section>
  )
}
