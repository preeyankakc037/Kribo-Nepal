import { useState, useEffect } from 'react'
import Navbar from '../../components/common/Navbar'

const initialFallbackPosts = [
  {
    id: 1,
    user_role: 'farmer',
    full_name: 'Priyanka Khatri',
    district: 'Chitwan',
    product_name: '🍅 Fresh Tomatoes Available',
    quantity: 800,
    unit: 'KG',
    price: 65,
    harvest_date: '2026-08-04',
    description: 'Fresh tomatoes harvested this morning. Looking for wholesale buyers.'
  },
  {
    id: 2,
    user_role: 'broker',
    full_name: 'Himalayan Fresh Traders',
    district: 'Kathmandu',
    product_name: '🥔 Looking to Buy Potatoes',
    quantity: 2000,
    unit: 'KG',
    price: 50,
    description: 'Ready for immediate pickup. Looking for fresh, quality potatoes.'
  }
]

const Marketplace = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch("http://127.0.0.1:8000/marketplace")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch posts")
        return res.json()
      })
      .then((data) => {
        setPosts(data.length > 0 ? data : initialFallbackPosts)
        setLoading(false)
      })
      .catch((err) => {
        console.warn("Using local fallback posts due to backend connection:", err)
        setPosts(initialFallbackPosts)
        setLoading(false)
      })
  }, [])

  const visiblePosts = posts.filter((post) => {
    const isFarmerSelling = filter === 'selling' && post.user_role === 'farmer'
    const isBrokerBuying = filter === 'buying' && post.user_role === 'broker'
    const matchesFilter = filter === 'all' || isFarmerSelling || isBrokerBuying
    const searchTarget = `${post.full_name || ''} ${post.district || ''} ${post.product_name || ''}`.toLowerCase()
    const matchesQuery = searchTarget.includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  })

  return (
    <>
      <Navbar />
      <main className="marketplace-page">
        <div className="marketplace-title">
          <div>
            <p className="kicker">KRIBO MARKETPLACE</p>
            <h1>Find the right deal.</h1>
            <p>Explore fresh harvests and buying requirements from across Nepal.</p>
          </div>
          <a className="button" href="#create-post">+ Create Post</a>
        </div>

        <section className="market-search" aria-label="Marketplace filters">
          <label className="market-search-input">
            ⌕
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crops, farmers, brokers, districts..."
            />
          </label>
          <div className="market-filters">
            <span>Show:</span>
            {[
              ['all', 'All Posts'],
              ['selling', '🌾 Selling'],
              ['buying', '🛒 Buying']
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? 'selected' : ''}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="create-card">
          <div className="create-mark">+</div>
          <div>
            <h2>What would you like to post today?</h2>
            <p>List your harvest or tell farmers what your business needs.</p>
          </div>
          <a className="button button-outline" href="#create-post">+ Create Post</a>
        </section>

        <div className="post-count">
          {loading ? 'Loading marketplace posts...' : `${visiblePosts.length} ${visiblePosts.length === 1 ? 'opportunity' : 'opportunities'} to explore`}
        </div>

        <section className="post-feed">
          {visiblePosts.map((post) => {
            const isSelling = post.user_role === 'farmer'
            return (
              <article className="market-post" key={post.id}>
                <div className={`status-badge ${isSelling ? 'selling' : 'buying'}`}>
                  {isSelling ? '● SELLING' : '● BUYING'}
                </div>

                <header className="post-header">
                  <div className={`post-avatar ${isSelling ? 'selling' : 'buying'}`}>
                    {isSelling ? '👨‍🌾' : '🧑‍💼'}
                  </div>
                  <div>
                    <h2>{post.full_name}</h2>
                    <p>
                      <b>✓ Verified {isSelling ? 'Farmer' : 'Trader'}</b>
                      {post.district && <span> • 📍 {post.district}</span>}
                    </p>
                  </div>
                </header>

                <div className="post-divider" />
                <h3>{post.product_name}</h3>

                <div className="post-tags">
                  <span>📦 {post.quantity} {post.unit}</span>
                  {post.price && <span>💰 Rs. {post.price} / {post.unit}</span>}
                  {post.harvest_date && <span>📅 Harvest: {post.harvest_date}</span>}
                </div>

                <p className="post-description">{post.description}</p>
                <div className="post-divider" />

                <footer className="post-actions">
                  <button>💬 Contact {isSelling ? 'Farmer' : 'Broker'}</button>
                  <button>📍 View Location</button>
                </footer>
              </article>
            )
          })}
        </section>

        {!loading && visiblePosts.length === 0 && (
          <div className="empty-posts">No posts match this search. Try another crop, name, or district.</div>
        )}
      </main>
    </>
  )
}

export default Marketplace
