import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import api, { TOKEN_STORAGE_KEY } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [isInitializing, setIsInitializing] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)),
  )

  // Restore the session on a full page reload using the stored token.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
      // No token: isInitializing was already initialized to false.
      return undefined
    }

    let isActive = true

    api
      .get('/auth/me')
      .then(({ data }) => {
        if (isActive) setUser(data.user)
      })
      .catch(() => {
        if (!isActive) return
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (isActive) setIsInitializing(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password })

    localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
    setToken(data.token)
    setUser(data.user)

    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isInitializing,
      login,
      logout,
    }),
    [user, token, isInitializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The hook intentionally lives beside its provider so consumers have one import.
// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
