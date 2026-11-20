import api from './api.js'

/**
 * Authenticate with email + password.
 * Returns { token, user } from the API.
 */
export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  return data
}

/**
 * Create a guest account.
 * Returns { token, user } from the API.
 */
export async function register(userData) {
  const { data } = await api.post('/auth/register', userData)
  return data
}

/**
 * Load the profile for the currently stored token.
 */
export async function getCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data.user
}
