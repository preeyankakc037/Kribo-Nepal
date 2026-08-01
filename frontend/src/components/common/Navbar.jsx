import { useAuth } from '../../hooks/useAuth'

const NavLink = ({ to, children }) => <a href={`#${to}`}>{children}</a>

const Navbar = () => {
  const { user } = useAuth()

  return (
    <header className="site-header">
      <NavLink to="home"><span className="brand"><span className="brand-mark">✦</span><span>Kribo Nepal</span></span></NavLink>
      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="home">Home</NavLink>
        <NavLink to="marketplace">Marketplace</NavLink>
        <NavLink to="kribo-connect">Kribo Connect</NavLink>
        <NavLink to="dashboard">Dashboard</NavLink>
        <NavLink to="market-price">Market Price</NavLink>
      </nav>
      <div className="nav-actions">
        <NavLink to={user ? 'profile' : 'login'}><span className="profile-button" title={user ? 'Open profile' : 'Log in'}>{user ? user.name.slice(0, 1).toUpperCase() : 'K'}</span></NavLink>
      </div>
    </header>
  )
}

export default Navbar
