import { useEffect, useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Workspace from './pages/Workspace/Workspace'
import './App.css'

const getRoute = () => window.location.hash.slice(1) || 'home'

const AppContent = () => {
  const [route, setRoute] = useState(getRoute)
  useEffect(() => { const update = () => setRoute(getRoute()); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  if (route.startsWith('login')) return <Login initialRole={route.split('/')[1]} />
  if (route === 'home') return <Home />
  return <Workspace route={route} />
}

const App = () => <AuthProvider><AppContent /></AuthProvider>

export default App
