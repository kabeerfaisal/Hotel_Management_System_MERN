import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { HOTEL_NAME } from '../../config/developer.js'
import { useAuth } from '../../context/AuthContext.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'Suites & Rooms', to: '/rooms' },
  { label: 'Experiences', to: '/experiences' },
  { label: 'Our Story', to: '/our-story' },
  { label: 'Support', to: '/support' },
]

const guestLinks = [
  { label: 'My Reservations', to: '/my-reservations' },
  { label: 'Concierge', to: '/services' },
  { label: 'Feedback', to: '/feedback' },
]

function GuestNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isGuest = user?.role === 'guest'
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'G'
  const navigation = isGuest ? [...publicLinks, ...guestLinks] : publicLinks

  const handleSignOut = () => {
    setIsMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const isActiveLink = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to)

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/75 backdrop-blur-md transition-colors dark:border-amber-500/15 dark:bg-slate-950/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="flex shrink-0 items-baseline gap-2"
        >
          <span className="font-display text-xl tracking-tight text-slate-900 dark:text-amber-100">
            {HOTEL_NAME}
          </span>
          <span className="hidden text-[0.6rem] font-semibold tracking-[0.24em] text-amber-700 uppercase 2xl:inline dark:text-amber-400">
            {isGuest ? 'Guest Concierge' : 'Five-star hospitality'}
          </span>
        </Link>

        <nav
          aria-label="Guest navigation"
          className="hidden items-center gap-1 xl:flex"
        >
          {navigation.map((item) => {
            const active = isActiveLink(item.to)

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'text-amber-800 dark:text-amber-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-amber-200'
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-4 -bottom-0.5 h-px bg-amber-600 dark:bg-amber-400" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {user ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white/80 py-1 pr-3 pl-1 md:flex dark:border-amber-500/20 dark:bg-slate-900/80">
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-amber-600 font-display text-xs font-semibold text-white dark:bg-amber-500 dark:text-slate-950"
                >
                  {initial}
                </span>
                <span className="hidden max-w-[9rem] truncate text-sm font-medium 2xl:inline">
                  {user.name}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="hidden rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold transition-colors hover:bg-stone-100 md:inline-flex dark:border-amber-500/25 dark:hover:bg-slate-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold transition-colors hover:bg-stone-100 md:inline-flex dark:border-amber-500/25 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="hidden rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 md:inline-flex dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="guest-mobile-menu"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-lg border border-stone-300 p-2 transition-colors hover:bg-stone-100 xl:hidden dark:border-amber-500/25 dark:hover:bg-slate-800"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="size-5"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div
          id="guest-mobile-menu"
          className="border-t border-stone-200/70 bg-white/95 px-4 py-4 backdrop-blur-md xl:hidden dark:border-amber-500/15 dark:bg-slate-950/95"
        >
          <nav aria-label="Guest navigation mobile" className="grid gap-1">
            {navigation.map((item) => {
              const active = isActiveLink(item.to)

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'text-slate-600 hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-4 border-t border-stone-200 pt-4 dark:border-amber-500/15">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-600 font-display text-xs font-semibold text-white dark:bg-amber-500 dark:text-slate-950"
                  >
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-amber-700 capitalize dark:text-amber-400">
                      {user.role}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold transition-colors hover:bg-stone-100 dark:border-amber-500/25 dark:hover:bg-slate-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full border border-stone-300 px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-stone-100 dark:border-amber-500/25 dark:hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full bg-amber-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default GuestNavbar
