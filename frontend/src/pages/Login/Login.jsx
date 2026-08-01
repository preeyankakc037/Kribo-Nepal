import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Navbar from '../../components/common/Navbar'

const farmerCrops = ['🍅 Tomato', '🥔 Potato', '🥬 Cabbage', '🫚 Ginger', '🌶️ Chili']
const brokerCrops = [...farmerCrops, '🌾 Rice / Paddy', '🍏 Fruits']

const Field = ({ label, optional, children }) => <label className="form-field"><span>{label} {optional && <i>(optional)</i>}</span>{children || <input />}</label>
const Select = ({ children }) => <select defaultValue=""><option value="" disabled>Select an option</option>{children}</select>
const CropChoices = ({ crops }) => <div className="crop-list">{crops.map((crop) => <label key={crop}><input type="checkbox" /> <span>{crop}</span></label>)}</div>

const Login = ({ initialRole }) => {
  const { signUp } = useAuth()
  const [role, setRole] = useState(initialRole === 'broker' ? 'broker' : 'farmer')
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const steps = ['Essential information', role === 'farmer' ? 'Farm profile' : 'Trading profile', 'Verification & trust']
  const complete = (event) => { event.preventDefault(); signUp({ name, role }); window.location.hash = '#dashboard' }
  const continueSignup = () => {
    const requiredFields = [...document.querySelectorAll('.form-step [required]')]
    if (requiredFields.every((field) => field.reportValidity())) setStep(step + 1)
  }

  return <><Navbar /><main className="auth-page"><section className="auth-panel">
    <div className="auth-intro"><p className="kicker">JOIN KRIBO NEPAL</p><h1>{role === 'farmer' ? 'Grow better deals.' : 'Source with confidence.'}</h1><p>Create a profile that helps the right people find you. You can complete optional verification whenever you are ready.</p><a href="#home">← Back to home</a></div>
    <form className="signup-form" onSubmit={complete}>
      <div className="role-toggle"><button type="button" className={role === 'farmer' ? 'selected' : ''} onClick={() => { setRole('farmer'); setStep(1) }}>👨‍🌾 I am a Farmer</button><button type="button" className={role === 'broker' ? 'selected' : ''} onClick={() => { setRole('broker'); setStep(1) }}>🧑‍💼 I am a Broker</button></div>
      <div className="stepper">{steps.map((title, index) => <div className={step === index + 1 ? 'current' : step > index + 1 ? 'done' : ''} key={title}><b>{index + 1}</b><span>{title}</span></div>)}</div>
      {step === 1 && <div className="form-step"><h2>Essential information</h2><p>Tell us how people can contact you.</p><div className="form-grid"><Field label={role === 'farmer' ? 'Full name' : 'Full name / business name'}><input required value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Mobile number"><input required type="tel" placeholder="98XXXXXXXX" /></Field><Field label={role === 'farmer' ? 'Address' : 'Business / personal address'}><input required /></Field><Field label="Email ID" optional><input type="email" /></Field><Field label={role === 'farmer' ? 'Farm location' : 'Operating / trading location'}><input required placeholder="Province, district, municipality" /></Field></div></div>}
      {step === 2 && role === 'farmer' && <div className="form-step"><h2>Quick farm profile</h2><p>Help brokers understand your farm and harvest.</p><div className="form-grid"><Field label="Average harvest scale / size"><Select><option>Small Scale (Local / Home Farm)</option><option>Commercial Farm (Tons / Bulk)</option></Select></Field></div><Field label="Primary crops grown"><CropChoices crops={farmerCrops} /></Field></div>}
      {step === 2 && role === 'broker' && <div className="form-step"><h2>Quick business & trading profile</h2><p>Help farmers find a buyer that fits their harvest.</p><div className="form-grid"><Field label="Buying / trading scale"><Select><option>Small Scale (Local Retailer / Neighborhood Vendor)</option><option>Medium Scale (Wholesaler / Regional Trader)</option><option>Large Scale (Commercial Exporter / Processing Industry / Bulk Distributor)</option></Select></Field><Field label="Transport available" optional><Select><option>Pickup Truck</option><option>Large Freight Truck</option><option>None</option></Select></Field><Field label="Warehouse / cold storage access" optional><Select><option>Yes</option><option>No</option></Select></Field></div><Field label="Preferred commodities / crops traded"><CropChoices crops={brokerCrops} /></Field></div>}
      {step === 3 && <div className="form-step"><h2>Verification & trust</h2><p>These optional details make your profile more trusted in the marketplace.</p><div className="form-grid">{role === 'farmer' ? <><Field label="Citizenship card photos" optional><input type="file" accept="image/*" multiple /></Field><Field label="Your photo" optional><input type="file" accept="image/*" /></Field><Field label="Mobile wallet / bank account" optional><input placeholder="eSewa, Khalti, or bank account" /></Field></> : <><Field label="PAN / business registration document" optional><input type="file" accept="image/*,.pdf" /></Field><Field label="Citizenship card photos" optional><input type="file" accept="image/*" multiple /></Field><Field label="User / proprietor photo" optional><input type="file" accept="image/*" /></Field></>}</div><div className="verification-note">✓ {role === 'farmer' ? 'Verification gives you a Verified Local Farmer badge.' : 'Business verification gives you a Verified Commercial Trader badge.'}</div></div>}
      <div className="form-actions">{step > 1 && <button type="button" className="button button-outline" onClick={() => setStep(step - 1)}>Back</button>}{step < 3 ? <button type="button" className="button" onClick={continueSignup}>Continue →</button> : <button className="button" type="submit">Create {role === 'farmer' ? 'farmer' : 'broker'} account →</button>}</div>
    </form>
  </section></main></>
}

export default Login
