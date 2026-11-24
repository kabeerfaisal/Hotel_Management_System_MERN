import { Outlet } from 'react-router-dom'

import GuestFooter from './GuestFooter.jsx'
import GuestNavbar from './GuestNavbar.jsx'

/**
 * Guest experience shell: glassmorphic top navigation, full-width content,
 * and a luxury footer. No staff sidebar is rendered for guests.
 */
function GuestLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <GuestNavbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Outlet />
      </main>

      <GuestFooter />
    </div>
  )
}

export default GuestLayout
