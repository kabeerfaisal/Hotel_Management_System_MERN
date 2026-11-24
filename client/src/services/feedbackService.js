import api from './api.js'

export async function getFeedback() {
  const { data } = await api.get('/feedback')
  return { feedback: data.feedback ?? [], averageRating: data.averageRating ?? null }
}

export async function createFeedback(payload) {
  const { data } = await api.post('/feedback', payload)
  return data.feedback
}
