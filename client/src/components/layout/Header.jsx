import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext.jsx'
import { getPortalLabel } from '../../utils/portal.js'
import ThemeToggle from './ThemeToggle.jsx'

function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-stone-200 bg-white/90 px-4 text-slate-900 backdrop-blur transition-colors sm:px-6 lg:px-8 dark:border-amber-500/20 dark:bg-slate-900/90 dark:text-slate-100">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-stone-300 p-2 transition-colors hover:bg-stone-100 dark:border-amber-500/25 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="size-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-amber-700 uppercase dark:text-amber-400">
            {getPortalLabel(user?.role)}
          </p>
          <p className="font-display text-lg leading-tight">LuxuryStay</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm leading-tight font-medium">{user?.name}</p>
          <p className="text-xs text-slate-500 capitalize dark:text-slate-400">
            {user?.role}
          </p>
        </div>

        <ThemeToggle />

        <div
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-amber-600 font-display text-sm font-semibold text-white dark:bg-amber-500 dark:text-slate-950"
        >
          {initial}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold transition-colors hover:bg-stone-100 dark:border-amber-500/25 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

export default Header
