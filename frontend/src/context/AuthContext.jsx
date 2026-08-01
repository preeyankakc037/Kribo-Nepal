import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-state'

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
    signUp: (details) => setUser({ ...details, name: details.name || 'Kribo member' }),
    logout: () => setUser(null),
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
