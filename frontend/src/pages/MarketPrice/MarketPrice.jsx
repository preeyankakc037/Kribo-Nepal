import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Navbar from '../../components/common/Navbar'

// ── Static fallback (used if week fetch fails) ───────────────────────────────
const FALLBACK_TREND = [
  { day: 'Mon', Tomato: 48, Cauliflower: 42, Potato: 28, Onion: 62 },
  { day: 'Tue', Tomato: 51, Cauliflower: 40, Potato: 29, Onion: 65 },
  { day: 'Wed', Tomato: 49, Cauliflower: 41, Potato: 31, Onion: 64 },
  { day: 'Thu', Tomato: 54, Cauliflower: 45, Potato: 32, Onion: 69 },
  { day: 'Fri', Tomato: 57, Cauliflower: 47, Potato: 33, Onion: 72 },
  { day: 'Sat', Tomato: 62, Cauliflower: 44, Potato: 35, Onion: 74 },
  { day: 'Sun', Tomato: 60, Cauliflower: 43, Potato: 34, Onion: 73 },
]

// ── District-wise rates data for bar chart ───────────────────────────────────
const districtData = [
  { district: 'Kathmandu', rate: 64 },
  { district: 'Chitwan', rate: 52 },
  { district: 'Pokhara', rate: 58 },
  { district: 'Dhading', rate: 47 },
  { district: 'Jhapa', rate: 44 },
  { district: 'Banke', rate: 49 },
]

// ── Stat cards data ──────────────────────────────────────────────────────────
const statCards = [
  {
    crop: 'Tomato (Big)',
    price: 'Rs 62/kg',
    change: '+5.1% vs yesterday',
    isUp: true,
  },
  {
    crop: 'Cauliflower',
    price: 'Rs 44/kg',
    change: '-2.2% vs yesterday',
    isUp: false,
  },
  {
    crop: 'Onion (Dry)',
    price: 'Rs 74/kg',
    change: '+5.7% vs yesterday',
    isUp: true,
  },
  {
    crop: 'Potato (Red)',
    price: 'Rs 35/kg',
    change: '+6.1% vs yesterday',
    isUp: true,
  },
]

// ── Today's rates table data ─────────────────────────────────────────────────
const todayRates = [
  { crop: 'Tomato (Big)', today: 62, change: '+5.1%', type: 'up', high: 70, low: 55 },
  { crop: 'Cauliflower', today: 44, change: '-2.2%', type: 'down', high: 50, low: 38 },
  { crop: 'Potato (Red)', today: 35, change: '+6.1%', type: 'up', high: 38, low: 30 },
  { crop: 'Onion (Dry)', today: 74, change: '+5.7%', type: 'up', high: 80, low: 58 },
  { crop: 'Cabbage', today: 28, change: '-6.7%', type: 'down', high: 34, low: 25 },
  { crop: 'Green Chili', today: 95, change: '+8.0%', type: 'up', high: 110, low: 75 },
  { crop: 'Carrot', today: 56, change: '0%', type: 'neutral', high: 62, low: 48 },
  { crop: 'Ginger', today: 180, change: '+4.7%', type: 'up', high: 195, low: 150 },
]

