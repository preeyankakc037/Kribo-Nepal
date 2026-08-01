import { useEffect, useState } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import Home from './pages/Home/Home'
import SignupForm from './pages/Login/Login'
import SignIn from './pages/Login/SignIn'
import Marketplace from './pages/Marketplace/Marketplace'
import CreatePost from './pages/Marketplace/CreatePost'
import MarketPrice from './pages/MarketPrice/MarketPrice'
import Workspace from './pages/Workspace/Workspace'
import './App.css'

const getRoute = () => window.location.hash.slice(1) || 'home'

const AppContent = () => {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const update = () => setRoute(getRoute())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  if (route.startsWith('login')) return <SignIn />
  if (route.startsWith('signup')) return <SignupForm initialRole={route.split('/')[1]} />
  if (route === 'home') return <Home />
  if (route === 'marketplace') return <Marketplace />
  if (route === 'create-post') return <CreatePost />
  if (route === 'market-price') return <MarketPrice />

  return <Workspace route={route} />
}

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
)

export default App
