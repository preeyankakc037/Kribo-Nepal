import { useEffect, useState } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import Home from './pages/Home/Home'
import SignupForm from './pages/Login/Login'
import SignIn from './pages/Login/SignIn'
import Marketplace from './pages/Marketplace/Marketplace'
import MarketPrice from './pages/MarketPrice/MarketPrice'
import CreatePost from './pages/Marketplace/CreatePost'
import Workspace from './pages/Workspace/Workspace'
import './App.css'

/**
 * getRoute — reads the URL hash and strips the leading '#'.
 * Falls back to 'home' so the Home page is always the first thing shown.
 */
const getRoute = () => window.location.hash.slice(1) || 'home'

const AppContent = () => {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const update = () => setRoute(getRoute())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  // ── Auth routes ──────────────────────────────────────────────────────────
  // #login → Sign-in form
  if (route === 'login') return <SignIn />

  // #signup → signup form defaulting to farmer
  // #signup/farmer → farmer signup
  // #signup/broker → broker signup
  if (route === 'signup' || route.startsWith('signup/')) {
    const role = route.split('/')[1] || 'farmer'
    return <SignupForm initialRole={role} />
  }

  // ── Page routes ──────────────────────────────────────────────────────────
  if (route === 'home') return <Home />
  if (route === 'marketplace') return <Marketplace />
  if (route === 'market-price') return <MarketPrice />
  if (route === 'create-post') return <CreatePost />

  // dashboard, profile, kribo-connect, etc.
  return <Workspace route={route} />
}

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
)

export default App