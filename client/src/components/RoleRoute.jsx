import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.jsx'

/**
 * Guards nested routes by role. Unauthorized users are returned to the
 * dashboard instead of seeing a partially rendered page.
 */
function RoleRoute({ roles }) {
  const { user } = useAuth()

  if (!roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RoleRoute
