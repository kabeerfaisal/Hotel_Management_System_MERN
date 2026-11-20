import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  // Wait for the token check before deciding — avoids a redirect flash on reload.
  if (isInitializing) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas px-6">
        <p role="status" className="text-sm text-muted">
          Restoring session…
        </p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
