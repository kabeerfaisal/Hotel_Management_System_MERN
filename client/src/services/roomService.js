import api from './api.js'

export async function getRooms() {
  const { data } = await api.get('/rooms')
  return data.rooms
}

export async function getRoomById(id) {
  const { data } = await api.get(`/rooms/${id}`)
  return data.room
}

export async function createRoom(roomData) {
  const { data } = await api.post('/rooms', roomData)
  return data.room
}

export async function updateRoom(id, roomData) {
  const { data } = await api.put(`/rooms/${id}`, roomData)
  return data.room
}

export async function deleteRoom(id) {
  const { data } = await api.delete(`/rooms/${id}`)
  return data.room
}
