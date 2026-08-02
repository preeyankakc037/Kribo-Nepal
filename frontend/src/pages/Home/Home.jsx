import { useEffect } from 'react'
import Footer from '../../components/common/Footer'
import Navbar from '../../components/common/Navbar'
import heroImage from '../../assets/images/home_page.png'

const logLayout = (runId = 'pre-fix') => {
  const sections = [
    { name: 'benefits', heading: document.querySelector('.benefits-section .section-heading'), grid: document.querySelector('.benefits-section .feature-grid') },
    { name: 'how', heading: document.querySelector('.how-section .section-heading'), grid: document.querySelector('.how-section .steps-grid') },
  ]
  const brand = document.querySelector('.brand')
  const payload = { runId, viewportWidth: window.innerWidth, sections: [], brandLeft: brand?.getBoundingClientRect().left ?? null }

  sections.forEach(({ name, heading, grid }) => {
    if (!heading || !grid) return
    const hStyle = getComputedStyle(heading)
    const kicker = heading.querySelector('.kicker')
    const kStyle = kicker ? getComputedStyle(kicker) : null
    const hRect = heading.getBoundingClientRect()
    const gRect = grid.getBoundingClientRect()
    payload.sections.push({
      name,
      headingLeft: Math.round(hRect.left),
      gridLeft: Math.round(gRect.left),
      leftDelta: Math.round(hRect.left - gRect.left),
      headingWidth: Math.round(hRect.width),
      gridWidth: Math.round(gRect.width),
      headingMarginLeft: hStyle.marginLeft,
      headingMarginRight: hStyle.marginRight,
      headingMaxWidth: hStyle.maxWidth,
      kickerLetterSpacing: kStyle?.letterSpacing ?? null,
    })
  })

  // #region agent log
  fetch('http://127.0.0.1:7889/ingest/44cb9ee7-2640-4066-9727-67d65045c84a', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e322b' }, body: JSON.stringify({ sessionId: '3e322b', runId, hypothesisId: 'A-E', location: 'Home.jsx:logLayout', message: 'home section alignment metrics', data: payload, timestamp: Date.now() }) }).catch(() => {})
  // #endregion
}

const features = [
  ['✓', 'Verified people, real trade', 'Farmers and brokers can build trust with optional identity and business verification.'],
  ['⚖', 'You choose the best deal', 'List one harvest and compare offers from interested brokers before you decide.'],
  ['↗', 'Clear market signals', 'Use local market prices and live offers to negotiate with confidence.'],
  ['⌖', 'Find trade near you', 'Discover buyers and harvests by crop, district, municipality, and distance.'],
  ['◌', 'Direct updates', 'Get notified when a broker responds, bids, or saves your listing.'],
  ['◉', 'Built for Nepal', 'Designed around local crops, farming communities, and Nepali trading needs.'],
]

const steps = [
  ['01', 'List your harvest', 'Add your crop, quantity, expected price, harvest date, and farm location.'],
  ['02', 'Receive broker bolis', 'Verified brokers send their best offers directly against your listing.'],
  ['03', 'Choose your price', 'Compare bids and choose the offer that works best for you.'],
]

const Home = () => {
  useEffect(() => {
    const measure = () => logLayout('pre-fix')
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
  <div id="home">
    <Navbar />
    <main>
      <section className="hero-section" id="get-started">
        <div className="hero-copy">
          <p className="eyebrow">✦ A transparent farm marketplace for Nepal</p>
          <h1>Sidha Deal.<br /><em>Sahi Daam.</em></h1>
          <p className="hero-text">List your harvest, let verified brokers place their best <strong>boli</strong>, and choose the price yourself. Zero hidden margins.</p>
          <div className="hero-actions">
            <a className="button" id="farmer" href="#signup/farmer">Join as Farmer <span>→</span></a>
            <a className="button button-outline" id="broker" href="#signup/broker">Join as Broker</a>
          </div>
          <dl className="stats">
            <div><dt>Direct</dt><dd>farmer-to-buyer deals</dd></div>
            <div><dt>Best boli</dt><dd>from verified brokers</dd></div>
            <div><dt>Zero</dt><dd>hidden margins</dd></div>
          </dl>
        </div>
        <div className="hero-image-wrap">
          <img src={heroImage} alt="Farmer harvesting vegetables in Nepal" className="hero-image" />
          <div className="image-tag"><span>✓</span><div><b>Verified farmer</b><small>Fresh harvest · Nepal</small></div></div>
        </div>
      </section>

      <section className="benefits-section" id="marketplace">
        <div className="section-heading"><p className="kicker">THE KRIBO ADVANTAGE</p><h2>Fair trade starts with better choices.</h2><p>Everything you need to list, discover, and negotiate agricultural deals with confidence.</p></div>
        <div className="feature-grid">{features.map(([icon, title, text]) => <article className="feature-card" key={title}><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="how-section">
        <div className="section-heading"><p className="kicker">SIMPLE BY DESIGN</p><h2>How Kribo works</h2><p>No confusing middle layers. Just a simple path to a better deal.</p></div>
        <div className="steps-grid">{steps.map(([number, title, text]) => <article className="step-card" key={number}><span className="step-number">{number}</span><span className="step-icon">{number === '01' ? '▤' : number === '02' ? '⌕' : '↔'}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="price-section" id="market-price"><div><p className="kicker">MARKET PRICE</p><h2>Make every harvest count.</h2><p>Check market prices, compare bids, and make a decision with the numbers in front of you.</p></div><a className="button button-light" href="#market-price">Explore market prices →</a></section>

      <section className="cta-section" id="login"><p className="kicker">READY WHEN YOU ARE</p><h2>Your harvest deserves a fair price.</h2><p>Join Kribo Nepal to list your produce or find the crops your business needs.</p><div className="hero-actions"><a className="button button-light" href="#signup/farmer">Create farmer account</a><a className="button button-ghost" href="#signup/broker">Create broker account</a></div></section>
    </main>
    <Footer />
  </div>
  )
}

export default Home
