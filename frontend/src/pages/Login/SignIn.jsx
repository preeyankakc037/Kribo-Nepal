import { useState } from 'react'
import Navbar from '../../components/common/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { authApi } from '../../services/api'

const SignIn = () => {
  const { signIn } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authApi.login({ identifier, password })
      signIn({ token: data.access_token, user: data.user })
      window.location.hash = '#dashboard'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <section className="auth-panel">
          {/* ── Left Green Panel ── */}
          <div className="auth-intro">
            <p className="kicker">WELCOME BACK</p>
            <h1>Trade with confidence.</h1>
            <p>
              Log in to manage your harvest listings, evaluate broker bolis, and access live Nepali market price trends.
            </p>
            <a href="#home">← Back to home</a>
          </div>

          {/* ── Right Form Panel ── */}
          <form className="signup-form" onSubmit={handleSubmit} noValidate>
            {/* Mode switch toggle */}
            <div className="role-toggle auth-mode-toggle">
              <button type="button" className="selected">
                🔑 Log In
              </button>
              <button type="button" onClick={() => (window.location.hash = '#signup/farmer')}>
                ✨ Create Account
              </button>
            </div>

            <div className="form-step" style={{ marginTop: 24 }}>
              <h2>Log in to your account</h2>
              <p>Enter your registered mobile number or email address.</p>

              <label className="form-field" style={{ marginTop: 20 }}>
                <span>Mobile number or email</span>
                <input
                  required
                  name="identifier"
                  placeholder="98XXXXXXXX or you@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Password</span>
                <input
                  required
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {/* Error notification */}
              {error && <p className="form-error">{error}</p>}

              <div className="form-actions" style={{ marginTop: 24 }}>
                <button className="button" type="submit" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Logging in…' : 'Log in to account →'}
                </button>
              </div>
            </div>

            <p className="signup-link" style={{ marginTop: 24 }}>
              New to Kribo?{' '}
              <a href="#signup/farmer">Sign up as Farmer</a> or{' '}
              <a href="#signup/broker">Sign up as Broker</a>.
            </p>
          </form>
        </section>
      </main>
    </>
  )
}

export default SignIn