const MarketPrice = () => {
  const [selectedCrop, setSelectedCrop] = useState('Tomato')
  const [searchQuery, setSearchQuery] = useState('')
  const [liveRates, setLiveRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [weeklyTrend, setWeeklyTrend] = useState(FALLBACK_TREND)
  const [weeklyLoading, setWeeklyLoading] = useState(true)
  const [weeklyRaw, setWeeklyRaw] = useState([])
  const [weeklySelectedCrop, setWeeklySelectedCrop] = useState('Tomato Big(Nepali)')
  const [weeklyDropdownSearch, setWeeklyDropdownSearch] = useState('')
  const [weeklyDropdownOpen, setWeeklyDropdownOpen] = useState(false)

  // Single consolidated fetch: prices-week?days=2 → today's table with real change vs yesterday
  useEffect(() => {
    fetch('http://127.0.0.1:8000/kalimati/prices-week?lang=en&days=2')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch prices')
        return res.json()
      })
      .then(data => {
        if (data && data.results && data.results.length > 0) {
          // Sort by date ascending so results[0] = older, results[-1] = newest
          const sorted = [...data.results].sort((a, b) => a.date.localeCompare(b.date))
          const todayItems = (sorted[sorted.length - 1]?.items) || []
          const yesterdayItems = (sorted.length >= 2 ? sorted[sorted.length - 2]?.items : []) || []

          // Build a map of yesterday's prices by commodity name for fast lookup
          const yesterdayMap = {}
          yesterdayItems.forEach(item => {
            yesterdayMap[item.commodity] = item.avg_price
          })

          const mappedRates = todayItems.map(item => {
            const todayPrice = item.avg_price
            const yestPrice = yesterdayMap[item.commodity]
            let change = 'N/A'
            let type = 'neutral'
            if (yestPrice && yestPrice !== 0) {
              const pct = ((todayPrice - yestPrice) / yestPrice) * 100
              const sign = pct > 0 ? '+' : ''
              change = `${sign}${pct.toFixed(1)}%`
              type = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral'
            }
            return {
              crop: item.commodity,
              today: todayPrice,
              change,
              type,
              high: item.max_price,
              low: item.min_price,
              unit: item.unit
            }
          })
          setLiveRates(mappedRates)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Fetch 7-day weekly trend for charts
  useEffect(() => {
    fetch('http://127.0.0.1:8000/kalimati/prices-week?lang=en&days=7')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch weekly prices')
        return res.json()
      })
      .then(data => {
        if (data && data.results && data.results.length > 0) {
          const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

          // Store raw per-day items for the dropdown-driven chart
          const rawMapped = data.results.map(dayData => {
            const raw = dayData.date || ''
            const [, m, d] = raw.split('-')
            const label = m && d ? `${monthNames[parseInt(m)]} ${d}` : raw
            return { day: label, items: dayData.items || [] }
          })
          setWeeklyRaw(rawMapped)

          // 4-crop simplified trend for the "All crops compared" line chart
          const mapped = rawMapped.map(dayData => {
            const items = dayData.items || []
            const getPrice = (kw) => {
              const hit = items.find(it => it.commodity && it.commodity.toLowerCase().includes(kw))
              return hit ? hit.avg_price : null
            }
            return {
              day: dayData.day,
              Tomato: getPrice('tomato') || null,
              Cauliflower: getPrice('cauli') || null,
              Potato: getPrice('potato') || null,
              Onion: getPrice('onion') || null,
            }
          }).filter(d => d.Tomato || d.Cauliflower || d.Potato || d.Onion)
          if (mapped.length > 0) setWeeklyTrend(mapped)
        }
        setWeeklyLoading(false)
      })
      .catch(err => {
        console.error('Weekly trend fetch failed:', err)
        setWeeklyLoading(false)
      })
  }, [])

  const cropList = ['Tomato', 'Cauliflower', 'Potato', 'Onion']

  // Derive full crop list from raw weekly data (all unique commodity names)
  const cropDropdownList = weeklyRaw.length > 0
    ? [...new Set(weeklyRaw.flatMap(d => d.items.map(it => it.commodity)))].sort()
    : liveRates.map(r => r.crop)

  // Build chart data for the selected crop from raw weekly data
  const weeklyChartData = weeklyRaw.length > 0
    ? weeklyRaw.map(dayData => {
        const hit = dayData.items.find(it => it.commodity === weeklySelectedCrop)
        return { day: dayData.day, price: hit ? hit.avg_price : null }
      })
    : FALLBACK_TREND.map(d => ({ day: d.day, price: d.Tomato }))

  const filteredDropdownCrops = cropDropdownList.filter(c =>
    c.toLowerCase().includes(weeklyDropdownSearch.toLowerCase())
  )

  const displayRates = liveRates.length > 0 ? liveRates : todayRates

  const filteredRates = displayRates.filter((r) =>
    r.crop.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <main className="mp-page-wrapper">
        {/* Page Header */}
        <div className="mp-header-block">
          <h1 className="mp-title">Market Price</h1>
          <p className="mp-subtitle">
            Compare local market prices and recent broker offers before you trade.
          </p>
        </div>

        {/* Top 4 Stat Cards */}
        <div className="mp-stats-grid">
          {statCards.map((card) => (
            <div className="mp-stat-card" key={card.crop}>
              <div className={`mp-stat-badge ${card.isUp ? 'up' : 'down'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {card.isUp ? (
                    <path d="M23 6l-9.5 9.5-5-5L1 18m22-12h-6m6 0v6" />
                  ) : (
                    <path d="M23 18l-9.5-9.5-5 5L1 6m22 12h-6m6 0v-6" />
                  )}
                </svg>
              </div>
              <div className="mp-stat-content">
                <span className="mp-stat-crop">{card.crop}</span>
                <span className="mp-stat-price">{card.price}</span>
                <span className={`mp-stat-sub ${card.isUp ? 'up' : 'down'}`}>
                  {card.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 7-Day Price Trend Card */}
        <div className="mp-card mp-trend-card">
          <div className="mp-card-header">
            <h2>{weeklyLoading ? 'Loading 7-day trend...' : '7-day price trend (Rs/kg — Kalimati)'}</h2>
            {/* Searchable Dropdown */}
            <div 
              className="mp-crop-dropdown" 
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setWeeklyDropdownOpen(false)
                }
              }}
            >
              <button
                className="mp-dropdown-trigger"
                onClick={() => setWeeklyDropdownOpen(o => !o)}
              >
                <span>{weeklySelectedCrop}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {weeklyDropdownOpen && (
                <div className="mp-dropdown-panel">
                  <div className="mp-dropdown-search-wrap">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      autoFocus
                      placeholder="Search crop..."
                      value={weeklyDropdownSearch}
                      onChange={e => setWeeklyDropdownSearch(e.target.value)}
                      className="mp-dropdown-search-input"
                    />
                  </div>
                  <ul className="mp-dropdown-list-panel">
                    {filteredDropdownCrops.length === 0 && (
                      <li className="mp-dropdown-empty">No results</li>
                    )}
                    {filteredDropdownCrops.map(crop => (
                      <li
                        key={crop}
                        className={`mp-dropdown-item ${weeklySelectedCrop === crop ? 'active' : ''}`}
                        onMouseDown={() => {
                          setWeeklySelectedCrop(crop)
                          setWeeklyDropdownSearch('')
                          setWeeklyDropdownOpen(false)
                        }}
                      >
                        {crop}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mp-chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#43a047" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#43a047" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => val != null ? [`Rs ${val}/kg`, weeklySelectedCrop] : ['No data', weeklySelectedCrop]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#2e7d32"
                  strokeWidth={2.5}
                  fill="url(#greenGradient)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grid of Two Charts: All Crops Compared & District-wise Rate */}
        <div className="mp-two-column-grid">
          {/* Left: All crops compared */}
          <div className="mp-card">
            <div className="mp-card-header">
              <h2>All crops compared</h2>
            </div>
            <div className="mp-chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Tomato" stroke="#00897b" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="Cauliflower" stroke="#2e7d32" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="Potato" stroke="#fb8c00" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="Onion" stroke="#e53935" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: District-wise tomato rate */}
          <div className="mp-card">
            <div className="mp-card-header">
              <h2>District-wise tomato rate (Rs/kg)</h2>
            </div>
            <div className="mp-chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
                  <XAxis dataKey="district" axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                  <YAxis domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(val) => [`Rs ${val}/kg`, 'Rate']} />
                  <Bar dataKey="rate" fill="#4caf50" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Today's Rates Table Card */}
        <div className="mp-card mp-table-card">
          <div className="mp-card-header">
            <h2>Today's rates</h2>
            <div className="mp-search-box">
              <input
                type="text"
                placeholder="Search crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mp-table-responsive">
            <table className="mp-rates-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Today</th>
                  <th>Change</th>
                  <th>High</th>
                  <th>Low</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="mp-no-results">
                      Loading live Kalimati prices...
                    </td>
                  </tr>
                )}
                {error && !loading && (
                  <tr>
                    <td colSpan={5} className="mp-no-results" style={{ color: 'red' }}>
                      {error}. Showing cached estimates.
                    </td>
                  </tr>
                )}
                {!loading && filteredRates.map((row) => (
                  <tr key={row.crop}>
                    <td className="mp-crop-name">{row.crop} {row.unit && <small>({row.unit})</small>}</td>
                    <td>
                      <span className="mp-price-tag">Rs {row.today}</span>
                    </td>
                    <td>
                      <span className={`mp-change-tag ${row.type}`}>
                        {row.type === 'up' && '↗ '}
                        {row.type === 'down' && '↘ '}
                        {row.type === 'neutral' && '— '}
                        {row.change}
                      </span>
                    </td>
                    <td className="mp-high-low">Rs {row.high}</td>
                    <td className="mp-high-low">Rs {row.low}</td>
                  </tr>
                ))}
                {filteredRates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="mp-no-results">
                      No crop found matching "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}

export default MarketPrice