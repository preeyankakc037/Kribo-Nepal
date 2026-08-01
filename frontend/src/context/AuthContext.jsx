import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-state'

const TOKEN_KEY = 'kribo_token'
const USER_KEY = 'kribo_user'

export const AuthProvider = ({ children }) => {
  // Rehydrate user from localStorage on first load (survives page refresh)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Keep localStorage in sync whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,

      /**
       * Called after a successful API register/login response.
       * Stores the JWT and user object.
       */
      signIn: ({ token, user: userData }) => {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        setUser(userData)
      },

      /**
       * Convenience alias — same as signIn (used by signup flow).
       */
      signUp: ({ token, user: userData }) => {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        setUser(userData)
      },

      logout: () => {
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
