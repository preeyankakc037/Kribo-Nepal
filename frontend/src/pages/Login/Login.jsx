import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Navbar from '../../components/common/Navbar'
import { authApi } from '../../services/api'

/* ── Static data ─────────────────────────────────────────────────────────── */
const farmerCrops = ['🍅 Tomato', '🥔 Potato', '🥬 Cabbage', '🫚 Ginger', '🌶️ Chili']
const brokerCrops = [...farmerCrops, '🌾 Rice / Paddy', '🍏 Fruits']

/* ── Small reusable form pieces ──────────────────────────────────────────── */
const Field = ({ label, optional, children }) => (
  <label className="form-field">
    <span>
      {label} {optional && <i>(optional)</i>}
    </span>
    {children || <input />}
  </label>
)

const Select = ({ name, value, onChange, children }) => (
  <select name={name} value={value} onChange={onChange}>
    <option value="" disabled>Select an option</option>
    {children}
  </select>
)

const CropChoices = ({ crops, selected, onChange }) => (
  <div className="crop-list">
    {crops.map((crop) => (
      <label key={crop}>
        <input
          type="checkbox"
          checked={selected.includes(crop)}
          onChange={() =>
            onChange(
              selected.includes(crop)
                ? selected.filter((c) => c !== crop)
                : [...selected, crop],
            )
          }
        />{' '}
        <span>{crop}</span>
      </label>
    ))}
  </div>
)

