import api from './api.js'

/**
 * Create a booking for the signed-in guest.
 */
export async function createBooking(data) {
  const { data: payload } = await api.post('/bookings', data)
  return payload.booking
}

/**
 * List every booking. Staff only.
 */
export async function getAllBookings() {
  const { data } = await api.get('/bookings')
  return data.bookings
}

/**
 * Move a booking to a new status. Staff only.
 */
export async function updateBookingStatus(id, status) {
  const { data } = await api.put(`/bookings/${id}/status`, { status })
  return data.booking
}
