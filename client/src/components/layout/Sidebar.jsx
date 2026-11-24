import { Link, useLocation } from 'react-router-dom'

import { DEVELOPER_NAME } from '../../config/developer.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { getPortalLabel } from '../../utils/portal.js'
import ThemeToggle from './ThemeToggle.jsx'

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
  { label: 'Rooms', to: '/rooms', icon: 'rooms' },
  { label: 'Bookings', to: '/bookings', roles: STAFF_ROLES, icon: 'bookings' },
  { label: 'Services', to: '/services', icon: 'services' },
  { label: 'Feedback', to: '/feedback', icon: 'feedback' },
  { label: 'Users', to: '/users', roles: ['admin'], icon: 'users' },
  { label: 'Settings', to: '/settings', roles: ['admin'], icon: 'settings' },
]

const iconPaths = {
  dashboard: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5 12 4l8 6.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9.5V20h12V9.5" />
    </>
  ),
  rooms: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
      <path strokeLinecap="round" d="M3 18h18M4 18v2m16-2v2M7 11V7h5v4" />
    </>
  ),
  bookings: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M4 9h16" />
    </>
  ),
  services: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17h16M5 17a7 7 0 0 1 14 0" />
      <path strokeLinecap="round" d="M12 6V4M9 20h6" />
    </>
  ),
  feedback: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2.5V11.5A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z"
      />
      <path strokeLinecap="round" d="M9 11h6M9 14h4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19a5 5 0 0 1 10 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8.5a2.5 2.5 0 1 1 0 5M16 15.5a4 4 0 0 1 4 4" />
    </>
  ),
  settings: (
    <>
      <path strokeLinecap="round" d="M4 7h8M16 7h4M4 17h4M12 17h8" />
      <circle cx="14" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
}

function NavIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="size-4.5 shrink-0"
      aria-hidden="true"
    >
      {iconPaths[name] ?? iconPaths.dashboard}
    </svg>
  )
}

function initialsFor(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?'
  )
}

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { pathname } = useLocation()

  const visibleNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  )

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        className={`fixed inset-0 z-30 bg-black/40 lg:hidden ${
          isOpen ? 'block' : 'hidden'
        }`}
      />

      <aside
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-stone-200 bg-stone-50 text-slate-900 transition-transform duration-200 dark:border-amber-500/20 dark:bg-slate-950 dark:text-slate-100 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b border-stone-200 bg-white px-5 dark:border-amber-500/20 dark:bg-slate-900/90">
          <Link to="/" onClick={onClose} className="flex items-baseline gap-2">
            <span className="font-display text-xl tracking-tight text-slate-900 dark:text-amber-100">
              LuxuryStay
            </span>
            <span className="text-[0.6rem] font-semibold tracking-[0.22em] text-amber-700 uppercase dark:text-amber-400">
              {getPortalLabel(user?.role)}
            </span>
          </Link>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-1.5 overflow-y-auto p-3"
        >
          {visibleNavigation.map((item) => {
            const isActive =
              item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300'
                    : 'text-slate-600 hover:bg-stone-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-amber-200'
                }`}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber-500 dark:bg-amber-400"
                  />
                ) : null}
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-stone-200 p-3 dark:border-amber-500/20">
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-white to-amber-50 p-3 dark:from-slate-900 dark:to-slate-900/60">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-600 font-display text-sm font-semibold text-white dark:bg-amber-500 dark:text-slate-950"
              >
                {initialsFor(user?.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.14em] text-amber-800 uppercase dark:bg-amber-500/15 dark:text-amber-300">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                Appearance
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {isDark ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <ThemeToggle />
          </div>

          <p className="border-t border-stone-200 pt-3 px-1 text-[0.6rem] font-medium tracking-[0.18em] text-slate-400 uppercase dark:border-amber-500/20 dark:text-slate-500">
            Built by {DEVELOPER_NAME}
          </p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
