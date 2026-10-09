import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || ''
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const initials = (value = '') => value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'C'
const dateToday = () => new Date().toISOString().slice(0, 10)

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}/api${path}`, {
    credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    ...options,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`)
  return payload
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    clinic: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 9h.01M15 9h.01M12 9h.01"/></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6"/></>,
    services: <><path d="M20 7h-9M14 17H5M17 3l4 4-4 4M7 13l-4 4 4 4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.spark}</svg>
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

function Field({ label, hint, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} />{hint && <small>{hint}</small>}</label>
}

function AuthScreen({ onLogin }) {
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
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <main className="auth-layout">
    <section className="auth-brand"><div className="brand-lockup"><span className="brand-mark"><Icon name="clinic" size={20}/></span><span>care<span className="brand-dot">loop</span></span></div>
      <div className="auth-story"><span className="eyebrow light">THE CLINIC OPERATING SPACE</span><h1>Care for people.<br/><em>Room to grow.</em></h1><p>A calmer way to bring your clinic online, organize your team, and make every visit feel considered.</p>
        <div className="story-card"><div className="story-avatars"><i>AM</i><i>RS</i><i>+</i></div><div><strong>Made for modern care</strong><small>Your clinic, all in one place</small></div><span className="story-check"><Icon name="check" size={15}/></span></div>
      </div><div className="auth-foot"><span>Thoughtful tools for better care</span><span>© 2025 Careloop</span></div>
    </section>
    <section className="auth-panel"><div className="auth-form-wrap"><span className="eyebrow">WELCOME TO CARELOOP</span><h2>{mode === 'register' ? 'Create your account' : mode === 'verify' ? 'Verify your email' : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Choose a new password' : 'Welcome back'}</h2><p className="muted">{mode === 'register' ? 'Start building a better clinic experience.' : mode === 'verify' ? `Enter the 6-digit code sent to ${pendingEmail}.` : mode === 'forgot' ? 'We’ll send a reset code if your account exists.' : mode === 'reset' ? `Enter the reset code sent to ${pendingEmail}.` : 'Sign in to continue to your workspace.'}</p>
      <form className="stack-form" onSubmit={submit}>
        {mode === 'register' && <Field label="Your name" value={form.name} onChange={update('name')} placeholder="Dr. Aanya Mehta" required/>}
        {!['verify', 'reset'].includes(mode) && <Field label="Email address" type="email" autoComplete="email" value={form.email} onChange={update('email')} placeholder="you@clinic.com" required/>}
        {['verify', 'reset'].includes(mode) && <Field label="Verification code" inputMode="numeric" maxLength={6} value={form.otp} onChange={update('otp')} placeholder="000000" required/>}
        {['login', 'register', 'reset'].includes(mode) && <Field label={mode === 'reset' ? 'New password' : 'Password'} type="password" autoComplete={mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'} value={form.password} onChange={update('password')} placeholder="At least 8 characters" minLength={8} required/>}
        {mode === 'reset' && <Field label="Email address" type="email" value={pendingEmail || form.email} onChange={update('email')} required/>}
        {error && <div className="form-alert error-alert">{error}</div>}{notice && <div className="form-alert success-alert">{notice}</div>}
        <Button type="submit" disabled={busy} className="full-button">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'verify' ? 'Verify email' : mode === 'forgot' ? 'Send reset code' : 'Reset password'} <Icon name="arrow" size={16}/></Button>
      </form>
      <div className="auth-switch">{mode === 'login' ? <><span>New to Careloop? <button onClick={() => { setMode('register'); setError(''); setNotice('') }}>Create an account</button></span><button className="forgot-link" onClick={() => { setMode('forgot'); setError(''); setNotice('') }}>Forgot password?</button></> : mode === 'verify' ? <button onClick={async () => { try { const r = await api('/auth/resend-verification-otp', { method: 'POST', body: JSON.stringify({ email: pendingEmail }) }); setNotice(r.message); setError('') } catch (e) { setError(e.message) } }}>Resend verification code</button> : mode === 'forgot' || mode === 'reset' ? <button onClick={() => { setMode('login'); setError(''); setNotice('') }}>Back to sign in</button> : <>Already have an account? <button onClick={() => setMode('login')}>Sign in</button></>}</div>
      <p className="auth-legal">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
    </div></section>
  </main>
}

function CreateClinic({ onCreated, onCancel }) {
  const [form, setForm] = useState({ name: '', slug: '', description: '', billingCycle: 'monthly', timezone: 'Asia/Kolkata' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [slugState, setSlugState] = useState(null)
  useEffect(() => {
    if (!form.slug) return
    const timer = setTimeout(() => api(`/clinics/slug-availability?slug=${encodeURIComponent(form.slug)}`).then(setSlugState).catch(() => setSlugState(null)), 350)
    return () => clearTimeout(timer)
  }, [form.slug])
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await api('/clinics', { method: 'POST', body: JSON.stringify({ ...form, contact: {}, address: {} }) })
      await onCreated(result.clinic)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <div className="create-wrap"><button className="back-link" onClick={onCancel}>← Back to workspace</button><div className="create-card"><div className="create-icon"><Icon name="clinic" size={22}/></div><span className="eyebrow">A NEW HOME FOR YOUR PRACTICE</span><h2>Let’s set up your clinic</h2><p className="muted">Start with the essentials. You can fill in the rest of your profile as you go.</p>
    <form className="stack-form" onSubmit={submit}><Field label="Clinic name" value={form.name} onChange={set('name')} placeholder="Willow Family Clinic" required/>
      <label className="field"><span>Your clinic link</span><div className="slug-input"><span>careloop.health/</span><input value={form.slug} onChange={set('slug')} placeholder="willow-family" required/><span className="slug-indicator">{form.slug && slugState?.available ? '✓' : form.slug && slugState && !slugState.available ? '×' : ''}</span></div>{form.slug && slugState?.message && <small className={slugState.available ? 'good-text' : 'bad-text'}>{slugState.message}</small>}</label>
      <Field label="A short introduction" value={form.description} onChange={set('description')} placeholder="Care that feels close to home…" />
      <label className="field"><span>Billing preference</span><select value={form.billingCycle} onChange={set('billingCycle')}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select><small>The initial account starts on Basic. Billing can be completed from your clinic setup.</small></label>
      {error && <div className="form-alert error-alert">{error}</div>}<Button disabled={busy} type="submit" className="full-button">{busy ? 'Creating clinic…' : 'Create clinic'} <Icon name="arrow" size={16}/></Button>
    </form></div></div>
}

function PublicClinic({ slug, onBack }) {
  const [clinic, setClinic] = useState(null)
  const [services, setServices] = useState([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [date, setDate] = useState(dateToday())
  const [availability, setAvailability] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  useEffect(() => {
    Promise.all([api(`/public/clinics/${encodeURIComponent(slug)}`), api(`/public/clinics/${encodeURIComponent(slug)}/services`)]).then(([a, b]) => { setClinic(a.data); setServices(b.services || []) }).catch((err) => setError(err.message))
  }, [slug])
  async function loadSlots(offeringId, requestedDate = date) {
    setSelected(offeringId); setSelectedSlot(''); setAvailability(null); setLoadingSlots(true)
    try { setAvailability(await api(`/public/clinics/${encodeURIComponent(slug)}/availability?doctorServiceId=${offeringId}&date=${requestedDate}`)) } catch (err) { setError(err.message) } finally { setLoadingSlots(false) }
  }
  if (error && !clinic) return <div className="public-error"><Button variant="quiet" onClick={onBack}>← Back to workspace</Button><div className="empty-card"><span className="empty-symbol">✳</span><h2>We couldn’t find this clinic</h2><p>{error}</p></div></div>
  if (!clinic) return <div className="public-loading"><span className="loading-dot"/> Loading clinic profile…</div>
  return <main className="public-site" style={{ '--clinic-accent': clinic.clinic.branding?.primaryColor || '#367d70' }}>
    <header className="public-nav"><button className="public-logo" onClick={onBack}><span className="brand-mark"><Icon name="clinic" size={18}/></span> careloop</button><div><span className="public-nav-label"><i/> Taking new patients</span><a className="button button-primary" href={clinic.clinic.contact?.phone ? `tel:${clinic.clinic.contact.phone}` : '#services'}>Get in touch <Icon name="arrow" size={15}/></a></div></header>
    <section className="public-hero"><div className="public-hero-copy"><span className="eyebrow">PERSONALIZED CARE, CLOSE TO HOME</span><h1>{clinic.clinic.name}</h1><p>{clinic.clinic.description || 'Thoughtful, expert care for every stage of life. Meet our team and find a time that works for you.'}</p><a className="button button-primary" href="#services">Explore our services <Icon name="arrow" size={16}/></a><div className="hero-meta"><span><Icon name="pin" size={15}/>{[clinic.clinic.address?.city, clinic.clinic.address?.state].filter(Boolean).join(', ') || 'Your neighborhood clinic'}</span><span><Icon name="clock" size={15}/>Appointments available</span></div></div><div className="hero-art"><div className="art-sun"/><div className="art-plant plant-one"><i/><i/><i/><b/></div><div className="art-plant plant-two"><i/><i/><i/><b/></div><div className="art-window"><div/><div/><div/><div/></div><div className="art-vase"/><div className="art-caption">A little more care<br/>in every moment.</div></div></section>
    <section className="team-section"><div className="section-heading"><div><span className="eyebrow">GOOD PEOPLE, GREAT CARE</span><h2>Meet your care team</h2></div><span className="section-count">{clinic.doctors.length} care professionals</span></div><div className="team-grid">{clinic.doctors.map((doctor, index) => <article className="team-card" key={doctor.id}><div className={`doctor-art doctor-art-${index % 4}`}>{doctor.photoUrl ? <img src={doctor.photoUrl} alt={doctor.name}/> : <span>{initials(doctor.name)}</span>}<i>✳</i></div><div className="team-info"><span>{doctor.specialization || 'Primary care'}</span><h3>{doctor.name}</h3><p>{doctor.qualifications?.join(' · ') || 'Compassionate, patient-first care'}</p><small>{doctor.experienceYears ? `${doctor.experienceYears} years experience` : 'Here for your health'}</small></div></article>)}</div></section>
    <section className="service-section" id="services"><div className="section-heading"><div><span className="eyebrow">CARE THAT FITS YOU</span><h2>Services & appointments</h2></div><p>Choose a service to see available times.</p></div><div className="service-layout"><div className="public-services">{services.map((service) => <article className={`public-service ${selected && service.doctors.some((d) => d.offeringId === selected) ? 'service-selected' : ''}`} key={service.id}><div className="service-symbol"><Icon name="spark" size={19}/></div><div className="public-service-main"><h3>{service.name}</h3><p>{service.description || 'Personalized care with our experienced team.'}</p><div className="service-offerings">{service.doctors.map((doctor) => <button key={doctor.offeringId} className="offering-row" onClick={() => loadSlots(doctor.offeringId)}><span className="mini-avatar">{initials(doctor.name)}</span><span><strong>{doctor.name}</strong><small>{doctor.durationMinutes} min · ₹{doctor.fee.toLocaleString('en-IN')}</small></span><Icon name="chevron" size={17}/></button>)}</div></div></article>)}{!services.length && <div className="empty-card"><h3>Services coming soon</h3><p>Our care team is preparing its appointment list.</p></div>}</div>
      <aside className="availability-card"><div className="availability-top"><span className="availability-icon"><Icon name="calendar" size={18}/></span><span className="eyebrow">FIND A TIME</span></div><h3>{selected ? 'Choose your appointment' : 'Your next visit starts here'}</h3><p>{selected ? 'Select a date to view times with this provider.' : 'Pick a service and provider to see available appointment times.'}</p><label className="field"><span>Appointment date</span><input type="date" min={dateToday()} value={date} onChange={(event) => { const nextDate = event.target.value; setDate(nextDate); if (selected) loadSlots(selected, nextDate) }}/></label>
        {selected && <div className="slot-results">{loadingSlots ? <p className="muted">Checking available times…</p> : availability?.slots?.length ? <><span className="slot-label">AVAILABLE TIMES · {availability.timezone}</span><div className="slot-grid">{availability.slots.map((slot) => <button key={slot.startTime} className={`slot-chip ${selectedSlot === slot.startTime ? 'slot-selected' : ''}`} onClick={() => setSelectedSlot(slot.startTime)}>{slot.startTime}</button>)}</div>{selectedSlot && <div className="selected-slot-note">You selected <strong>{selectedSlot}</strong>. To request this visit, contact the clinic directly.</div>}</> : availability ? <div className="no-slots">No open times on this date. Try another day.</div> : null}</div>}
        <div className="availability-foot"><Icon name="check" size={15}/> No payment needed to explore availability</div></aside></div></section>
    <footer className="public-footer"><button className="public-logo" onClick={onBack}><span className="brand-mark"><Icon name="clinic" size={16}/></span> careloop</button><span>Care that feels close to home.</span><span>{clinic.clinic.contact?.phone || clinic.clinic.contact?.email || ''}</span></footer>
  </main>
}

function App() {
  const [user, setUser] = useState(null)
  const [clinics, setClinics] = useState([])
  const [clinicId, setClinicId] = useState('')
  const [clinic, setClinic] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [services, setServices] = useState([])
  const [offerings, setOfferings] = useState([])
  const [schedules, setSchedules] = useState([])
  const [readiness, setReadiness] = useState(null)
  const [section, setSection] = useState('overview')
  const [publicSlug, setPublicSlug] = useState(() => {
    const match = window.location.pathname.match(/^\/clinic\/([^/]+)\/?$/)
    return match ? decodeURIComponent(match[1]) : ''
  })
  const [creatingClinic, setCreatingClinic] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [modal, setModal] = useState('')
  const [doctorForm, setDoctorForm] = useState({ name: '', specialization: '', qualifications: '', experienceYears: '', bio: '' })
  const [serviceForm, setServiceForm] = useState({ name: '', description: '' })
  const [offeringForm, setOfferingForm] = useState({ doctorId: '', serviceId: '', fee: '', durationMinutes: '30' })
  const [scheduleForm, setScheduleForm] = useState({ doctorId: '', dayOfWeek: '1', startTime: '09:00', endTime: '17:00' })
  const [clinicForm, setClinicForm] = useState(null)
  const [availabilityDate, setAvailabilityDate] = useState(dateToday())
  const [availabilityOffering, setAvailabilityOffering] = useState('')
  const [availabilitySlots, setAvailabilitySlots] = useState(null)

  const flash = (message) => { setToast(message); setTimeout(() => setToast(''), 3200) }
  const loadUser = useCallback(async () => {
    const result = await api('/auth/me'); setUser(result.user)
    const clinicResult = await api('/clinics/my-clinics'); setClinics(clinicResult.clinics || [])
    setClinicId((current) => current || clinicResult.clinics?.[0]?.id || '')
  }, [])
  useEffect(() => { const timer = setTimeout(() => { loadUser().catch(() => setUser(null)).finally(() => setLoading(false)) }, 0); return () => clearTimeout(timer) }, [loadUser])
  useEffect(() => {
    if (publicSlug) window.history.replaceState(null, '', `/clinic/${encodeURIComponent(publicSlug)}`)
    else if (window.location.pathname.startsWith('/clinic/')) window.history.replaceState(null, '', '/')
  }, [publicSlug])

  const loadClinic = useCallback(async (id) => {
    if (!id) return
    setError('')
    const base = `/clinics/${id}`
    try {
      const [profile, doctorResult, serviceResult, offeringResult] = await Promise.all([
        api(base), api(`${base}/doctors?includeInactive=true`), api(`${base}/services?includeInactive=true`), api(`${base}/doctor-services?includeInactive=true`),
      ])
      setClinic(profile.clinic); setClinicForm(profile.clinic)
      setDoctors(doctorResult.doctors || []); setServices(serviceResult.services || []); setOfferings(offeringResult.offerings || [])
      const scheduleResults = await Promise.all((doctorResult.doctors || []).map((doctor) => api(`${base}/schedules?doctorId=${doctor._id}&includeInactive=true`).catch(() => ({ schedules: [] }))))
      setSchedules(scheduleResults.flatMap((result) => result.schedules || []))
      try { const r = await api(`${base}/publishing-readiness`); setReadiness(r.readiness) } catch { setReadiness(null) }
    } catch (err) { setError(err.message) }
  }, [])
  useEffect(() => { if (!user || !clinicId) return; const timer = setTimeout(() => loadClinic(clinicId), 0); return () => clearTimeout(timer) }, [user, clinicId, loadClinic])

  async function reload() { await loadClinic(clinicId) }
  async function signOut() { try { await api('/auth/logout', { method: 'POST' }) } finally { setUser(null); setClinics([]); setClinic(null); setClinicId('') } }
  async function createClinicDone(newClinic) { setClinics((current) => [...current, { id: newClinic._id, name: newClinic.name, slug: newClinic.slug, status: newClinic.status, role: 'owner' }]); setClinicId(newClinic._id); setCreatingClinic(false); flash('Your clinic workspace is ready') }
  function formUpdater(setter, key) { return (event) => setter((current) => ({ ...current, [key]: event.target.value })) }

  async function createDoctor(event) {
    event.preventDefault(); setBusy(true)
    try { await api(`/clinics/${clinicId}/doctors`, { method: 'POST', body: JSON.stringify({ name: doctorForm.name, specialization: doctorForm.specialization, qualifications: doctorForm.qualifications.split(',').map((x) => x.trim()).filter(Boolean), ...(doctorForm.experienceYears ? { experienceYears: Number(doctorForm.experienceYears) } : {}), bio: doctorForm.bio }) }); setDoctorForm({ name: '', specialization: '', qualifications: '', experienceYears: '', bio: '' }); setModal(''); await reload(); flash('Care professional added') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function createService(event) {
    event.preventDefault(); setBusy(true)
    try { await api(`/clinics/${clinicId}/services`, { method: 'POST', body: JSON.stringify(serviceForm) }); setServiceForm({ name: '', description: '' }); setModal(''); await reload(); flash('Service added to your catalogue') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function createOffering(event) {
    event.preventDefault(); setBusy(true)
    try { await api(`/clinics/${clinicId}/doctor-services`, { method: 'POST', body: JSON.stringify({ ...offeringForm, fee: Number(offeringForm.fee), durationMinutes: Number(offeringForm.durationMinutes) }) }); setModal(''); await reload(); flash('Appointment offering created') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function createSchedule(event) {
    event.preventDefault(); setBusy(true)
    try { await api(`/clinics/${clinicId}/schedules`, { method: 'POST', body: JSON.stringify({ ...scheduleForm, dayOfWeek: Number(scheduleForm.dayOfWeek) }) }); setModal(''); const r = await api(`/clinics/${clinicId}/schedules?doctorId=${scheduleForm.doctorId}&includeInactive=true`); setSchedules(r.schedules || []); flash('Weekly availability saved') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function toggleStatus(kind, item, active) {
    const path = kind === 'doctor' ? `doctors/${item._id}` : kind === 'service' ? `services/${item._id}` : kind === 'offering' ? `doctor-services/${item._id}` : `schedules/${item._id}`
    try { await api(`/clinics/${clinicId}/${path}/status`, { method: 'PATCH', body: JSON.stringify({ isActive: active }) }); await reload(); flash(`${kind === 'doctor' ? 'Care professional' : kind === 'offering' ? 'Offering' : kind} ${active ? 'activated' : 'paused'}`) } catch (err) { setError(err.message) }
  }
  async function saveClinic(event) {
    event.preventDefault(); setBusy(true)
      const withoutBlank = (value) => Object.fromEntries(Object.entries(value || {}).filter(([, entry]) => entry !== '' && entry !== undefined))
      const payload = { name: clinicForm.name, description: clinicForm.description || '', timezone: clinicForm.timezone || 'Asia/Kolkata', contact: withoutBlank(clinicForm.contact), address: withoutBlank(clinicForm.address), branding: withoutBlank(clinicForm.branding) }
    try { await api(`/clinics/${clinicId}`, { method: 'PATCH', body: JSON.stringify(payload) }); await reload(); flash('Clinic profile saved') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function publishClinic() {
    setBusy(true)
    try { const r = await api(`/clinics/${clinicId}/publish`, { method: 'POST' }); await reload(); flash(r.message || 'Clinic website published') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function startSubscriptionCheckout() {
    setBusy(true)
    try {
      const orderResponse = await api(`/clinics/${clinicId}/subscription/payment-order`, { method: 'POST' })
      const order = orderResponse.order
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = resolve
          script.onerror = () => reject(new Error('Could not load Razorpay Checkout. Check your internet connection and try again.'))
          document.body.appendChild(script)
        })
      }
      setBusy(false)
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Careloop',
        description: `${clinic?.name || 'Clinic'} subscription`,
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: clinic?.branding?.primaryColor || '#33796d' },
        handler: async (payment) => {
          setBusy(true)
          try {
            const result = await api(`/clinics/${clinicId}/subscription/verify-payment`, { method: 'POST', body: JSON.stringify(payment) })
            await reload()
            flash(result.message || 'Subscription activated')
          } catch (err) { setError(err.message) } finally { setBusy(false) }
        },
        modal: { ondismiss: () => setBusy(false) },
      })
      checkout.on('payment.failed', (event) => { setBusy(false); setError(event.error?.description || 'Payment could not be completed') })
      checkout.open()
    } catch (err) { setError(err.message); setBusy(false) }
  }
  async function lookupAvailability(event) {
    event.preventDefault(); if (!availabilityOffering) return
    setBusy(true); setAvailabilitySlots(null)
    try { setAvailabilitySlots(await api(`/public/clinics/${clinic.slug}/availability?doctorServiceId=${availabilityOffering}&date=${availabilityDate}`)) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'grid', group: 'WORKSPACE' },
    { id: 'clinic', label: 'Clinic profile', icon: 'clinic', group: 'MANAGE' },
    { id: 'team', label: 'Care team', icon: 'people', group: 'MANAGE' },
    { id: 'services', label: 'Services & fees', icon: 'services', group: 'MANAGE' },
    { id: 'schedule', label: 'Availability', icon: 'calendar', group: 'MANAGE' },
    { id: 'website', label: 'Public website', icon: 'globe', group: 'PUBLISH' },
  ]
  const activeClinic = clinics.find((item) => String(item.id) === String(clinicId))
  const scheduleCount = schedules.filter((item) => item.isActive).length
  const activeOfferings = offerings.filter((item) => item.isActive)
  if (loading) return <div className="app-loading"><span className="loading-dot"/> Preparing your workspace…</div>
  if (publicSlug) return <PublicClinic slug={publicSlug} onBack={() => setPublicSlug('')}/>
  if (!user) return <AuthScreen onLogin={loadUser}/>
  if (creatingClinic) return <CreateClinic onCreated={createClinicDone} onCancel={() => setCreatingClinic(false)}/>
  if (!clinics.length) return <main className="onboarding"><div className="onboarding-top"><div className="brand-lockup"><span className="brand-mark"><Icon name="clinic" size={20}/></span><span>care<span className="brand-dot">loop</span></span></div><button className="user-pill" onClick={signOut}>{user.name} <Icon name="logout" size={15}/></button></div><div className="onboarding-content"><span className="eyebrow">YOUR PRACTICE, WELL LOOKED AFTER</span><h1>Let’s make space<br/>for <em>great care.</em></h1><p className="muted">Create your clinic workspace to set up your team, services, and public clinic page.</p><Button onClick={() => setCreatingClinic(true)}><Icon name="plus" size={17}/> Create your clinic</Button><div className="onboarding-note"><span className="onboarding-note-icon">✳</span><span><strong>A thoughtful place to begin</strong><small>Your clinic workspace keeps your people, schedule, and patient-facing details together.</small></span></div></div></main>

  const contentTitle = { overview: 'Good morning', clinic: 'Clinic profile', team: 'Care team', services: 'Services & fees', schedule: 'Availability', website: 'Your public website' }[section]
  const contentSub = { overview: 'Here’s what’s happening with your clinic today.', clinic: 'Keep your clinic details clear, current, and welcoming.', team: 'The people patients will meet along their care journey.', services: 'Shape your care catalogue and appointment offerings.', schedule: 'Set the rhythm of care for your team.', website: 'A welcoming first impression for your patients.' }[section]
  return <div className="dashboard-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}><div className="side-top"><div className="brand-lockup"><span className="brand-mark"><Icon name="clinic" size={19}/></span><span>care<span className="brand-dot">loop</span></span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><Icon name="close"/></button></div>
      <div className="clinic-switcher"><span className="switcher-avatar">{initials(activeClinic?.name || clinic?.name)}</span><span className="switcher-copy"><strong>{clinic?.name || activeClinic?.name || 'Loading clinic'}</strong><small>{clinic?.status === 'active' ? 'Published clinic' : 'Setup in progress'}</small></span><span className="switcher-chevron">⌄</span><select aria-label="Switch clinic" value={clinicId} onChange={(e) => setClinicId(e.target.value)}>{clinics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <nav className="side-nav">{['WORKSPACE', 'MANAGE', 'PUBLISH'].map((group) => <div className="nav-group" key={group}><span className="nav-group-title">{group}</span>{navItems.filter((item) => item.group === group).map((item) => <button key={item.id} className={`nav-item ${section === item.id ? 'nav-active' : ''}`} onClick={() => { setSection(item.id); setMobileNav(false); setError('') }}><Icon name={item.icon} size={17}/><span>{item.label}</span>{item.id === 'website' && clinic?.status === 'active' && <i className="nav-live-dot"/>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-spark"><Icon name="spark" size={16}/></div><strong>Here when you need us</strong><p>Thoughtful care starts with a little help.</p><button onClick={() => flash('Help resources are coming soon')}>Visit help center <Icon name="arrow" size={13}/></button></div><button className="profile-row" onClick={signOut}><span className="profile-avatar">{initials(user.name)}</span><span className="profile-copy"><strong>{user.name}</strong><small>Clinic owner</small></span><Icon name="logout" size={16}/></button></div>
    </aside>
    {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Icon name="menu"/></button><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14}/><strong>{navItems.find((item) => item.id === section)?.label}</strong></div><div className="topbar-right"><span className="today-label">{new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span><span className="topbar-divider"/><button className="icon-button" title="Help" onClick={() => flash('Help resources are coming soon')}>?</button><button className="top-avatar" onClick={signOut}>{initials(user.name)}</button></div></header>
      <div className="page-content"><div className="page-heading"><div><span className="eyebrow">{section === 'overview' ? `YOUR CLINIC · ${clinic?.timezone || 'ASIA/KOLKATA'}` : 'CLINIC WORKSPACE'}</span><h1>{section === 'overview' ? <>Good morning, {user.name?.split(' ')[0]} <span className="heading-spark">✳</span></> : contentTitle}</h1><p>{contentSub}</p></div>{clinic?.status === 'active' && <button className="live-badge" onClick={() => setPublicSlug(clinic.slug)}><i/> Website live <Icon name="arrow" size={13}/></button>}</div>
        {error && <div className="global-error"><span>{error}</span><button onClick={() => setError('')}><Icon name="close" size={15}/></button></div>}

        {section === 'overview' && <>
          <div className="welcome-banner"><div className="welcome-copy"><span className="eyebrow light">A GOOD DAY TO MAKE A DIFFERENCE</span><h2>Your clinic is taking shape.</h2><p>A few thoughtful steps now make it easier for patients to find the care they need.</p><Button variant="light" onClick={() => setSection(readiness?.ready ? 'website' : 'clinic')}>{readiness?.ready ? 'Review your website' : 'Continue setup'} <Icon name="arrow" size={15}/></Button></div><div className="welcome-illustration"><div className="welcome-orb"/><div className="welcome-leaf leaf-a"/><div className="welcome-leaf leaf-b"/><div className="welcome-vase"/><div className="welcome-sun">✳</div></div></div>
          <div className="stat-grid"><StatCard label="Care professionals" value={doctors.filter((d) => d.isActive).length} detail={`${doctors.length} on your team`} icon="people" tone="lavender"/><StatCard label="Services offered" value={activeOfferings.length} detail={`${services.filter((s) => s.isActive).length} in your catalogue`} icon="services" tone="peach"/><StatCard label="Weekly shifts" value={scheduleCount} detail="Across your care team" icon="calendar" tone="mint"/><StatCard label="Website status" value={clinic?.status === 'active' ? 'Live' : 'Draft'} detail={clinic?.status === 'active' ? `careloop.health/${clinic.slug}` : 'Ready when you are'} icon="globe" tone="blue"/></div>
          <div className="overview-grid"><section className="panel setup-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR SETUP PATH</span><h2>Small steps, better care</h2></div><span className="progress-count">{readiness?.ready ? 'All set' : `${Math.max(0, 5 - (readiness?.missingRequirements?.length || 4))} of 5`}</span></div><div className="setup-progress"><i style={{ width: `${readiness?.ready ? 100 : Math.max(10, (1 - (readiness?.missingRequirements?.length || 4) / 5) * 100)}%` }}/></div><div className="setup-list">{[
            { title: 'Tell us about your clinic', detail: 'Add your contact and location details', key: 'clinic_profile', done: Boolean(clinic?.contact?.phone && clinic?.address?.city && clinic?.address?.state), action: () => setSection('clinic') },
            { title: 'Introduce your care team', detail: 'Add at least one active professional', key: 'active_doctor', done: doctors.some((d) => d.isActive), action: () => setSection('team') },
            { title: 'Shape your services', detail: 'Create services and set appointment fees', key: 'services', done: activeOfferings.length > 0, action: () => setSection('services') },
            { title: 'Set your weekly availability', detail: 'Let patients know when you are open', key: 'schedules', done: scheduleCount > 0, action: () => setSection('schedule') },
            { title: 'Publish your clinic website', detail: 'Make your clinic visible to patients', key: 'active_subscription', done: clinic?.status === 'active', action: () => setSection('website') },
          ].map((step, index) => <button className="setup-step" key={step.key} onClick={step.action}><span className={`step-mark ${step.done ? 'step-done' : ''}`}>{step.done ? <Icon name="check" size={14}/> : `0${index + 1}`}</span><span className="step-copy"><strong>{step.title}</strong><small>{step.detail}</small></span><span className={`step-state ${step.done ? 'state-done' : ''}`}>{step.done ? 'Complete' : 'Set up'}</span><Icon name="chevron" size={16}/></button>)}</div></section>
            <section className="panel publish-panel"><div className="publish-art"><div className="publish-window"><div/><div/><div/><div/></div><div className="publish-plant"><i/><i/><b/></div><div className="publish-orbit"/></div><span className="eyebrow">A PLACE PATIENTS CAN FIND YOU</span><h2>Your clinic, out in the world.</h2><p>Share your services, introduce your team, and help new patients take the first step.</p><Button variant="outline" onClick={() => setSection('website')}>Explore your website <Icon name="arrow" size={14}/></Button></section></div>
          <div className="below-note"><span className="note-icon"><Icon name="spark" size={17}/></span><span><strong>Built around the way care works</strong><small>Your clinic’s information stays in sync across its profile, services, and availability.</small></span><button onClick={() => flash('More about Careloop is coming soon')}>Learn more <Icon name="arrow" size={13}/></button></div>
        </>}

        {section === 'clinic' && clinicForm && <section className="panel form-panel"><div className="panel-heading"><div><span className="eyebrow">THE DETAILS THAT MAKE YOU, YOU</span><h2>Clinic information</h2><p>These details appear on your patient-facing clinic page.</p></div><span className={`status-chip ${clinic.status === 'active' ? 'chip-green' : 'chip-neutral'}`}><i/>{clinic.status === 'active' ? 'Published' : 'Draft'}</span></div><form onSubmit={saveClinic}><div className="form-grid"><Field label="Clinic name" value={clinicForm.name || ''} onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })} required/><Field label="Clinic URL" value={`careloop.health/${clinicForm.slug}`} readOnly/><label className="field field-wide"><span>About the clinic</span><textarea rows="4" value={clinicForm.description || ''} onChange={(e) => setClinicForm({ ...clinicForm, description: e.target.value })} placeholder="What makes your approach to care special?"/></label><Field label="Phone number" type="tel" value={clinicForm.contact?.phone || ''} onChange={(e) => setClinicForm({ ...clinicForm, contact: { ...clinicForm.contact, phone: e.target.value } })} placeholder="+919876543210"/><Field label="Email address" type="email" value={clinicForm.contact?.email || ''} onChange={(e) => setClinicForm({ ...clinicForm, contact: { ...clinicForm.contact, email: e.target.value } })} placeholder="hello@yourclinic.com"/><Field label="Address" value={clinicForm.address?.line1 || ''} onChange={(e) => setClinicForm({ ...clinicForm, address: { ...clinicForm.address, line1: e.target.value } })} placeholder="Street address"/><Field label="Landmark / suite" value={clinicForm.address?.line2 || ''} onChange={(e) => setClinicForm({ ...clinicForm, address: { ...clinicForm.address, line2: e.target.value } })} placeholder="Building, floor, etc."/><Field label="City" value={clinicForm.address?.city || ''} onChange={(e) => setClinicForm({ ...clinicForm, address: { ...clinicForm.address, city: e.target.value } })} placeholder="Pune"/><Field label="State" value={clinicForm.address?.state || ''} onChange={(e) => setClinicForm({ ...clinicForm, address: { ...clinicForm.address, state: e.target.value } })} placeholder="Maharashtra"/><Field label="Postal code" value={clinicForm.address?.postalCode || ''} onChange={(e) => setClinicForm({ ...clinicForm, address: { ...clinicForm.address, postalCode: e.target.value } })} placeholder="411001"/><Field label="Time zone" value={clinicForm.timezone || 'Asia/Kolkata'} onChange={(e) => setClinicForm({ ...clinicForm, timezone: e.target.value })} hint="Used to calculate appointment times."/><label className="field"><span>Brand color</span><div className="color-field"><input type="color" value={clinicForm.branding?.primaryColor || '#367d70'} onChange={(e) => setClinicForm({ ...clinicForm, branding: { ...clinicForm.branding, primaryColor: e.target.value } })}/><input value={clinicForm.branding?.primaryColor || '#367d70'} onChange={(e) => setClinicForm({ ...clinicForm, branding: { ...clinicForm.branding, primaryColor: e.target.value } })}/></div></label></div><div className="form-actions"><span className="muted">Clinic URL can’t be changed after setup.</span><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save clinic profile'}</Button></div></form></section>}

        {section === 'team' && <><div className="section-toolbar"><div className="toolbar-caption"><span className="eyebrow">YOUR PEOPLE, YOUR PRACTICE</span><p>{doctors.filter((d) => d.isActive).length} active care professionals</p></div><Button onClick={() => { setDoctorForm({ name: '', specialization: '', qualifications: '', experienceYears: '', bio: '' }); setModal('doctor') }}><Icon name="plus" size={16}/> Add professional</Button></div><div className="doctor-grid">{doctors.map((doctor, index) => <article className="panel doctor-card" key={doctor._id}><div className="doctor-card-top"><div className={`doctor-avatar doctor-avatar-${index % 4}`}>{doctor.photoUrl ? <img src={doctor.photoUrl} alt=""/> : initials(doctor.name)}</div><button className={`status-chip ${doctor.isActive ? 'chip-green' : 'chip-neutral'}`} onClick={() => toggleStatus('doctor', doctor, !doctor.isActive)}><i/>{doctor.isActive ? 'Active' : 'Paused'}</button></div><div className="doctor-card-info"><span className="eyebrow">{doctor.specialization || 'CARE PROFESSIONAL'}</span><h3>{doctor.name}</h3><p>{doctor.qualifications?.join(' · ') || 'Qualifications not added'}</p><small>{doctor.experienceYears ? `${doctor.experienceYears} years of experience` : 'Experience not specified'}</small></div><div className="doctor-card-bottom"><span><Icon name="calendar" size={15}/>{schedules.filter((item) => String(item.doctorId) === String(doctor._id) && item.isActive).length} weekly shifts</span><span>{offerings.filter((item) => String(item.doctorId?._id || item.doctorId) === String(doctor._id) && item.isActive).length} services</span></div></article>)}<button className="add-card" onClick={() => setModal('doctor')}><span><Icon name="plus" size={20}/></span><strong>Add someone to your team</strong><small>Bring your care team together</small></button></div>{doctors.length === 0 && <EmptyState title="Your care team starts here" body="Add a professional to begin building your patient-facing clinic page." action="Add a professional" onAction={() => setModal('doctor')}/>}</>}

        {section === 'services' && <><div className="section-toolbar"><div className="toolbar-caption"><span className="eyebrow">A CLEARER WAY TO GET CARE</span><p>Services live in a catalogue, with pricing set for each professional.</p></div><div className="toolbar-actions"><Button variant="outline" onClick={() => setModal('offering')}><Icon name="plus" size={16}/> Set up an offering</Button><Button onClick={() => setModal('service')}><Icon name="plus" size={16}/> Add service</Button></div></div><section className="panel service-table-panel"><div className="table-heading"><div><h2>Your appointment offerings</h2><p>Individual fees and appointment lengths for your team.</p></div><span className="table-count">{activeOfferings.length} active</span></div>{activeOfferings.length ? <div className="offering-list">{activeOfferings.map((offering) => <div className="offering-item" key={offering._id}><span className="service-symbol"><Icon name="spark" size={17}/></span><div className="offering-label"><strong>{offering.serviceId?.name || 'Service'}</strong><small>with {offering.doctorId?.name || 'Care professional'}</small></div><span className="offering-duration"><Icon name="clock" size={14}/>{offering.durationMinutes} min</span><strong className="offering-fee">₹{Number(offering.fee).toLocaleString('en-IN')}</strong><button className="text-action" onClick={() => toggleStatus('offering', offering, false)}>Pause</button></div>)}</div> : <EmptyState title="No appointment offerings yet" body="Add a service, then pair it with a care professional and set the fee and duration." action="Set up an offering" onAction={() => setModal(services.length ? 'offering' : 'service')}/>}</section><section className="panel catalogue-panel"><div className="table-heading"><div><h2>Service catalogue</h2><p>Reusable services available at your clinic.</p></div><Button variant="quiet" onClick={() => setModal('service')}><Icon name="plus" size={15}/> Add service</Button></div><div className="catalogue-list">{services.map((service) => <div className="catalogue-item" key={service._id}><span className="catalogue-dot"/><div><strong>{service.name}</strong><small>{service.description || 'No description added'}</small></div><span className={`status-chip ${service.isActive ? 'chip-green' : 'chip-neutral'}`}><i/>{service.isActive ? 'Active' : 'Paused'}</span><button className="text-action" onClick={() => toggleStatus('service', service, !service.isActive)}>{service.isActive ? 'Pause' : 'Activate'}</button></div>)}{!services.length && <p className="empty-inline">Your service catalogue is waiting for its first entry.</p>}</div></section></>}

        {section === 'schedule' && <><div className="schedule-intro"><div><span className="eyebrow">A STEADY RHYTHM FOR GREAT CARE</span><h2>Weekly availability</h2><p>Set working hours for each day. Appointment times follow your clinic’s local time zone.</p></div><Button onClick={() => { setScheduleForm({ doctorId: doctors.find((d) => d.isActive)?._id || '', dayOfWeek: '1', startTime: '09:00', endTime: '17:00' }); setModal('schedule') }} disabled={!doctors.some((d) => d.isActive)}><Icon name="plus" size={16}/> Add weekly shift</Button></div><div className="schedule-layout"><section className="panel week-panel"><div className="table-heading"><div><h2>Care team hours</h2><p>Recurring weekly shifts</p></div><span className="timezone-tag">{clinic?.timezone || 'Asia/Kolkata'}</span></div>{doctors.filter((d) => d.isActive).map((doctor, index) => { const own = schedules.filter((item) => String(item.doctorId) === String(doctor._id)); return <div className="doctor-schedule" key={doctor._id}><div className="schedule-doctor"><span className={`mini-avatar schedule-avatar-${index % 4}`}>{initials(doctor.name)}</span><span><strong>{doctor.name}</strong><small>{doctor.specialization || 'Care professional'}</small></span></div><div className="schedule-days">{weekdays.map((day, dayIndex) => { const shifts = own.filter((item) => item.dayOfWeek === dayIndex && item.isActive); return <div className={`schedule-day ${shifts.length ? 'day-open' : ''}`} key={day}><span>{day.slice(0, 3)}</span>{shifts.length ? shifts.map((shift) => <div className="shift-chip" key={shift._id}><b/>{shift.startTime} – {shift.endTime}<button title="Pause shift" onClick={() => toggleStatus('schedule', shift, false)}>×</button></div>) : <small>—</small>}</div> })}</div></div> })}{!doctors.some((d) => d.isActive) && <EmptyState title="Add your care team first" body="Once you’ve added a professional, you can set their weekly hours." action="Add professional" onAction={() => setModal('doctor')}/>}</section>
            <section className="panel availability-test"><span className="availability-icon"><Icon name="search" size={18}/></span><span className="eyebrow">PATIENT VIEW</span><h3>Check open appointment times</h3><p>Preview the times patients will see for a selected service.</p><form className="availability-form" onSubmit={lookupAvailability}><label className="field"><span>Service & professional</span><select value={availabilityOffering} onChange={(e) => setAvailabilityOffering(e.target.value)} required><option value="">Choose an offering</option>{activeOfferings.map((item) => <option key={item._id} value={item._id}>{item.serviceId?.name} · {item.doctorId?.name}</option>)}</select></label><Field label="Date" type="date" min={dateToday()} value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} required/><Button type="submit" disabled={busy || !activeOfferings.length}>{busy ? 'Checking…' : 'Check availability'} <Icon name="arrow" size={14}/></Button></form>{availabilitySlots && <div className="admin-slots"><span>{availabilitySlots.slots?.length || 0} available times · {availabilitySlots.timezone}</span><div className="slot-grid">{availabilitySlots.slots?.slice(0, 10).map((slot) => <span className="slot-chip" key={slot.startTime}>{slot.startTime}</span>)}</div>{!availabilitySlots.slots?.length && <small>No open appointments for this day.</small>}</div>}</section></div></>}

        {section === 'website' && <><div className="website-hero"><div className="website-copy"><span className="eyebrow light">YOUR CLINIC, READY TO BE FOUND</span><h2>{clinic?.status === 'active' ? 'You’re open to the world.' : 'A welcoming page is taking shape.'}</h2><p>{clinic?.status === 'active' ? 'Your clinic page is live. Share it with patients and let them meet your team.' : 'A few finishing touches will help patients find your clinic and feel at home.'}</p><div className="website-url"><Icon name="globe" size={16}/><span>careloop.health/{clinic?.slug}</span>{clinic?.status === 'active' && <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/clinic/${clinic.slug}`); flash('Clinic link copied') }}>Copy link</button>}</div></div><div className="website-art"><div className="website-art-card"><div/><div/><div/></div><span>✳</span></div></div><div className="website-columns"><section className="panel readiness-panel"><div className="table-heading"><div><span className="eyebrow">PUBLISHING CHECKLIST</span><h2>Ready for your first visitor?</h2></div><span className={`status-chip ${readiness?.ready ? 'chip-green' : 'chip-amber'}`}><i/>{readiness?.ready ? 'Ready to publish' : 'In progress'}</span></div><p className="readiness-copy">A complete clinic page helps patients understand who you are and how to get care.</p><div className="readiness-list">{[
              ['Clinic name and URL', Boolean(readiness && !readiness.missingRequirements.includes('clinic_name') && !readiness.missingRequirements.includes('clinic_slug'))], ['Phone number', Boolean(readiness && !readiness.missingRequirements.includes('contact_phone'))], ['Clinic location', Boolean(readiness && !readiness.missingRequirements.includes('address_city') && !readiness.missingRequirements.includes('address_state'))], ['At least one active care professional', Boolean(readiness && !readiness.missingRequirements.includes('active_doctor'))], ['Active subscription', Boolean(readiness && !readiness.missingRequirements.includes('active_subscription'))],
            ].map(([label, done]) => <div className="readiness-item" key={label}><span className={`readiness-check ${done ? 'readiness-done' : ''}`}>{done && <Icon name="check" size={12}/>}</span><span>{label}</span>{!done && <button onClick={() => setSection(label.includes('professional') ? 'team' : 'clinic')}>Complete <Icon name="arrow" size={12}/></button>}</div>)}</div>{clinic?.status === 'active' ? <Button onClick={() => setPublicSlug(clinic.slug)}>Open clinic website <Icon name="arrow" size={15}/></Button> : <Button disabled={busy || !readiness?.canPublish} onClick={publishClinic}>{busy ? 'Publishing…' : 'Publish clinic website'} <Icon name="arrow" size={15}/></Button>}</section>
            <section className="panel subscription-panel"><span className="subscription-icon"><Icon name="spark" size={18}/></span><span className="eyebrow">CLINIC PLAN</span><h2>Basic plan</h2><p>Your clinic starts on Basic. An active subscription is required before publishing and accepting online bookings.</p><div className="plan-status"><span className={`status-chip ${readiness?.subscriptionStatus === 'active' ? 'chip-green' : 'chip-amber'}`}><i/>{readiness?.subscriptionStatus || 'pending'}</span><small>{readiness?.subscriptionStatus === 'active' ? 'Your clinic plan is active.' : 'Secure checkout with Razorpay.'}</small></div><Button variant="outline" className="full-button" disabled={busy || readiness?.subscriptionStatus === 'active'} onClick={startSubscriptionCheckout}>{busy ? 'Preparing checkout…' : readiness?.subscriptionStatus === 'active' ? 'Subscription active' : 'Complete subscription'} <Icon name="arrow" size={14}/></Button></section></div>
          <section className="panel preview-panel"><div className="table-heading"><div><span className="eyebrow">A QUICK LOOK</span><h2>Meet your public clinic page</h2><p>See what patients will see when they discover your practice.</p></div><Button variant="quiet" onClick={() => setPublicSlug(clinic.slug)}><Icon name="arrow" size={15}/> Preview page</Button></div><div className="preview-browser"><div className="browser-bar"><span/><span/><span/><div>careloop.health/{clinic?.slug}</div></div><div className="browser-content"><div><span className="eyebrow">PERSONALIZED CARE, CLOSE TO HOME</span><h2>{clinic?.name}</h2><p>{clinic?.description || 'Your thoughtful clinic introduction will appear here.'}</p><span className="preview-cta">Explore our services <Icon name="arrow" size={13}/></span></div><div className="preview-orb"><span>✳</span></div></div></div></section></>}
      </div>
      <footer className="app-footer"><span>Careloop clinic workspace</span><span>Thoughtful care, made easier <i>✳</i></span></footer>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal('') }}><section className="modal-card"><div className="modal-head"><div><span className="eyebrow">{modal === 'doctor' ? 'GROW YOUR CARE TEAM' : modal === 'service' ? 'YOUR CLINIC CATALOGUE' : modal === 'offering' ? 'PERSONALIZE THE VISIT' : 'A STEADY CARE RHYTHM'}</span><h2>{modal === 'doctor' ? 'Add a professional' : modal === 'service' ? 'Add a service' : modal === 'offering' ? 'Set up an offering' : 'Add weekly hours'}</h2></div><button className="icon-button" onClick={() => setModal('')}><Icon name="close"/></button></div>
      {modal === 'doctor' && <form className="stack-form" onSubmit={createDoctor}><Field label="Full name" value={doctorForm.name} onChange={formUpdater(setDoctorForm, 'name')} placeholder="Dr. Meera Shah" minLength={2} required/><Field label="Specialization" value={doctorForm.specialization} onChange={formUpdater(setDoctorForm, 'specialization')} placeholder="Family medicine"/><Field label="Qualifications" value={doctorForm.qualifications} onChange={formUpdater(setDoctorForm, 'qualifications')} placeholder="MBBS, MD (comma separated)" hint="Separate qualifications with a comma."/><Field label="Years of experience" type="number" min="0" max="70" value={doctorForm.experienceYears} onChange={formUpdater(setDoctorForm, 'experienceYears')} placeholder="8"/><label className="field"><span>Short introduction</span><textarea rows="3" value={doctorForm.bio} onChange={formUpdater(setDoctorForm, 'bio')} placeholder="A little about their approach to care…"/></label><ModalActions busy={busy} onCancel={() => setModal('')}/></form>}
      {modal === 'service' && <form className="stack-form" onSubmit={createService}><Field label="Service name" value={serviceForm.name} onChange={formUpdater(setServiceForm, 'name')} placeholder="General consultation" minLength={2} required/><label className="field"><span>Description</span><textarea rows="3" value={serviceForm.description} onChange={formUpdater(setServiceForm, 'description')} placeholder="What patients can expect…"/></label><ModalActions busy={busy} onCancel={() => setModal('')}/></form>}
      {modal === 'offering' && <form className="stack-form" onSubmit={createOffering}><label className="field"><span>Care professional</span><select value={offeringForm.doctorId} onChange={formUpdater(setOfferingForm, 'doctorId')} required><option value="">Choose a professional</option>{doctors.filter((d) => d.isActive).map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label><label className="field"><span>Service</span><select value={offeringForm.serviceId} onChange={formUpdater(setOfferingForm, 'serviceId')} required><option value="">Choose a service</option>{services.filter((s) => s.isActive).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></label><div className="form-grid"><Field label="Fee (INR)" type="number" min="0" value={offeringForm.fee} onChange={formUpdater(setOfferingForm, 'fee')} placeholder="800" required/><Field label="Length (minutes)" type="number" min="5" max="480" value={offeringForm.durationMinutes} onChange={formUpdater(setOfferingForm, 'durationMinutes')} required/></div><p className="inline-note">A professional can only have one active offering per service.</p><ModalActions busy={busy} onCancel={() => setModal('')}/></form>}
      {modal === 'schedule' && <form className="stack-form" onSubmit={createSchedule}><label className="field"><span>Care professional</span><select value={scheduleForm.doctorId} onChange={formUpdater(setScheduleForm, 'doctorId')} required><option value="">Choose a professional</option>{doctors.filter((d) => d.isActive).map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label><label className="field"><span>Day of the week</span><select value={scheduleForm.dayOfWeek} onChange={formUpdater(setScheduleForm, 'dayOfWeek')}>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><div className="form-grid"><Field label="Starts at" type="time" value={scheduleForm.startTime} onChange={formUpdater(setScheduleForm, 'startTime')} required/><Field label="Ends at" type="time" value={scheduleForm.endTime} onChange={formUpdater(setScheduleForm, 'endTime')} required/></div><p className="inline-note">Times are shown in {clinic?.timezone || 'Asia/Kolkata'}. Overlapping shifts will be rejected.</p><ModalActions busy={busy} onCancel={() => setModal('')}/></form>}
    </section></div>}
    {toast && <div className="toast-message"><span><Icon name="check" size={15}/></span>{toast}</div>}
  </div>
}

function StatCard({ label, value, detail, icon, tone }) { return <article className="stat-card"><span className={`stat-icon stat-${tone}`}><Icon name={icon} size={17}/></span><span className="stat-label">{label}</span><strong>{value}</strong><small>{detail}</small></article> }
function EmptyState({ title, body, action, onAction }) { return <div className="empty-state"><span className="empty-symbol">✳</span><h3>{title}</h3><p>{body}</p>{action && <Button variant="outline" onClick={onAction}><Icon name="plus" size={15}/>{action}</Button>}</div> }
function ModalActions({ busy, onCancel }) { return <div className="modal-actions"><Button variant="outline" type="button" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'} <Icon name="arrow" size={14}/></Button></div> }

export default App
