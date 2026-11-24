import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext.jsx'
import GuestLayout from './GuestLayout.jsx'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

function DashboardLayout() {
  const { user, isInitializing } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Avoid flashing the guest shell while an existing session is restored.
  if (isInitializing) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas px-6">
        <p role="status" className="text-sm text-muted">
          Restoring session…
        </p>
      </main>
    )
  }

  // Guests and visitors get the luxury top-nav experience; staff keep the console.
  if (!user || user.role === 'guest') {
    return <GuestLayout />
  }

  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-h-dvh flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
