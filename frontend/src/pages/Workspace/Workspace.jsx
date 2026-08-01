import { useEffect, useState } from 'react'
import Navbar from '../../components/common/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { directoryApi } from '../../services/api'

const Avatar = ({ person }) => {
  const name = person.full_name || person.name || 'K'
  return person.profile_photo
    ? <img className="person-avatar" src={person.profile_photo} alt={`${name}'s profile`} />
    : <div className="person-avatar">{name.slice(0, 1).toUpperCase()}</div>
}

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  if (!user) return <><Navbar /><main className="workspace"><p className="kicker">SIGN IN REQUIRED</p><h1>Sign in to view your profile</h1><a className="button" href="#login">Go to login</a></main></>
  const role = user.role === 'broker' ? 'Broker' : 'Farmer'
  const save = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    updateUser(Object.fromEntries(data.entries()))
    setEditing(false)
  }
  return <><Navbar /><main className="workspace"><p className="kicker">MY ACCOUNT</p><h1>Your profile</h1><section className="profile-card">{editing ? <form onSubmit={save}><div className="form-grid">{[['full_name', 'Full name'], ['mobile', 'Mobile number'], ['email', 'Email'], ['address', 'Address'], ['location', role === 'Broker' ? 'Trading location' : 'Farm location']].map(([key, label]) => <label className="form-field" key={key}><span>{label}</span><input name={key} defaultValue={user[key] || ''} /></label>)}</div><div className="form-actions"><button className="button button-outline" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button">Save changes</button></div></form> : <><div className="profile-heading"><Avatar person={user} /><div><h2>{user.full_name}</h2><p>{role} account {user.is_verified && <b className="verified-label">✓ Verified</b>}</p></div><button className="button button-outline edit-button" onClick={() => setEditing(true)}>Edit profile</button></div><dl className="profile-details"><div><dt>Mobile number</dt><dd>{user.mobile || 'Not added'}</dd></div><div><dt>Email</dt><dd>{user.email || 'Not added'}</dd></div><div><dt>Address</dt><dd>{user.address || 'Not added'}</dd></div><div><dt>Location</dt><dd>{user.location || 'Not added'}</dd></div></dl></>}</section></main></>
}

const KriboConnect = () => {
  const { user } = useAuth()
  const targetRole = user?.role === 'broker' ? 'farmer' : 'broker'
  const label = targetRole === 'farmer' ? 'Farmers' : 'Brokers'
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    setLoading(true)
    directoryApi.listPeople(targetRole)
      .then((data) => alive && setPeople(data.filter((item) => item.id !== user?.id)))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [targetRole, user?.id])
  return <><Navbar /><main className="workspace connect-page"><p className="kicker">KRIBO CONNECT</p><h1>Meet trusted {label.toLowerCase()}</h1><p>Registered Kribo Nepal users appear here with their public farming or trading information. Private contact details stay protected.</p>{loading && <p className="directory-status">Loading community profiles…</p>}{error && <p className="form-error">{error}</p>}{!loading && !error && <><p className="directory-count">{people.length} {label.toLowerCase()} on Kribo Connect</p><section className="people-grid">{people.map((person) => <article className="person-card" key={person.id}><header><Avatar person={person} /><div><h2>{person.full_name}</h2><p>{person.role === 'farmer' ? 'Farmer' : 'Broker / Trader'} {person.is_verified ? <b className="verified-label">✓ Verified</b> : <span className="pending-label">Unverified</span>}</p></div></header><div className="person-info"><span>📍 {person.location || 'Location not added'}</span>{person.scale && <span>📦 {person.scale}</span>}{person.transport && <span>🚚 {person.transport}</span>}</div>{person.crops?.length > 0 && <div className="person-crops">{person.crops.map((crop) => <span key={crop}>{crop}</span>)}</div>}<a className="button button-outline person-action" href={user ? '#marketplace' : '#login'}>{user ? 'View marketplace' : 'Sign in to connect'}</a></article>)}</section>{people.length === 0 && <div className="empty-directory"><h2>No {label.toLowerCase()} yet</h2><p>New community profiles will appear here after they create an account.</p></div>}</>}</main></>
}

const Workspace = ({ route }) => {
  const { user } = useAuth()
  if (route === 'profile') return <ProfilePage />
  if (route === 'kribo-connect') return <KriboConnect />
  const role = user?.role === 'broker' ? 'Broker' : 'Farmer'
  const title = route === 'market-price' ? 'Market Price' : `${role} Dashboard`
  const text = route === 'market-price' ? 'Compare local market prices and recent broker offers before you trade.' : 'View your listings, incoming offers, saved opportunities, and marketplace activity.'
  return <><Navbar /><main className="workspace"><p className="kicker">{user ? `${role.toUpperCase()} PORTAL` : 'KRIBO NEPAL'}</p><h1>{title}</h1><p>{text}</p><div className="workspace-cards"><article><h2>{role === 'Broker' ? 'My requirements' : 'My listings'}</h2><p>Nothing has been added yet. Create your first marketplace post to begin.</p><a className="button" href="#marketplace">Open marketplace</a></article><article><h2>Offers & activity</h2><p>New bids, responses, and saved opportunities will appear here.</p></article></div></main></>
}
export default Workspace
