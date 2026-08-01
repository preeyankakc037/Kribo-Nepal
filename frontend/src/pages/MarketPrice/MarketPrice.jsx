import { useState } from 'react'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../../components/common/Navbar'

const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

const trendByCrop = {
  Tomato: [48, 50, 49, 54, 58, 62],
  Cauliflower: [40, 38, 41, 43, 45, 44],
  Potato: [28, 29, 30, 31, 33, 35],
  Onion: [60, 62, 65, 68, 71, 74],
}

const trendData = months.map((month, i) => ({
  month,
  Tomato: trendByCrop.Tomato[i],
  Cauliflower: trendByCrop.Cauliflower[i],
  Potato: trendByCrop.Potato[i],
  Onion: trendByCrop.Onion[i],
}))

const districtData = [
  { district: 'Kathmandu', rate: 68 },
  { district: 'Chitwan', rate: 58 },
  { district: 'Pokhara', rate: 65 },
  { district: 'Dhading', rate: 52 },
  { district: 'Jhapa', rate: 48 },
  { district: 'Banke', rate: 55 },
]

const barColors = ['#81c784', '#4db6ac', '#ffb74d', '#b39ddb', '#f48fb1', '#aed581']

const statCards = [
  { crop: 'Tomato (Big)', icon: '📈', price: 62, change: 5.1, trend: 'up' },
  { crop: 'Cauliflower', icon: '📉', price: 44, change: -2.2, trend: 'down' },
  { crop: 'Onion (Dry)', icon: '📈', price: 74, change: 5.7, trend: 'up' },
  { crop: 'Potato (Red)', icon: '📈', price: 35, change: 6.1, trend: 'up' },
]

const todayRates = [
  { crop: 'Tomato (Big)', today: 62, change: 5.1, high: 70, low: 55 },
  { crop: 'Cauliflower', today: 44, change: -2.2, high: 50, low: 38 },
  { crop: 'Potato (Red)', today: 35, change: 6.1, high: 38, low: 30 },
  { crop: 'Onion (Dry)', today: 74, change: 5.7, high: 80, low: 58 },
  { crop: 'Cabbage', today: 28, change: -6.7, high: 34, low: 25 },
  { crop: 'Green Chilli', today: 95, change: 8.0, high: 110, low: 75 },
  { crop: 'Carrot', today: 56, change: 0, high: 62, low: 48 },
  { crop: 'Ginger', today: 180, change: 4.7, high: 195, low: 150 },
]

const cropColors = {
  Tomato: '#2f8f4e',
  Cauliflower: '#1f8a8a',
  Potato: '#e0a428',
  Onion: '#8a5cf5',
}

const MarketPrice = () => {
  const [activeCrop, setActiveCrop] = useState('Potato')
  const [query, setQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownQuery, setDropdownQuery] = useState('')
  const cropsList = ['Tomato', 'Cauliflower', 'Potato', 'Onion']
  const filteredDropdownCrops = cropsList.filter(c => c.toLowerCase().includes(dropdownQuery.toLowerCase()))

  const filteredRates = todayRates.filter((row) => row.crop.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <Navbar />
      <main className="mp-page">
        {/* Title */}
        <div className="mp-header">
          <h1>Market Price</h1>
          <p>Compare local market prices and recent broker offers before you trade.</p>
        </div>

        {/* Stat cards */}
        <section className="mp-stats">
          {statCards.map((card) => (
            <div key={card.crop} className="mp-stat-card">
              <div className={`mp-stat-icon ${card.trend}`}>
                {card.icon}
              </div>
              <div className="mp-stat-info">
                <p>{card.crop}</p>
                <p>Rs {card.price}/kg</p>
                <p className={card.trend}>
                  {card.change > 0 ? '+' : ''}
                  {card.change}% vs yesterday
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Trend chart */}
        <section className="mp-section">
          <div className="mp-section-header">
            <h2>6-month price trend (Rs/kg)</h2>
            <div className="mp-dropdown-container">
              <input
                className="mp-dropdown-input"
                value={isDropdownOpen ? dropdownQuery : activeCrop}
                onChange={(e) => { setDropdownQuery(e.target.value); setIsDropdownOpen(true); }}
                onFocus={() => { setIsDropdownOpen(true); setDropdownQuery(''); }}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                placeholder="Search crop..."
              />
              <span className="mp-dropdown-arrow">▼</span>
              {isDropdownOpen && (
                <ul className="mp-dropdown-list">
                  {filteredDropdownCrops.map(crop => (
                    <li
                      key={crop}
                      onMouseDown={() => { setActiveCrop(crop); setIsDropdownOpen(false); setDropdownQuery(''); }}
                      className={activeCrop === crop ? 'active' : ''}
                    >
                      {crop}
                    </li>
                  ))}
                  {filteredDropdownCrops.length === 0 && <li className="empty">No crops found</li>}
                </ul>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cropColors[activeCrop]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={cropColors[activeCrop]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={activeCrop}
                stroke={cropColors[activeCrop]}
                strokeWidth={2}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {/* Two charts row */}
        <section className="mp-grid-2">
          <div className="mp-section" style={{ marginBottom: 0 }}>
            <div className="mp-section-header">
              <h2>All crops compared</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="Tomato" stroke={cropColors.Tomato} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Cauliflower" stroke={cropColors.Cauliflower} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Potato" stroke={cropColors.Potato} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mp-section" style={{ marginBottom: 0 }}>
            <div className="mp-section-header">
              <h2>District-wise tomato rate (Rs/kg)</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="district" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {districtData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Table */}
        <section className="mp-section">
          <div className="mp-section-header">
            <h2>Today's rates</h2>
            <label className="mp-search">
              <span>⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search crop..."
              />
            </label>
          </div>

          <div className="mp-table-wrapper">
            <table className="mp-table">
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
                    <td style={{ fontWeight: 600 }}>{row.crop}</td>
                    <td>
                      <span className="mp-price-badge">
                        Rs {row.today}
                      </span>
                    </td>
                    <td
                      className={`mp-change ${
                        row.change > 0 ? 'up' : row.change < 0 ? 'down' : 'neutral'
                      }`}
                    >
                      {row.change > 0 ? '↗ +' : row.change < 0 ? '↘ ' : '— '}
                      {row.change !== 0 ? `${row.change}%` : '0%'}
                    </td>
                    <td style={{ color: 'var(--muted)' }}>Rs {row.high}</td>
                    <td style={{ color: 'var(--muted)' }}>Rs {row.low}</td>
                  </tr>
                ))}
                {filteredRates.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
                      No crops match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )
}

export default MarketPrice