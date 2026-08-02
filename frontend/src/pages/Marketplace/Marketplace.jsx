import { useState, useEffect } from 'react'
import Navbar from '../../components/common/Navbar'

const LOCAL_MARKETPLACE_POSTS_KEY = 'kribo_marketplace_local_posts'
const LOCAL_MARKETPLACE_IMAGES_KEY = 'kribo_marketplace_local_images'
const DEFAULT_POST_IMAGE = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80'

const Avatar = ({ person, className = 'person-avatar' }) => {
  const name = person.full_name || person.name || 'K'

  let imgSrc = null
  if (person.profile_photo) {
    imgSrc = person.profile_photo
  } else if (person.has_author_photo && person.user_id) {
    imgSrc = `http://127.0.0.1:8000/api/users/${person.user_id}/photo`
  }

  return imgSrc
    ? <img className={className} src={imgSrc} alt={`${name}'s profile`} />
    : <div className={className}>{name.slice(0, 1).toUpperCase()}</div>
}

const readStoredMarketplacePosts = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_MARKETPLACE_POSTS_KEY) || '[]')
  } catch {
    return []
  }
}

const readStoredMarketplaceImages = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_MARKETPLACE_IMAGES_KEY) || '{}')
  } catch {
    return {}
  }
}

const mergePosts = (localPosts, remotePosts) => {
  const merged = new Map()

  ;[...localPosts, ...remotePosts].forEach((post) => {
    if (!post || !post.id) return
    merged.set(post.id, post)
  })

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime()
    const bTime = new Date(b.created_at || 0).getTime()
    return bTime - aTime
  })
}

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
    description: 'Fresh tomatoes harvested this morning. Looking for wholesale buyers.',
    profile_photo: null
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
    description: 'Ready for immediate pickup. Looking for fresh, quality potatoes.',
    profile_photo: null
  }
]

import { useAuth } from '../../hooks/useAuth'

const Marketplace = () => {
  const { user: currentUser } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const localPosts = readStoredMarketplacePosts()

    fetch("http://127.0.0.1:8000/marketplace")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch posts")
        return res.json()
      })
      .then((data) => {
        const mergedPosts = mergePosts(localPosts, data)
        setPosts(mergedPosts.length > 0 ? mergedPosts : initialFallbackPosts)
        setLoading(false)
      })
      .catch((err) => {
        console.warn("Using local fallback posts due to backend connection:", err)
        setPosts(localPosts.length > 0 ? mergePosts(localPosts, []) : initialFallbackPosts)
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
            const postImage = post.image || readStoredMarketplaceImages()[post.id] || DEFAULT_POST_IMAGE
            return (
              <article className="new-market-post" key={post.id}>
                <div className="nmp-header">
                  <Avatar person={post} className="nmp-avatar" />
                  <div className="nmp-user-info">
                    <div className="nmp-name-row">
                      <span className="nmp-name">{post.full_name}</span>
                      <span className="nmp-verified">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{color: '#4caf50'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      </span>
                      <span className="nmp-role-badge">{isSelling ? 'Farmer' : 'Broker'}</span>
                    </div>
                    <div className="nmp-meta-row">
                      <span className="nmp-location">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {post.district || 'Kathmandu'}
                      </span>
                      <span className="nmp-dot">·</span>
                      <span className="nmp-time">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        2h
                      </span>
                      <span className="nmp-dot">·</span>
                      <span className="nmp-rating">⭐ 4.8</span>
                    </div>
                  </div>
                  <div className="nmp-header-right">
                    <button className="nmp-favorite-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                  </div>
                </div>

                <div className="nmp-content">
                  <p className="nmp-desc">
                    {isSelling ? 'Selling ' : 'Buying '} 
                    <strong>{post.product_name}</strong>
                    {post.quantity ? ` — up to ${post.quantity} ${post.unit} ` : ' '}
                    {post.price ? `at Rs. ${post.price}/${post.unit} ` : ' '}
                    from {isSelling ? 'farmers' : 'brokers'} in {post.district || 'Kathmandu'}, Lalitpur. 
                    {post.description ? ` ${post.description}` : ' Pickup arranged directly with the farmer.'}
                  </p>

                  <div className="nmp-tags">
                    <span className="nmp-tag">🍅 {post.product_name}</span>
                    {post.variety && <span className="nmp-tag">🌱 {post.variety}</span>}
                    {post.organic && <span className="nmp-tag">🌿 Organic</span>}
                    {isSelling && <span className="nmp-tag">🥬 Cabbage</span>} 
                  </div>
                </div>

                <div className="nmp-image-container">
                  <img
                    className="nmp-hero-image"
                    src={postImage}
                    alt={post.product_name}
                  />
                </div>

                <div className="nmp-footer">
                  <div className="nmp-stats">
                    <span>340 farmers served</span>
                    <span>126 reviews · replies under 2 hours</span>
                  </div>

                  <div className="nmp-actions single-row">
                    {currentUser && (currentUser.role || '').toLowerCase() !== (post.user_role || '').toLowerCase() && (
                      <>
                        <button className="btn-buy" onClick={() => window.location.href = `/payment/${post.id}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                          Buy Now
                        </button>
                        <button className="btn-message" onClick={() => alert('Messaging feature coming soon!')}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                          Message
                        </button>
                      </>
                    )}
                    <button className="btn-profile" onClick={() => alert('Public profiles coming soon!')}>View Profile</button>
                  </div>
                </div>
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
