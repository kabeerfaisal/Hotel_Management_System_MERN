import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext.jsx'

function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-line-strong p-2 transition-colors hover:bg-elevated lg:hidden"
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
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Admin console
          </p>
          <p className="font-display text-lg leading-tight">LuxuryStay</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm leading-tight font-medium">{user?.name}</p>
          <p className="text-xs text-muted capitalize">{user?.role}</p>
        </div>

        <div
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-on-accent"
        >
          {initial}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold transition-colors hover:bg-elevated"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

export default Header
