import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

const getRoute = () => window.location.hash.slice(1) || 'home'

const NavLink = ({ to, currentRoute, children }) => {
  const isActive = currentRoute === to
  return (
    <a href={`#${to}`} className={isActive ? 'active' : ''}>
      {children}
    </a>
  )
}

/**
 * Navbar
 * Automatically listens to hash changes to highlight the active tab & buttons.
 * - Logged OUT → "Login" (outline) + "Sign Up" (green filled) with active states
 * - Logged IN  → user avatar initial + "Logout" button
 */
const Navbar = () => {
  const { user, logout } = useAuth()
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const isLoginActive = route === 'login'
  const isSignupActive = route.startsWith('signup')

  return (
    <header className="site-header">
      <a href="#home" className="brand">
        <span className="brand-mark">✦</span>
        <span>Kribo Nepal</span>
      </a>

      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="home" currentRoute={route}>Home</NavLink>
        <NavLink to="marketplace" currentRoute={route}>Marketplace</NavLink>
        <NavLink to="kribo-connect" currentRoute={route}>Kribo Connect</NavLink>
        <NavLink to="dashboard" currentRoute={route}>Dashboard</NavLink>
        <NavLink to="market-price" currentRoute={route}>Market Price</NavLink>
      </nav>

      <div className="nav-actions">
        {user ? (
          /* ── Logged-in state ── */
          <>
            <a href="#profile" className={`profile-link ${route === 'profile' ? 'active' : ''}`}>
              <span className="profile-button" title={`Signed in as ${user.full_name || user.name}`}>
                {(user.full_name || user.name || 'K').slice(0, 1).toUpperCase()}
              </span>
            </a>
            <button className="logout-button" onClick={logout}>Logout</button>
          </>
        ) : (
          /* ── Logged-out state: Login (outline) + Sign Up (green) ── */
          <>
            <a
              className={`button button-outline button-small nav-login-outline ${isLoginActive ? 'active' : ''}`}
              href="#login"
              id="nav-login"
            >
              Login
            </a>
            <a
              className={`button button-small nav-signup-btn ${isSignupActive ? 'active' : ''}`}
              href="#signup/farmer"
              id="nav-signup"
            >
              Sign Up
            </a>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
