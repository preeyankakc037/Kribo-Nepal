import { useState } from 'react'
import Navbar from '../../components/common/Navbar'
import { useAuth } from '../../hooks/useAuth'

const farmerSteps = ['Product', 'Pricing', 'Harvest', 'Details', 'Location']
const brokerSteps = ['Product need', 'Budget', 'Location']

const Field = ({ label, optional, children }) => (
  <label className="form-field">
    <span>{label} {optional && <i>(optional)</i>}</span>
    {children || <input />}
  </label>
)

const Select = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange}>
    <option value="" disabled>Select an option</option>
    {children}
  </select>
)

const FarmerForm = ({ user }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form State
  const [productName, setProductName] = useState('')
  const [variety, setVariety] = useState('')
  const [quantity, setQuantity] = useState('500')
  const [unit, setUnit] = useState('KG')
  const [price, setPrice] = useState('65')
  const [priceType, setPriceType] = useState('shown')
  const [harvestDate, setHarvestDate] = useState('2026-08-05')
  const [availability, setAvailability] = useState('Available')
  const [organic, setOrganic] = useState(true)
  const [district, setDistrict] = useState('Chitwan')
  const [municipality, setMunicipality] = useState('')
  const [description, setDescription] = useState('Fresh crops harvested with care. Looking for immediate wholesale buyers.')

  const next = () => setStep((v) => Math.min(v + 1, farmerSteps.length))
  const prev = () => setStep((v) => Math.max(v - 1, 1))

  const publish = async () => {
    setLoading(true)
    const payload = {
      user_role: 'farmer',
      full_name: user?.full_name || user?.name || 'Local Farmer',
      product_name: productName || 'Fresh Vegetables',
      variety: variety || 'Standard',
      quantity: Number(quantity) || 100,
      unit: unit || 'KG',
      price: priceType === 'shown' ? Number(price) : null,
      price_discussion: priceType === 'discussion',
      harvest_date: harvestDate || null,
      availability: availability,
      organic: Boolean(organic),
      district: district || 'Nepal',
      municipality: municipality || '',
      delivery_method: 'Farmer Delivery',
      description: description,
      image: null
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create post')
      window.location.hash = '#marketplace'
    } catch (err) {
      console.error('API error publishing post:', err)
      window.location.hash = '#marketplace'
    } finally {
      setLoading(false)
    }
  }

  return (
    <PostFrame
      title="Create a harvest listing"
      subtitle="Share the details buyers need to make you their best offer."
      steps={farmerSteps}
      step={step}
    >
      {step === 1 && (
        <section className="post-form-step">
          <h2>Product information</h2>
          <div className="form-grid">
            <Field label="Product name *">
              <input
                required
                placeholder="e.g. Tomato"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </Field>
            <Field label="Variety">
              <input
                placeholder="e.g. Hybrid Tomato"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
              />
            </Field>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="post-form-step">
          <h2>Quantity & pricing</h2>
          <div className="form-grid">
            <Field label="Quantity">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label="Unit">
              <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="KG">KG</option>
                <option value="Ton">Ton</option>
                <option value="Sack">Sack</option>
              </Select>
            </Field>
          </div>
          <div className="price-choice">
            <label>
              <input
                type="radio"
                checked={priceType === 'shown'}
                onChange={() => setPriceType('shown')}
              />{' '}
              Show price
            </label>
            <label>
              <input
                type="radio"
                checked={priceType === 'discussion'}
                onChange={() => setPriceType('discussion')}
              />{' '}
              Price on discussion
            </label>
          </div>
          {priceType === 'shown' && (
            <Field label="Your price">
              <div className="price-input">
                <span>Rs.</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <b>/ {unit}</b>
              </div>
            </Field>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="post-form-step">
          <h2>Harvest & Availability</h2>
          <div className="form-grid">
            <Field label="Harvest date">
              <input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
              />
            </Field>
            <Field label="Availability">
              <Select value={availability} onChange={(e) => setAvailability(e.target.value)}>
                <option value="Available">🟢 Available</option>
                <option value="Limited Stock">🟡 Limited Stock</option>
              </Select>
            </Field>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="post-form-step">
          <h2>Details & Description</h2>
          <Field label="Organic status">
            <div className="choice-row">
              <label>
                <input
                  type="radio"
                  name="organic"
                  checked={organic}
                  onChange={() => setOrganic(true)}
                />{' '}
                Organic
              </label>
              <label>
                <input
                  type="radio"
                  name="organic"
                  checked={!organic}
                  onChange={() => setOrganic(false)}
                />{' '}
                Conventional
              </label>
            </div>
          </Field>
          <Field label="Description">
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </section>
      )}

      {step === 5 && (
        <section className="post-form-step">
          <h2>Location</h2>
          <div className="form-grid">
            <Field label="District">
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Chitwan"
              />
            </Field>
            <Field label="Municipality" optional>
              <input
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                placeholder="e.g. Bharatpur"
              />
            </Field>
          </div>
        </section>
      )}

      <PostActions
        step={step}
        total={farmerSteps.length}
        prev={prev}
        next={next}
        publish={publish}
        publishText={loading ? 'Publishing...' : 'Publish listing'}
      />
    </PostFrame>
  )
}

const BrokerForm = ({ user }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('2000')
  const [price, setPrice] = useState('50')
  const [district, setDistrict] = useState('Kathmandu')
  const [description, setDescription] = useState('Looking for reliable farmers for wholesale procurement.')

  const next = () => setStep((v) => Math.min(v + 1, brokerSteps.length))
  const prev = () => setStep((v) => Math.max(v - 1, 1))

  const publish = async () => {
    setLoading(true)
    const payload = {
      user_role: 'broker',
      full_name: user?.full_name || user?.name || 'Commercial Broker',
      product_name: productName || 'Looking for Produce',
      variety: 'Wholesale Grade',
      quantity: Number(quantity) || 1000,
      unit: 'KG',
      price: Number(price) || 0,
      price_discussion: false,
      harvest_date: null,
      availability: 'Immediate',
      organic: false,
      district: district || 'Kathmandu',
      municipality: '',
      delivery_method: 'Pickup',
      description: description,
      image: null
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create requirement')
      window.location.hash = '#marketplace'
    } catch (err) {
      console.error('API error creating post:', err)
      window.location.hash = '#marketplace'
    } finally {
      setLoading(false)
    }
  }

  return (
    <PostFrame
      title="Create a buying requirement"
      subtitle="Tell farmers exactly what you need and when you need it."
      steps={brokerSteps}
      step={step}
    >
      {step === 1 && (
        <section className="post-form-step">
          <h2>What do you need?</h2>
          <div className="form-grid">
            <Field label="Product needed">
              <input
                placeholder="e.g. Potato"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </Field>
            <Field label="Quantity needed (KG)">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </section>
      )}

      {step === 2 && (
        <section className="post-form-step">
          <h2>Budget</h2>
          <Field label="Maximum budget (per KG)">
            <div className="price-input">
              <span>Rs.</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <b>/ KG</b>
            </div>
          </Field>
        </section>
      )}

      {step === 3 && (
        <section className="post-form-step">
          <h2>Preferred location</h2>
          <Field label="District">
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Kathmandu"
            />
          </Field>
        </section>
      )}

      <PostActions
        step={step}
        total={brokerSteps.length}
        prev={prev}
        next={next}
        publish={publish}
        publishText={loading ? 'Publishing...' : 'Publish requirement'}
      />
    </PostFrame>
  )
}

const PostFrame = ({ title, subtitle, steps, step, children }) => (
  <>
    <Navbar />
    <main className="create-post-page">
      <div className="create-post-heading">
        <a href="#marketplace">← Marketplace</a>
        <p className="kicker">CREATE POST</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="create-layout">
        <aside className="post-step-list">
          {steps.map((item, index) => (
            <div className={step === index + 1 ? 'current' : step > index + 1 ? 'done' : ''} key={item}>
              <b>{step > index + 1 ? '✓' : index + 1}</b>
              <span>{item}</span>
            </div>
          ))}
        </aside>
        <div className="post-form-card">{children}</div>
      </div>
    </main>
  </>
)

const PostActions = ({ step, total, prev, next, publish, publishText }) => (
  <div className="post-form-actions">
    {step > 1 && (
      <button className="button button-outline" type="button" onClick={prev}>
        Previous
      </button>
    )}
    {step < total ? (
      <button className="button" type="button" onClick={next}>
        Next →
      </button>
    ) : (
      <button className="button" type="button" onClick={publish}>
        {publishText} →
      </button>
    )}
  </div>
)

const CreatePost = () => {
  const { user } = useAuth()
  if (!user) {
    return (
      <>
        <Navbar />
        <main className="workspace">
          <p className="kicker">SIGN IN REQUIRED</p>
          <h1>Ready to create a post?</h1>
          <p>Log in or create an account first, then you can publish harvest listings or buying requirements.</p>
          <a className="button" href="#login">Go to login</a>
        </main>
      </>
    )
  }
  return user.role === 'broker' ? <BrokerForm user={user} /> : <FarmerForm user={user} />
}

export default CreatePost
