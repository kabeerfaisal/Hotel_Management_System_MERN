import api from './api.js'

export async function getServiceRequests() {
  const { data } = await api.get('/service-requests')
  return data.requests ?? []
}

export async function createServiceRequest(payload) {
  const { data } = await api.post('/service-requests', payload)
  return data.request
}

export async function updateServiceRequest(id, payload) {
  const { data } = await api.patch(`/service-requests/${id}`, payload)
  return data.request
}
