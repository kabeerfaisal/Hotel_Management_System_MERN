import api from './api.js'

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  return data
}

export async function register(userData) {
  const { data } = await api.post('/auth/register', userData)
  return data
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data.user
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword({ email, code, newPassword }) {
  const { data } = await api.post('/auth/reset-password', {
    email,
    code,
    newPassword,
  })
  return data
}
