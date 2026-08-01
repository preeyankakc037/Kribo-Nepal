import Footer from '../../components/common/Footer'
import Navbar from '../../components/common/Navbar'
import heroImage from '../../assets/images/home_page.png'

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

const Home = () => (
  <div id="home">
    <Navbar />
    <main>
      <section className="hero-section" id="get-started">
        <div className="hero-copy">
          <p className="eyebrow">✦ A transparent farm marketplace for Nepal</p>
          <h1>Sidha Deal.<br /><em>Sahi Daam.</em></h1>
          <p className="hero-text">List your harvest, let verified brokers place their best <strong>boli</strong>, and choose the price yourself. Zero hidden margins.</p>
          <div className="hero-actions">
            <a className="button" id="farmer" href="#login/farmer">Join as Farmer <span>→</span></a>
            <a className="button button-outline" id="broker" href="#login/broker">Join as Broker</a>
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

      <section className="cta-section" id="login"><p className="kicker">READY WHEN YOU ARE</p><h2>Your harvest deserves a fair price.</h2><p>Join Kribo Nepal to list your produce or find the crops your business needs.</p><div className="hero-actions"><a className="button button-light" href="#login/farmer">Create farmer account</a><a className="button button-ghost" href="#login/broker">Create broker account</a></div></section>
    </main>
    <Footer />
  </div>
)

export default Home
