import { useState } from 'react'
import Navbar from '../../components/common/Navbar'

const posts = [
  { id: 1, type: 'selling', role: 'Farmer', icon: '👨‍🌾', author: 'Priyanka Khatri', location: 'Chitwan', time: '2h ago', crop: '🍅 Fresh Tomatoes Available', quantity: '800 KG', price: 'Rs. 65 / KG', date: 'August 4', description: 'Fresh tomatoes harvested this morning. Looking for wholesale buyers.', interested: 18 },
  { id: 2, type: 'buying', role: 'Trader', icon: '🧑‍💼', author: 'Himalayan Fresh Traders', location: 'Kathmandu', time: '30 min ago', crop: '🥔 Looking to Buy Potatoes', quantity: '2 Tons', price: 'Rs. 50 / KG', description: 'Ready for immediate pickup. Looking for fresh, quality potatoes.', interested: 9 },
]

const Marketplace = () => {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const visiblePosts = posts.filter((post) => (filter === 'all' || post.type === filter) && `${post.author} ${post.location} ${post.crop}`.toLowerCase().includes(query.toLowerCase()))
  return <><Navbar /><main className="marketplace-page">
    <div className="marketplace-title"><div><p className="kicker">KRIBO MARKETPLACE</p><h1>Find the right deal.</h1><p>Explore fresh harvests and buying requirements from across Nepal.</p></div><a className="button" href="#dashboard">+ Create Post</a></div>
    <section className="market-search" aria-label="Marketplace filters"><label className="market-search-input">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search crops, farmers, brokers, districts..." /></label><div className="market-filters"><span>Show:</span>{[['all', 'All Posts'], ['selling', '🌾 Selling'], ['buying', '🛒 Buying']].map(([value, label]) => <button className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)} key={value}>{label}</button>)}<button className="filter-more">⚙ More filters</button></div></section>
    <section className="create-card"><div className="create-mark">+</div><div><h2>What would you like to post today?</h2><p>List your harvest or tell farmers what your business needs.</p></div><a className="button button-outline" href="#dashboard">+ Create Post</a></section>
    <div className="post-count">{visiblePosts.length} {visiblePosts.length === 1 ? 'opportunity' : 'opportunities'} to explore</div>
    <section className="post-feed">{visiblePosts.map((post) => <article className="market-post" key={post.id}>
      <div className={`status-badge ${post.type}`}>{post.type === 'selling' ? '● SELLING' : '● BUYING'}</div>
      <header className="post-header"><div className={`post-avatar ${post.type}`}>{post.icon}</div><div><h2>{post.author}</h2><p><b>✓ Verified {post.role === 'Farmer' ? 'Farmer' : 'Trader'}</b> <span>•</span> 📍 {post.location} <span>•</span> 🕒 {post.time}</p></div></header>
      <div className="post-divider" /><h3>{post.crop}</h3><div className="post-tags"><span>📦 {post.quantity}</span><span>💰 {post.type === 'buying' ? 'Budget: ' : ''}{post.price}</span>{post.date && <span>📅 Harvest: {post.date}</span>}</div><p className="post-description">{post.description}</p><div className="post-divider" /><footer className="post-actions"><span>♡ {post.interested} Interested</span><button>💬 Contact {post.role === 'Farmer' ? 'Farmer' : 'Broker'}</button><button>◉ View Profile</button><button>📍 View Location</button></footer>
    </article>)}</section>
    {visiblePosts.length === 0 && <div className="empty-posts">No posts match this search. Try another crop, name, or district.</div>}
  </main></>
}

export default Marketplace
