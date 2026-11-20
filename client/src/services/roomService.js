import api from './api.js'

/**
 * List every room. Available to all authenticated users.
 */
export async function getRooms() {
  const { data } = await api.get('/rooms')
  return data.rooms
}

/**
 * Load a single room by id.
 */
export async function getRoomById(id) {
  const { data } = await api.get(`/rooms/${id}`)
  return data.room
}

/**
 * Create a room. Admin and manager only.
 */
export async function createRoom(roomData) {
  const { data } = await api.post('/rooms', roomData)
  return data.room
}

/**
 * Update a room. Admin and manager only.
 */
export async function updateRoom(id, roomData) {
  const { data } = await api.put(`/rooms/${id}`, roomData)
  return data.room
}

/**
 * Delete a room. Admin and manager only.
 */
export async function deleteRoom(id) {
  const { data } = await api.delete(`/rooms/${id}`)
  return data.room
}
