import { useState } from 'react'
import Navbar from '../../components/common/Navbar'
import { useAuth } from '../../hooks/useAuth'

const content = {
  marketplace: ['Marketplace', 'Browse current harvest listings, filter by crop and location, or create your own listing.'],
  'kribo-connect': ['Kribo Connect', 'Discover trusted farming and trading partners near your location.'],
  'market-price': ['Market Price', 'Compare local market prices and recent broker offers before you trade.'],
  dashboard: ['Dashboard', 'View your listings, incoming offers, saved opportunities, and marketplace activity.'],
  profile: ['Profile', 'Update your personal details, verification documents, and account preferences.'],
}

const Workspace = ({ route }) => {
  const { user, signUp } = useAuth()
  const [editing, setEditing] = useState(false)
  const [baseTitle, text] = content[route] || content.dashboard
  const role = user?.role === 'broker' ? 'Broker' : 'Farmer'
  const title = route === 'dashboard' ? `${role} Dashboard` : baseTitle
  const connectionTitle = role === 'Broker' ? 'Nearby farmers' : 'Nearby brokers'
  const saveProfile = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    signUp({ ...user, name: data.get('name'), mobile: data.get('mobile'), email: data.get('email'), address: data.get('address'), location: data.get('location') })
    setEditing(false)
  }
  if (route === 'profile') return <><Navbar /><main className="workspace"><p className="kicker">MY ACCOUNT</p><h1>Your profile</h1><p>Your account details are visible here. Keep them up to date so the right people can contact you.</p><section className="profile-card">{editing ? <form onSubmit={saveProfile}><div className="profile-heading"><div className="profile-avatar">{user.name.slice(0, 1).toUpperCase()}</div><div><h2>Edit profile</h2><p>{role} account</p></div></div><div className="form-grid"><label className="form-field"><span>{role === 'Broker' ? 'Business name / full name' : 'Full name'}</span><input name="name" defaultValue={user.name} required /></label><label className="form-field"><span>Mobile number</span><input name="mobile" defaultValue={user.mobile || ''} required /></label><label className="form-field"><span>Email</span><input name="email" type="email" defaultValue={user.email || ''} /></label><label className="form-field"><span>Address</span><input name="address" defaultValue={user.address || ''} /></label><label className="form-field"><span>{role === 'Broker' ? 'Trading location' : 'Farm location'}</span><input name="location" defaultValue={user.location || ''} /></label></div><div className="form-actions"><button className="button button-outline" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button" type="submit">Save changes</button></div></form> : <><div className="profile-heading"><div className="profile-avatar">{user.name.slice(0, 1).toUpperCase()}</div><div><h2>{user.name}</h2><p>{role} account</p></div><button className="button button-outline edit-button" onClick={() => setEditing(true)}>Edit profile</button></div><dl className="profile-details"><div><dt>Mobile number</dt><dd>{user.mobile || 'Not added'}</dd></div><div><dt>Email</dt><dd>{user.email || 'Not added'}</dd></div><div><dt>Address</dt><dd>{user.address || 'Not added'}</dd></div><div><dt>{role === 'Broker' ? 'Trading location' : 'Farm location'}</dt><dd>{user.location || 'Not added'}</dd></div></dl></>}</section></main></>
  return <><Navbar /><main className="workspace"><p className="kicker">{user ? `${role.toUpperCase()} PORTAL` : 'KRIBO NEPAL'}</p><h1>{title}</h1><p>{text}</p><div className="workspace-cards"><article><span>◫</span><h2>{route === 'kribo-connect' ? connectionTitle : role === 'Broker' ? 'My requirements' : 'My listings'}</h2><p>{route === 'kribo-connect' ? `Location-based ${connectionTitle.toLowerCase()} will appear here once your location is available.` : 'Nothing has been added yet. Create your first marketplace post to begin.'}</p><a className="button" href="#marketplace">Open marketplace</a></article><article><span>↗</span><h2>Offers & activity</h2><p>New bids, responses, and saved opportunities will appear here.</p></article></div></main></>
}

export default Workspace
