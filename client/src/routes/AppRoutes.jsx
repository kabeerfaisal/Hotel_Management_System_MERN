import { Route, Routes } from 'react-router-dom'

import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import Register from '../pages/Register.jsx'
import Rooms from '../pages/Rooms.jsx'
import Bookings from '../pages/Bookings.jsx'

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
          <Route path="bookings" element={<Bookings />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes