import { useContext } from 'react'
import { AuthContext } from '../context/auth-state'

export const useAuth = () => useContext(AuthContext)

export default useAuth
