import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  useHeroFadeUp,
  useHoverLift,
  useStaggerReveal,
} from '../hooks/useLuxuryAnimations.js'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80'

const STEPS = [
  {
    number: '01',
    title: 'Browse Suites',
    copy: 'Explore the live suite collection, compare amenities, and check booked date ranges before choosing your room.',
    to: '/rooms',
  },
  {
    number: '02',
    title: 'Reserve Dates',
    copy: 'Sign in, pick your arrival and departure dates, and confirm your reservation in a single step.',
    to: '/rooms',
  },
  {
    number: '03',
    title: 'Track & Request Concierge',
    copy: 'Follow your stay from My Reservations and request housekeeping, dining, laundry, or transport when you need it.',
    to: '/my-reservations',
  },
  {
    number: '04',
    title: 'Download PKR Invoice',
    copy: 'Open any reservation and print a detailed PKR invoice with room charges, concierge services, and tax.',
    to: '/my-reservations',
  },
]

const FAQS = [
  {
    question: 'How do I book a suite?',
    answer:
      'Browse Suites & Rooms, choose an available suite, and select Book Now. Pick your check-in and check-out dates, confirm your guest count, and submit the reservation. You can review the already-booked date ranges inside the booking dialog before confirming.',
  },
  {
    question: 'What are the check-in and check-out times?',
    answer:
      'Check-in begins at 14:00 and check-out is at 12:00. Early arrival and late departure can be arranged through the concierge, subject to availability.',
  },
  {
    question: 'What is the cancellation policy?',
    answer:
      'Pending and confirmed reservations can be cancelled directly from My Reservations. Cancellations are not available once a stay is in residence, has checked out, or has already been cancelled. Contact the concierge for exceptional circumstances.',
  },
  {
    question: 'How do I request concierge services?',
    answer:
      'Signed-in guests can use the Concierge page to request housekeeping, maintenance, room service, laundry, transportation, or wake-up calls. Requests are routed to the on-duty team and tracked from the same page.',
  },
  {
    question: 'How is my PKR invoice generated?',
    answer:
      'Every reservation includes a printable invoice in PKR. Open View / Print Invoice from My Reservations to see room charges, any billable concierge services, applicable tax, and the grand total. Use the Print Invoice action to save or print a copy.',
  },
]

const CONTACT = [
  {
    label: 'Concierge desk',
    value: '+92 3322334100',
    href: 'tel:+923322334100',
    icon: 'phone',
  },
  {
    label: 'Email',
    value: 'support@luxurystay.com',
    href: 'mailto:support@luxurystay.com',
    icon: 'mail',
  },
  {
    label: 'Karachi flagship',
    value: '12 Marine Promenade, Clifton · Desk open 24/7',
    href: null,
    icon: 'pin',
  },
]

function ContactIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="size-5"
      aria-hidden="true"
    >
      {name === 'phone' ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 6.9 6.9L16 15l4 1.5V20a1 1 0 0 1-1.1 1A16.9 16.9 0 0 1 3 5.1 1 1 0 0 1 4 4h1Z"
        />
      ) : null}
      {name === 'mail' ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m3.5 7 8.5 6 8.5-6" />
        </>
      ) : null}
      {name === 'pin' ? (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
          />
          <circle cx="12" cy="10" r="2.5" />
        </>
      ) : null}
    </svg>
  )
}

function Support() {
  const [openFaq, setOpenFaq] = useState(0)
  const pageRef = useRef(null)

  useHeroFadeUp(pageRef)
  useStaggerReveal(pageRef)
  useHoverLift(pageRef)

  return (
    <section ref={pageRef} className="pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950 shadow-2xl">
        <img
          src={HERO_IMAGE}
          alt="Luxury hotel concierge lobby"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-900/25" />
        <div className="relative px-6 py-16 sm:px-10 sm:py-24">
          <p
            data-hero-animate
            className="text-xs font-semibold tracking-[0.28em] text-amber-300 uppercase"
          >
            At your service
          </p>
          <h1
            data-hero-animate
            className="mt-4 max-w-3xl font-display text-4xl leading-tight text-white sm:text-6xl"
          >
            Help &amp; Support
          </h1>
          <p
            data-hero-animate
            className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base"
          >
            Everything you need to reserve, manage, and enjoy your stay — plus a
            concierge desk that never closes.
          </p>
        </div>
      </div>

      <div className="mt-16">
        <div data-reveal>
          <p className="text-xs font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
            Quick guide
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Four Steps to a Seamless Stay
          </h2>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <Link
              key={step.number}
              to={step.to}
              data-reveal
              data-hover-lift
              className="group rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-amber-500/15 dark:bg-slate-900"
            >
              <p className="font-display text-2xl text-amber-600 dark:text-amber-400">
                {step.number}
              </p>
              <h3 className="mt-3 font-display text-xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {step.copy}
              </p>
              <span className="mt-4 inline-flex text-xs font-semibold tracking-[0.12em] text-amber-700 uppercase transition-transform group-hover:translate-x-1 dark:text-amber-400">
                Continue →
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <div data-reveal>
            <p className="text-xs font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
              Frequently asked
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              Questions, Answered
            </h2>
          </div>

          <div className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:divide-slate-800 dark:border-amber-500/15 dark:bg-slate-900">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index
              const panelId = `faq-panel-${index}`
              const buttonId = `faq-button-${index}`

              return (
                <div key={faq.question} data-reveal>
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors hover:bg-amber-50/60 sm:px-6 dark:hover:bg-amber-500/5"
                    >
                      {faq.question}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className={`size-4 shrink-0 text-amber-700 transition-transform duration-300 dark:text-amber-400 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </h3>
                  {isOpen ? (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6 dark:text-slate-400"
                    >
                      {faq.answer}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div
          data-reveal
          className="h-fit rounded-3xl border border-amber-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-7 text-white shadow-2xl"
        >
          <p className="text-xs font-semibold tracking-[0.24em] text-amber-300 uppercase">
            24/7 concierge
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight">
            A Human, Always Awake
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            From a midnight arrival to a last-minute dinner reservation, our
            concierge team is one call away.
          </p>

          <ul className="mt-7 space-y-5">
            {CONTACT.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300">
                  <ContactIcon name={item.icon} />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.6rem] font-semibold tracking-[0.18em] text-amber-300/80 uppercase">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-1 block break-words text-sm font-medium text-white transition-colors hover:text-amber-300"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-200">
                      {item.value}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <a
            href="tel:+923322334100"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Call the Concierge
          </a>
        </div>
      </div>

      <div
        data-reveal
        className="mt-16 overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-8 text-white shadow-2xl sm:p-12"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-amber-300 uppercase">
              Ready when you are
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              Begin Your Stay
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              Browse the suite collection and reserve the dates that suit you. We
              will take care of the rest.
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

export default Support
