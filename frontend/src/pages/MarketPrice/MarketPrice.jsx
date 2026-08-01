import { useState } from 'react'
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

// ── Monthly price trend data for crops ───────────────────────────────────────
const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

const trendByCrop = {
  Tomato: [48, 51, 49, 54, 57, 62],
  Cauliflower: [42, 40, 41, 45, 47, 44],
  Potato: [28, 29, 31, 32, 33, 35],
  Onion: [62, 65, 64, 69, 72, 74],
}

const trendData = months.map((month, i) => ({
  month,
  Tomato: trendByCrop.Tomato[i],
  Cauliflower: trendByCrop.Cauliflower[i],
  Potato: trendByCrop.Potato[i],
  Onion: trendByCrop.Onion[i],
}))

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

  const cropList = ['Tomato', 'Cauliflower', 'Potato', 'Onion']

  const filteredRates = todayRates.filter((r) =>
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

        {/* 6-Month Price Trend Card */}
        <div className="mp-card mp-trend-card">
          <div className="mp-card-header">
            <h2>6-month price trend (Rs/kg)</h2>
            <div className="mp-crop-tabs">
              {cropList.map((crop) => (
                <button
                  key={crop}
                  className={`mp-tab-btn ${selectedCrop === crop ? 'active' : ''}`}
                  onClick={() => setSelectedCrop(crop)}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>

          <div className="mp-chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#43a047" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#43a047" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                <YAxis domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`Rs ${val}/kg`, selectedCrop]}
                />
                <Area
                  type="monotone"
                  dataKey={selectedCrop}
                  stroke="#2e7d32"
                  strokeWidth={2.5}
                  fill="url(#greenGradient)"
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
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                  <YAxis domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} axisLine={false} tickLine={false} tick={{ fill: '#788c7d', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Tomato" stroke="#00897b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Cauliflower" stroke="#2e7d32" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Potato" stroke="#fb8c00" strokeWidth={2} dot={false} />
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
                {filteredRates.map((row) => (
                  <tr key={row.crop}>
                    <td className="mp-crop-name">{row.crop}</td>
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