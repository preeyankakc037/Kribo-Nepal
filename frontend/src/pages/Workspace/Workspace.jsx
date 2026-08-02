import { useEffect, useState } from 'react'
import Navbar from '../../components/common/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { directoryApi } from '../../services/api'

const Avatar = ({ person, className = 'person-avatar' }) => {
  const name = person.full_name || person.name || 'K'
  
  let imgSrc = null
  if (person.profile_photo) {
    imgSrc = person.profile_photo
  } else if (person.has_photo && person.id) {
    imgSrc = `http://127.0.0.1:8000/api/users/${person.id}/photo`
  }

  return imgSrc
    ? <img className={className} src={imgSrc} alt={`${name}'s profile`} />
    : <div className={className}>{name.slice(0, 1).toUpperCase()}</div>
}

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '')
  const [location, setLocation] = useState(user?.location || '')
  const [description, setDescription] = useState(user?.description || '')
  const [yearsExperience, setYearsExperience] = useState(user?.years_experience || '')
  const [locating, setLocating] = useState(false)

  if (!user) return <><Navbar /><main className="workspace"><p className="kicker">SIGN IN REQUIRED</p><h1>Sign in to view your profile</h1><a className="button" href="#login">Go to login</a></main></>

  const role = user.role === 'broker' ? 'Broker' : 'Farmer'

  const readProfilePhoto = (file) => {
    if (!file) return setProfilePhoto('')
    const reader = new FileReader()
    reader.onload = () => setProfilePhoto(reader.result)
    reader.readAsDataURL(file)
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocation('Location access unavailable')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4)
        const lng = position.coords.longitude.toFixed(4)
        setLocation(`Lat ${lat}, Lng ${lng}`)
        setLocating(false)
      },
      () => {
        setLocation('Current location unavailable')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const save = async (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const payload = Object.fromEntries(data.entries())

    try {
      const updatedUser = await updateUser({
        full_name: payload.full_name || user.full_name,
        mobile: payload.mobile || user.mobile,
        email: payload.email || user.email,
        address: payload.address || user.address,
        location: location || payload.location || user.location,
        profile_photo: profilePhoto || user.profile_photo || '',
        description: description || payload.description || user.description || '',
        years_experience: Number(payload.years_experience || yearsExperience || 0) || null,
      })

      if (updatedUser) {
        setEditing(false)
      }
    } catch {
      setEditing(false)
    }
  }

  return <><Navbar /><main className="workspace"><p className="kicker">MY ACCOUNT</p><h1>Your profile</h1><section className="profile-card">{editing ? <form onSubmit={save}><div className="profile-edit-layout"><div className="profile-photo-editor"><Avatar person={{ ...user, profile_photo: profilePhoto || user.profile_photo }} className="profile-avatar-large" /><label className="upload-button"><input type="file" accept="image/*" onChange={(e) => readProfilePhoto(e.target.files[0])} />Upload picture</label></div><div className="form-grid form-grid-2">{[['full_name', 'Full name'], ['mobile', 'Mobile number'], ['email', 'Email'], ['address', 'Address']].map(([key, label]) => <label className="form-field" key={key}><span>{label}</span><input name={key} defaultValue={user[key] || ''} /></label>)}<label className="form-field form-field-location"><span>Current location</span><div className="location-input-row"><input name="location" value={location} onChange={(e) => setLocation(e.target.value)} /><button className="button button-outline button-small" type="button" onClick={useCurrentLocation}>{locating ? 'Getting...' : 'Use live location'}</button></div></label><label className="form-field"><span>Farmer description</span><textarea name="description" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} /></label>{role === 'Farmer' && <label className="form-field"><span>Years of experience</span><input name="years_experience" type="number" min="0" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} /></label>}</div></div><div className="form-actions"><button className="button button-outline" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button">Save changes</button></div></form> : <><div className="profile-heading"><Avatar person={user} className="profile-avatar" /><div><h2>{user.full_name}</h2><p>{role} account {user.is_verified && <b className="verified-label">✓ Verified</b>}</p></div><button className="button button-outline edit-button" onClick={() => setEditing(true)}>Edit profile</button></div><dl className="profile-details"><div><dt>Mobile number</dt><dd>{user.mobile || 'Not added'}</dd></div><div><dt>Email</dt><dd>{user.email || 'Not added'}</dd></div><div><dt>Address</dt><dd>{user.address || 'Not added'}</dd></div><div><dt>Current location</dt><dd>{user.location || 'Not added'}</dd></div>{user.description && <div className="profile-details-full"><dt>Description</dt><dd>{user.description}</dd></div>}{user.years_experience && <div><dt>Years of experience</dt><dd>{user.years_experience}</dd></div>}</dl></>}</section></main></>
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
