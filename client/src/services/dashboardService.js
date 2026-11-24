import api from './api.js'

export async function getStats() {
  const { data } = await api.get('/dashboard')

  return {
    totalRooms: data.totalRooms,
    availableRooms: data.availableRooms,
    occupiedRooms: data.occupiedRooms ?? 0,
    occupancyRate: data.occupancyRate ?? 0,
    activeBookings: data.activeBookings,
    totalRevenue: data.totalRevenue,
    recentBookings: data.recentBookings ?? [],
    notifications: data.notifications ?? [],
  }
}
