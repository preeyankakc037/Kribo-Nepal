import { createContext, useEffect, useMemo, useState } from 'react'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kribo-user')) } catch { return null }
  })

  useEffect(() => {
    if (user) localStorage.setItem('kribo-user', JSON.stringify(user))
    else localStorage.removeItem('kribo-user')
  }, [user])

  const value = useMemo(() => ({
    user,
    signUp: (details) => setUser({ name: details.name || 'Kribo member', role: details.role }),
    logout: () => setUser(null),
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
