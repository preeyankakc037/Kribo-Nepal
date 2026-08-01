import { useAuth } from '../../hooks/useAuth'

const NavLink = ({ to, children }) => <a href={`#${to}`}>{children}</a>

const Navbar = () => {
  const { user } = useAuth()
  const roleLabel = user?.role === 'broker' ? 'Broker' : 'Farmer'

  return (
    <header className="site-header">
      <NavLink to="home"><span className="brand"><span className="brand-mark">✦</span><span>Kribo Nepal</span></span></NavLink>
      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="home">Home</NavLink>
        <NavLink to="marketplace">Marketplace</NavLink>
        {user && <NavLink to="role">{roleLabel}</NavLink>}
        <NavLink to="market-price">Market Price</NavLink>
        {user && <NavLink to="dashboard">Dashboard</NavLink>}
        {user && <NavLink to="profile">Profile</NavLink>}
      </nav>
      <div className="nav-actions">
        {user ? <span className="signed-in">Hi, {user.name.split(' ')[0]}</span> : <NavLink to="login">Log in</NavLink>}
        {!user && <NavLink to="login"><span className="button button-small">Get started</span></NavLink>}
      </div>
    </header>
  )
}

export default Navbar
