import { useState } from 'react'
import Navbar from '../../components/common/Navbar'
import { useAuth } from '../../hooks/useAuth'

const SignIn = () => {
  const { signUp } = useAuth()
  const [role, setRole] = useState('farmer')
  const [name, setName] = useState('')
  const submit = (event) => {
    event.preventDefault()
    signUp({ name: name || (role === 'farmer' ? 'Farmer' : 'Broker'), role })
    window.location.hash = '#dashboard'
  }

  return <><Navbar /><main className="signin-page"><form className="signin-card" onSubmit={submit}>
    <a className="brand" href="#home"><span className="brand-mark">✦</span><span>Kribo Nepal</span></a>
    <p className="kicker">WELCOME BACK</p><h1>Log in to Kribo</h1><p className="signin-copy">Continue to manage your listings, offers, and marketplace activity.</p>
    <label className="form-field"><span>Mobile number or email</span><input required placeholder="98XXXXXXXX or you@email.com" /></label>
    <label className="form-field"><span>Password</span><input required type="password" placeholder="Enter your password" /></label>
    <div className="login-role"><span>Logging in as</span><label><input type="radio" checked={role === 'farmer'} onChange={() => setRole('farmer')} /> Farmer</label><label><input type="radio" checked={role === 'broker'} onChange={() => setRole('broker')} /> Broker / Trader</label></div>
    <label className="form-field"><span>Your name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Used for this frontend demo" /></label>
    <button className="button login-submit" type="submit">Log in →</button>
    <p className="signup-link">New to Kribo? <a href="#signup/farmer">Create a farmer account</a> or <a href="#signup/broker">broker account</a>.</p>
  </form></main></>
}

export default SignIn
