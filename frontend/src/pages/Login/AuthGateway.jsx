import Navbar from '../../components/common/Navbar'

/**
 * AuthGateway — shown when the user clicks "Login" in the Navbar.
 * Lets the visitor choose between:
 *   • Sign in to an existing account
 *   • Sign up as a Farmer
 *   • Sign up as a Broker
 *
 * All routing is hash-based so no React-Router dependency is needed.
 */
const AuthGateway = () => (
  <>
    <Navbar />
    <main className="gateway-page">
      <div className="gateway-card">
        {/* Header */}
        <a className="brand" href="#home">
          <span className="brand-mark">✦</span>
          <span>Kribo Nepal</span>
        </a>

        <p className="kicker" style={{ marginTop: 32 }}>GET STARTED</p>
        <h1 className="gateway-title">Welcome to Kribo</h1>
        <p className="gateway-sub">
          Connect farmers and brokers for transparent, fair agricultural trade across Nepal.
        </p>

        {/* Existing-user sign-in */}
        <a className="button gateway-btn" href="#login/signin" id="gateway-signin">
          <span className="gateway-btn-icon">🔑</span>
          <span className="gateway-btn-text">
            <strong>Log in</strong>
            <small>I already have an account</small>
          </span>
          <span className="gateway-arrow">→</span>
        </a>

        <div className="gateway-divider"><span>or create a new account</span></div>

        {/* Farmer signup */}
        <a className="gateway-role-card" href="#signup/farmer" id="gateway-farmer">
          <span className="gateway-role-icon">👨‍🌾</span>
          <span className="gateway-role-text">
            <strong>Join as a Farmer</strong>
            <small>List your harvests and get the best boli from verified buyers</small>
          </span>
          <span className="gateway-arrow">→</span>
        </a>

        {/* Broker signup */}
        <a className="gateway-role-card" href="#signup/broker" id="gateway-broker">
          <span className="gateway-role-icon">🧑‍💼</span>
          <span className="gateway-role-text">
            <strong>Join as a Broker / Trader</strong>
            <small>Source fresh produce directly from verified farmers near you</small>
          </span>
          <span className="gateway-arrow">→</span>
        </a>

        <p className="gateway-back">
          <a href="#home">← Back to home</a>
        </p>
      </div>
    </main>
  </>
)

export default AuthGateway
