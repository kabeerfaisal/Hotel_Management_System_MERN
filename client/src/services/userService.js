import api from './api.js'

export async function getUsers(role) {
  const params = role ? { role } : {}
  const { data } = await api.get('/users', { params })
  return data.users ?? []
}

export async function createUser(payload) {
  const { data } = await api.post('/users', payload)
  return data.user
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload)
  return data.user
}

export async function toggleUserStatus(id) {
  const { data } = await api.patch(`/users/${id}/status`)
  return data.user
}
