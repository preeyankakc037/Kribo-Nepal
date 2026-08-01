import Navbar from '../../components/common/Navbar'
import { useAuth } from '../../hooks/useAuth'

const content = {
  marketplace: ['Marketplace', 'Browse current harvest listings, filter by crop and location, or create your own listing.'],
  'market-price': ['Market Price', 'Compare local market prices and recent broker offers before you trade.'],
  role: ['Your role', 'Manage your public profile, verification details, and preferred crops.'],
  dashboard: ['Dashboard', 'View your listings, incoming offers, saved opportunities, and marketplace activity.'],
  profile: ['Profile', 'Update your personal details, verification documents, and account preferences.'],
}

const Workspace = ({ route }) => {
  const { user } = useAuth()
  const [title, text] = content[route] || content.dashboard
  const role = user?.role === 'broker' ? 'Broker' : 'Farmer'
  return <><Navbar /><main className="workspace"><p className="kicker">{role.toUpperCase()} PORTAL</p><h1>{route === 'role' ? `${role} profile` : title}</h1><p>{text}</p><div className="workspace-cards"><article><span>◫</span><h2>{role === 'Broker' ? 'My requirements' : 'My listings'}</h2><p>Nothing has been added yet. Create your first marketplace post to begin.</p><a className="button" href="#marketplace">Open marketplace</a></article><article><span>↗</span><h2>Offers & activity</h2><p>New bids, responses, and saved opportunities will appear here.</p></article></div></main></>
}

export default Workspace
