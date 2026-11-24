import api from './api.js'

export async function createBooking(data) {
  const { data: payload } = await api.post('/bookings', data)
  return payload.booking
}

export async function getAllBookings() {
  const { data } = await api.get('/bookings')
  return data.bookings
}

export async function getMyBookings() {
  const { data } = await api.get('/bookings/me')
  return data.bookings
}

export async function getRoomBookedDates(roomId) {
  const { data } = await api.get(`/bookings/room/${roomId}/booked-dates`)
  return data.bookedDates
}

export async function cancelBooking(id) {
  const { data } = await api.patch(`/bookings/${id}/cancel`)
  return data.booking
}

export async function getBookingInvoice(id) {
  const { data } = await api.get(`/bookings/${id}/invoice`)
  return data.invoice
}

export async function updateBookingStatus(id, status) {
  const { data } = await api.put(`/bookings/${id}/status`, { status })
  return data.booking
}

export async function updateBookingDates(id, payload) {
  const { data } = await api.patch(`/bookings/${id}/dates`, payload)
  return data.booking
}

export async function reviewStayChangeRequest(id, action) {
  const { data } = await api.patch(`/bookings/${id}/stay-request`, { action })
  return data.booking
}
