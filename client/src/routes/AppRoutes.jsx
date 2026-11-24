import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import ScrollToTop from '../components/common/ScrollToTop.jsx'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import RoleRoute from '../components/RoleRoute.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import Register from '../pages/Register.jsx'
import Rooms from '../pages/Rooms.jsx'
import Bookings from '../pages/Bookings.jsx'
import Users from '../pages/Users.jsx'
import Services from '../pages/Services.jsx'
import Feedback from '../pages/Feedback.jsx'
import Settings from '../pages/Settings.jsx'
import Experiences from '../pages/Experiences.jsx'

// Editorial pages load on demand so the main bundle stays lean. Experiences
// stays eager because deep links (#spa, #dining, #chauffeur) need their anchors
// present on the first commit for ScrollToTop.
const OurStory = lazy(() => import('../pages/OurStory.jsx'))
const Support = lazy(() => import('../pages/Support.jsx'))
const MyReservations = lazy(() => import('../pages/MyReservations.jsx'))

const STAFF_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping']
const ADMIN_ROLES = ['admin']
const GUEST_ROLES = ['guest']

function RouteSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="py-16 text-center text-sm text-muted">
          Preparing your view…
        </p>
      }
    >
      {children}
    </Suspense>
  )
}

/**
 * Public landing page. Staff are routed straight to their dashboard.
 */
function GuestHomeRoute() {
  const { user } = useAuth()

  if (STAFF_ROLES.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Home />
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public browsing for visitors + guest experience for signed-in guests.
            DashboardLayout renders the guest top-nav shell for both and the
            staff console only for authenticated staff. */}
        <Route element={<DashboardLayout />}>
          <Route index element={<GuestHomeRoute />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="experiences" element={<Experiences />} />
          <Route
            path="our-story"
            element={
              <RouteSuspense>
                <OurStory />
              </RouteSuspense>
            }
          />
          <Route
            path="support"
            element={
              <RouteSuspense>
                <Support />
              </RouteSuspense>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute roles={STAFF_ROLES} />}>
              <Route path="dashboard" element={<Home />} />
            </Route>
            <Route element={<RoleRoute roles={GUEST_ROLES} />}>
              <Route
                path="my-reservations"
                element={
                  <RouteSuspense>
                    <MyReservations />
                  </RouteSuspense>
                }
              />
            </Route>
            <Route path="bookings" element={<Bookings />} />
            <Route path="users" element={<Users />} />
            <Route path="services" element={<Services />} />
            <Route path="feedback" element={<Feedback />} />
            <Route element={<RoleRoute roles={ADMIN_ROLES} />}>
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default AppRoutes