/* ── Main signup component ───────────────────────────────────────────────── */
const SignupForm = ({ initialRole }) => {
  const { signUp } = useAuth()

  /* role & step */
  const [role, setRole] = useState(initialRole === 'broker' ? 'broker' : 'farmer')
  const [step, setStep] = useState(1)

  /* Step 1 — Essential information */
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [location, setLocation] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  /* Step 2 — Farmer */
  const [harvestScale, setHarvestScale] = useState('')
  const [farmerCropsSelected, setFarmerCropsSelected] = useState([])

  /* Step 2 — Broker */
  const [tradingScale, setTradingScale] = useState('')
  const [transport, setTransport] = useState('')
  const [coldStorage, setColdStorage] = useState('')
  const [brokerCropsSelected, setBrokerCropsSelected] = useState([])

  /* Step 3 — Verification */
  const [paymentAccount, setPaymentAccount] = useState('')

  /* UI state */
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const steps = [
    'Essential information',
    role === 'farmer' ? 'Farm profile' : 'Trading profile',
    'Verification & trust',
  ]

  /* ── Navigation ── */
  const goNext = () => {
    setError('')
    const requiredFields = [...document.querySelectorAll('.form-step [required]')]
    if (!requiredFields.every((f) => f.reportValidity())) return

    /* Extra client-side password check on step 1 */
    if (step === 1) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }
    setStep(step + 1)
  }

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const body = {
      full_name: name,
      mobile,
      password,
      confirm_password: confirmPassword,
      address,
      email: email || undefined,
      location,
      role,
      farmer_profile:
        role === 'farmer'
          ? {
              harvest_scale: harvestScale,
              crops: farmerCropsSelected,
              payment_account: paymentAccount || undefined,
            }
          : undefined,
      broker_profile:
        role === 'broker'
          ? {
              trading_scale: tradingScale,
              transport,
              cold_storage: coldStorage,
              crops: brokerCropsSelected,
            }
          : undefined,
    }

    try {
      const data = await authApi.register(body)
      signUp({ token: data.access_token, user: data.user })
      window.location.hash = '#dashboard'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Role switch helper ── */
  const switchRole = (newRole) => {
    setRole(newRole)
    setStep(1)
    setError('')
  }

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <section className="auth-panel">

          {/* ── Left panel ── */}
          <div className="auth-intro">
            <p className="kicker">JOIN KRIBO NEPAL</p>
            <h1>{role === 'farmer' ? 'Grow better deals.' : 'Source with confidence.'}</h1>
            <p>
              Create a profile that helps the right people find you. You can complete optional
              verification whenever you are ready.
            </p>
            <a href="#home">← Back to home</a>
          </div>

          {/* ── Right panel — the form ── */}
          <form className="signup-form" onSubmit={handleSubmit} noValidate>

            {/* Role toggle */}
            <div className="role-toggle">
              <button
                type="button"
                className={role === 'farmer' ? 'selected' : ''}
                onClick={() => switchRole('farmer')}
              >
                👨‍🌾 I am a Farmer
              </button>
              <button
                type="button"
                className={role === 'broker' ? 'selected' : ''}
                onClick={() => switchRole('broker')}
              >
                🧑‍💼 I am a Broker
              </button>
            </div>

            {/* Step indicator */}
            <div className="stepper">
              {steps.map((title, index) => (
                <div
                  key={title}
                  className={
                    step === index + 1 ? 'current' : step > index + 1 ? 'done' : ''
                  }
                >
                  <b>{index + 1}</b>
                  <span>{title}</span>
                </div>
              ))}
            </div>

            {/* ── Step 1: Essential information ── */}
            {step === 1 && (
              <div className="form-step">
                <h2>Essential information</h2>
                <p>Tell us how people can contact you.</p>
                <div className="form-grid">
                  <Field label={role === 'farmer' ? 'Full name' : 'Full name / business name'}>
                    <input
                      required
                      name="name"
                      value={name}
                      placeholder="e.g. Ram Bahadur Thapa"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                  <Field label="Mobile number">
                    <input
                      required
                      name="mobile"
                      type="tel"
                      placeholder="98XXXXXXXX"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </Field>
                  <Field label={role === 'farmer' ? 'Address' : 'Business / personal address'}>
                    <input
                      required
                      name="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </Field>
                  <Field label="Email ID" optional>
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field label={role === 'farmer' ? 'Farm location' : 'Operating / trading location'}>
                    <input
                      required
                      name="location"
                      placeholder="Province, district, municipality"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </Field>
                </div>

                {/* Password row */}
                <div className="form-grid">
                  <Field label="Password">
                    <input
                      required
                      name="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  <Field label="Confirm password">
                    <input
                      required
                      name="confirm_password"
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 2: Farm profile (farmer) ── */}
            {step === 2 && role === 'farmer' && (
              <div className="form-step">
                <h2>Quick farm profile</h2>
                <p>Help brokers understand your farm and harvest.</p>
                <div className="form-grid">
                  <Field label="Average harvest scale / size">
                    <Select
                      name="harvestScale"
                      value={harvestScale}
                      onChange={(e) => setHarvestScale(e.target.value)}
                    >
                      <option>Small Scale (Local / Home Farm)</option>
                      <option>Commercial Farm (Tons / Bulk)</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Primary crops grown">
                  <CropChoices
                    crops={farmerCrops}
                    selected={farmerCropsSelected}
                    onChange={setFarmerCropsSelected}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 2: Trading profile (broker) ── */}
            {step === 2 && role === 'broker' && (
              <div className="form-step">
                <h2>Quick business & trading profile</h2>
                <p>Help farmers find a buyer that fits their harvest.</p>
                <div className="form-grid">
                  <Field label="Buying / trading scale">
                    <Select
                      name="tradingScale"
                      value={tradingScale}
                      onChange={(e) => setTradingScale(e.target.value)}
                    >
                      <option>Small Scale (Local Retailer / Neighborhood Vendor)</option>
                      <option>Medium Scale (Wholesaler / Regional Trader)</option>
                      <option>Large Scale (Commercial Exporter / Processing Industry / Bulk Distributor)</option>
                    </Select>
                  </Field>
                  <Field label="Transport available" optional>
                    <Select
                      name="transport"
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                    >
                      <option>Pickup Truck</option>
                      <option>Large Freight Truck</option>
                      <option>None</option>
                    </Select>
                  </Field>
                  <Field label="Warehouse / cold storage access" optional>
                    <Select
                      name="coldStorage"
                      value={coldStorage}
                      onChange={(e) => setColdStorage(e.target.value)}
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Preferred commodities / crops traded">
                  <CropChoices
                    crops={brokerCrops}
                    selected={brokerCropsSelected}
                    onChange={setBrokerCropsSelected}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 3: Verification ── */}
            {step === 3 && (
              <div className="form-step">
                <h2>Verification & trust</h2>
                <p>These optional details make your profile more trusted in the marketplace.</p>
                <div className="form-grid">
                  {role === 'farmer' ? (
                    <>
                      <Field label="Citizenship card photos" optional>
                        <input type="file" accept="image/*" multiple />
                      </Field>
                      <Field label="Your photo" optional>
                        <input type="file" accept="image/*" />
                      </Field>
                      <Field label="Mobile wallet / bank account" optional>
                        <input
                          placeholder="eSewa, Khalti, or bank account"
                          value={paymentAccount}
                          onChange={(e) => setPaymentAccount(e.target.value)}
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="PAN / business registration document" optional>
                        <input type="file" accept="image/*,.pdf" />
                      </Field>
                      <Field label="Citizenship card photos" optional>
                        <input type="file" accept="image/*" multiple />
                      </Field>
                      <Field label="User / proprietor photo" optional>
                        <input type="file" accept="image/*" />
                      </Field>
                    </>
                  )}
                </div>
                <div className="verification-note">
                  ✓{' '}
                  {role === 'farmer'
                    ? 'Verification gives you a Verified Local Farmer badge.'
                    : 'Business verification gives you a Verified Commercial Trader badge.'}
                </div>
              </div>
            )}

            {/* Error message */}
            {error && <p className="form-error">{error}</p>}

            {/* Action buttons */}
            <div className="form-actions">
              {step > 1 && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => { setStep(step - 1); setError('') }}
                  disabled={loading}
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button type="button" className="button" onClick={goNext}>
                  Continue →
                </button>
              ) : (
                <button className="button" type="submit" disabled={loading}>
                  {loading
                    ? 'Creating account…'
                    : `Create ${role === 'farmer' ? 'farmer' : 'broker'} account →`}
                </button>
              )}
            </div>

            <p className="signup-link">
              Already have an account? <a href="#login">Log in here</a>.
            </p>
          </form>
        </section>
      </main>
    </>
  )
}

export default SignupForm
