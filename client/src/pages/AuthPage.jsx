import { useState } from 'react'
import { api } from '../lib/api.js'
import { Button, Field, Icon } from '../components/ui/index.jsx'
import Brand from '../components/ui/Brand.jsx'

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', otp: '' })
  const [pendingEmail, setPendingEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  async function submit(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true)
    try {
      if (mode === 'login') {
        await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }) })
        await onLogin()
      } else if (mode === 'register') {
        const result = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: form.name, email: form.email, password: form.password }) })
        setPendingEmail(form.email); setNotice(result.message); setMode('verify')
      } else if (mode === 'verify') {
        const result = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email: pendingEmail || form.email, otp: form.otp }) })
        setNotice(result.message); setMode('login')
      } else if (mode === 'forgot') {
        const result = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: form.email }) })
        setPendingEmail(form.email); setNotice(result.message); setMode('reset')
      } else {
        const result = await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email: pendingEmail || form.email, otp: form.otp, newPassword: form.password }) })
        setNotice(result.message); setMode('login')
      }
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function resendCode() {
    try { const result = await api('/auth/resend-verification-otp', { method: 'POST', body: JSON.stringify({ email: pendingEmail }) }); setNotice(result.message); setError('') }
    catch (requestError) { setError(requestError.message) }
  }

  const title = { login: 'Sign in', register: 'Create your account', verify: 'Verify your email', forgot: 'Reset your password', reset: 'Choose a new password' }[mode]
  const description = { login: 'Access your clinic workspace.', register: 'Create an account to set up your clinic.', verify: `Enter the six digit code sent to ${pendingEmail}.`, forgot: 'We’ll send a reset code if your account exists.', reset: `Enter the reset code sent to ${pendingEmail}.` }[mode]

  return <main className="auth-layout">
    <section className="auth-brand"><Brand/><div className="auth-story"><span className="eyebrow">CLINIC MANAGEMENT</span><h1>Care,<br/>well <em>organized.</em></h1><p>Keep your clinic information, care team, services, and schedules together in one simple workspace.</p><div className="auth-note"><strong>A straightforward place to start</strong><span>Tools for the work behind better care.</span></div></div><div className="auth-foot"><span>Clinic workspace</span><span>© 2026</span></div></section>
    <section className="auth-panel"><div className="auth-form-wrap"><span className="eyebrow">CLINIC WORKSPACE</span><h2>{title}</h2><p className="muted">{description}</p>
      <form className="stack-form" onSubmit={submit}>
        {mode === 'register' && <Field label="Your name" value={form.name} onChange={update('name')} placeholder="Dr. Aanya Mehta" required/>}
        {!['verify', 'reset'].includes(mode) && <Field label="Email address" type="email" autoComplete="email" value={form.email} onChange={update('email')} placeholder="you@clinic.com" required/>}
        {['verify', 'reset'].includes(mode) && <Field label="Verification code" inputMode="numeric" maxLength={6} value={form.otp} onChange={update('otp')} placeholder="000000" required/>}
        {mode === 'reset' && <Field label="Email address" type="email" value={pendingEmail || form.email} onChange={update('email')} required/>}
        {['login', 'register', 'reset'].includes(mode) && <Field label={mode === 'reset' ? 'New password' : 'Password'} type="password" autoComplete={mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'} value={form.password} onChange={update('password')} placeholder="At least 8 characters" minLength={8} required/>}
        {error && <div className="form-alert error-alert">{error}</div>}{notice && <div className="form-alert success-alert">{notice}</div>}
        <Button type="submit" disabled={busy} className="full-button">{busy ? 'Please wait…' : ({ login: 'Sign in', register: 'Create account', verify: 'Verify email', forgot: 'Send reset code', reset: 'Reset password' })[mode]}<Icon name="arrow" size={16}/></Button>
      </form>
      <div className="auth-switch">{mode === 'login' ? <><span>New here? <button onClick={() => { setMode('register'); setError(''); setNotice('') }}>Create an account</button></span><button className="forgot-link" onClick={() => { setMode('forgot'); setError(''); setNotice('') }}>Forgot password?</button></> : mode === 'verify' ? <button onClick={resendCode}>Resend verification code</button> : mode === 'forgot' || mode === 'reset' ? <button onClick={() => setMode('login')}>Back to sign in</button> : <>Already registered? <button onClick={() => setMode('login')}>Sign in</button></>}</div>
    </div></section>
  </main>
}
