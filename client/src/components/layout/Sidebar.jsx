import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext.jsx'

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

const navigation = [
  { label: 'Dashboard', to: '/' },
  { label: 'Rooms', to: '/rooms', roles: STAFF_ROLES },
  { label: 'Bookings', to: '/bookings', roles: STAFF_ROLES },
]

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b border-line px-5">
          <Link to="/" onClick={onClose} className="flex items-baseline gap-2">
            <span className="font-display text-xl">LuxuryStay</span>
            <span className="text-[0.65rem] font-medium tracking-[0.22em] text-muted uppercase">
              Admin
            </span>
          </Link>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleNavigation.map((item) => {
            const isActive =
              item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-elevated text-content'
                    : 'text-muted hover:bg-elevated hover:text-content'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    isActive ? 'bg-accent' : 'bg-line-strong'
                  }`}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-line p-4">
          <p className="text-xs text-muted">Signed in as</p>
          <p className="mt-1 truncate text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted capitalize">{user?.role}</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
