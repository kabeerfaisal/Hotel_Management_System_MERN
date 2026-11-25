import { Link } from 'react-router-dom'

import { DEVELOPER_NAME, HOTEL_NAME } from '../../config/developer.js'

function GuestFooter() {
  return (
    <footer className="border-t border-stone-200/80 bg-white/60 transition-colors dark:border-amber-500/15 dark:bg-slate-950/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-2xl tracking-tight">{HOTEL_NAME}</p>
          <p className="mt-1 text-[0.6rem] font-semibold tracking-[0.26em] text-amber-700 uppercase dark:text-amber-400">
            Five-star hospitality
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Timeless suites, attentive concierge service, and quiet luxury in the
            heart of the city.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
            Reach the concierge
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>12 Marine Promenade, Clifton, Karachi</li>
            <li>
              <a
                href="tel:+923322334100"
                className="transition-colors hover:text-amber-700 dark:hover:text-amber-300"
              >
                +92 3322334100
              </a>
            </li>
            <li>
              <a
                href="mailto:support@luxurystay.com"
                className="transition-colors hover:text-amber-700 dark:hover:text-amber-300"
              >
                support@luxurystay.com
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
            At your service
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                to="/rooms"
                className="text-slate-600 transition-colors hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300"
              >
                Suites & Rooms
              </Link>
            </li>
            <li>
              <Link
                to="/experiences"
                className="text-slate-600 transition-colors hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300"
              >
                Signature Experiences
              </Link>
            </li>
            <li>
              <Link
                to="/our-story"
                className="text-slate-600 transition-colors hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300"
              >
                Our Story
              </Link>
            </li>
            <li>
              <Link
                to="/my-reservations"
                className="text-slate-600 transition-colors hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300"
              >
                My Reservations
              </Link>
            </li>
            <li>
              <Link
                to="/support"
                className="text-slate-600 transition-colors hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300"
              >
                Help &amp; Support
              </Link>
            </li>
            <li className="pt-2 text-xs text-slate-500 dark:text-slate-400">
              Check-in 14:00 · Check-out 12:00
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-200/80 px-4 py-5 text-center text-[0.65rem] font-medium tracking-[0.18em] text-slate-500 uppercase sm:px-6 dark:border-amber-500/15 dark:text-slate-400">
        Created by {DEVELOPER_NAME} • {HOTEL_NAME}
      </div>
    </footer>
  )
}

export default GuestFooter
