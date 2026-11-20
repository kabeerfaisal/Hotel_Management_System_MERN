import { Route, Routes } from 'react-router-dom'

import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import Placeholder from '../pages/Placeholder.jsx'
import Register from '../pages/Register.jsx'
import Rooms from '../pages/Rooms.jsx'

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="bookings" element={<Placeholder title="Bookings" />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
