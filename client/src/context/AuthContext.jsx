import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { TOKEN_STORAGE_KEY } from '../config/constants.js'
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from '../services/authService.js'

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
      return undefined
    }

    let isActive = true

    getCurrentUser()
      .then((currentUser) => {
        if (isActive) setUser(currentUser)
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

  const persistSession = useCallback((data) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const login = useCallback(
    async (credentials) => persistSession(await loginRequest(credentials)),
    [persistSession],
  )

  const register = useCallback(
    async (userData) => persistSession(await registerRequest(userData)),
    [persistSession],
  )

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
      register,
      logout,
    }),
    [user, token, isInitializing, login, register, logout],
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
