import { useCallback, useEffect, useState } from 'react'
import { api } from './lib/api.js'
import AuthPage from './pages/AuthPage.jsx'
import CreateClinicPage from './pages/CreateClinicPage.jsx'
import PublicClinicPage from './pages/PublicClinicPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import ClinicProfilePage from './pages/ClinicProfilePage.jsx'
import TeamPage from './pages/TeamPage.jsx'
import ServicesPage from './pages/ServicesPage.jsx'
import AvailabilityPage from './pages/AvailabilityPage.jsx'
import WebsitePage from './pages/WebsitePage.jsx'
import Sidebar, { Topbar } from './components/layout/Sidebar.jsx'
import { Alert, Icon, Toast } from './components/ui/index.jsx'
import './App.css'

const publicSlugFromPath = () => {
  const match = window.location.pathname.match(/^\/clinic\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function App() {
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
  const [publicSlug, setPublicSlug] = useState(publicSlugFromPath)
  const [creatingClinic, setCreatingClinic] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000) }
  const loadUser = useCallback(async () => {
    const result = await api('/auth/me')
    const clinicResult = await api('/clinics/my-clinics')
    setUser(result.user)
    setClinics(clinicResult.clinics || [])
    setClinicId((current) => current || clinicResult.clinics?.[0]?.id || '')
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadUser().catch(() => setUser(null)).finally(() => setLoading(false)), 0)
    return () => window.clearTimeout(timer)
  }, [loadUser])
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
      setClinic(profile.clinic)
      setDoctors(doctorResult.doctors || [])
      setServices(serviceResult.services || [])
      setOfferings(offeringResult.offerings || [])
      const scheduleResults = await Promise.all((doctorResult.doctors || []).map((doctor) => api(`${base}/schedules?doctorId=${doctor._id}&includeInactive=true`).catch(() => ({ schedules: [] }))))
      setSchedules(scheduleResults.flatMap((result) => result.schedules || []))
      try { setReadiness((await api(`${base}/publishing-readiness`)).readiness) } catch { setReadiness(null) }
    } catch (requestError) { setError(requestError.message) }
  }, [])
  useEffect(() => {
    if (!user || !clinicId) return
    const timer = window.setTimeout(() => loadClinic(clinicId), 0)
    return () => window.clearTimeout(timer)
  }, [user, clinicId, loadClinic])

  const reload = () => loadClinic(clinicId)
  async function withBusy(action) {
    setBusy(true); setError('')
    try { const result = await action(); return result }
    catch (requestError) { setError(requestError.message); throw requestError }
    finally { setBusy(false) }
  }
  async function createClinicDone(newClinic) {
    setClinics((current) => [...current, { id: newClinic._id, name: newClinic.name, slug: newClinic.slug, status: newClinic.status, role: 'owner' }])
    setClinicId(newClinic._id); setCreatingClinic(false); notify('Clinic created')
    await loadClinic(newClinic._id)
  }
  async function signOut() {
    try { await api('/auth/logout', { method: 'POST' }) }
    finally { setUser(null); setClinics([]); setClinic(null); setClinicId('') }
  }
  async function createDoctor(data) {
    await withBusy(() => api(`/clinics/${clinicId}/doctors`, { method: 'POST', body: JSON.stringify(data) }))
    await reload(); notify('Professional added')
  }
  async function toggleDoctor(item, isActive) {
    try { await withBusy(() => api(`/clinics/${clinicId}/doctors/${item._id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })); await reload(); notify('Professional status updated') } catch { /* error shown globally */ }
  }
  async function createService(data) {
    await withBusy(() => api(`/clinics/${clinicId}/services`, { method: 'POST', body: JSON.stringify(data) }))
    await reload(); notify('Service added')
  }
  async function toggleService(item, isActive) {
    try { await withBusy(() => api(`/clinics/${clinicId}/services/${item._id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })); await reload(); notify('Service status updated') } catch { /* error shown globally */ }
  }
  async function createOffering(data) {
    await withBusy(() => api(`/clinics/${clinicId}/doctor-services`, { method: 'POST', body: JSON.stringify(data) }))
    await reload(); notify('Appointment offering added')
  }
  async function toggleOffering(item, isActive) {
    try { await withBusy(() => api(`/clinics/${clinicId}/doctor-services/${item._id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })); await reload(); notify('Offering status updated') } catch { /* error shown globally */ }
  }
  async function createSchedule(data) {
    await withBusy(() => api(`/clinics/${clinicId}/schedules`, { method: 'POST', body: JSON.stringify(data) }))
    await reload(); notify('Weekly hours saved')
  }
  async function toggleSchedule(item, isActive) {
    try { await withBusy(() => api(`/clinics/${clinicId}/schedules/${item._id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })); await reload(); notify('Shift updated') } catch { /* error shown globally */ }
  }
  async function saveClinic(payload) {
    await withBusy(() => api(`/clinics/${clinicId}`, { method: 'PATCH', body: JSON.stringify(payload) }))
    await reload(); notify('Clinic profile saved')
  }
  async function publishClinic() {
    try { await withBusy(() => api(`/clinics/${clinicId}/publish`, { method: 'POST' })); await reload(); notify('Clinic website published') } catch { /* error shown globally */ }
  }
  async function checkoutSubscription() {
    try {
      const { order } = await withBusy(() => api(`/clinics/${clinicId}/subscription/payment-order`, { method: 'POST' }))
      if (!window.Razorpay) await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = resolve
        script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'))
        document.body.appendChild(script)
      })
      const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: 'Careloop', description: `${clinic.name} subscription`, order_id: order.orderId, prefill: { name: user.name, email: user.email },
        handler: async (payment) => {
          try { await withBusy(() => api(`/clinics/${clinicId}/subscription/verify-payment`, { method: 'POST', body: JSON.stringify(payment) })); await reload(); notify('Subscription activated') }
          catch { /* error shown globally */ }
        }, modal: { ondismiss: () => setBusy(false) },
      })
      checkout.on('payment.failed', (event) => { setBusy(false); setError(event.error?.description || 'Payment was not completed') })
      checkout.open()
    } catch { /* error shown globally */ }
  }
  function changeSection(nextSection) { setSection(nextSection); setMobileNav(false); setError('') }

  if (loading) return <div className="app-loading">Loading workspace…</div>
  if (publicSlug) return <PublicClinicPage slug={publicSlug} onBack={() => setPublicSlug('')}/>
  if (!user) return <AuthPage onLogin={loadUser}/>
  if (creatingClinic) return <CreateClinicPage onCreated={createClinicDone} onCancel={() => setCreatingClinic(false)}/>
  if (!clinics.length) return <main className="onboarding"><div className="onboarding-top"><span className="brand-lockup">Careloop</span><button className="plain-link" onClick={signOut}>{user.name} · Sign out</button></div><section className="onboarding-content"><span className="eyebrow">CLINIC WORKSPACE</span><h1>Set up your clinic</h1><p>Create a clinic profile to manage your care team, services, and patient availability.</p><button className="button button-primary" onClick={() => setCreatingClinic(true)}><Icon name="plus" size={16}/>Create clinic</button></section></main>

  const activeClinic = clinics.find((item) => String(item.id) === String(clinicId))
  const pages = {
    overview: <OverviewPage user={user} clinic={clinic} doctors={doctors} services={services} offerings={offerings} schedules={schedules} readiness={readiness} onNavigate={changeSection}/>,
    clinic: clinic && <ClinicProfilePage key={clinicId} clinic={clinic} busy={busy} onSave={saveClinic}/>,
    team: <TeamPage doctors={doctors} schedules={schedules} offerings={offerings} busy={busy} onCreate={createDoctor} onToggle={toggleDoctor} onError={setError}/>,
    services: <ServicesPage doctors={doctors} services={services} offerings={offerings} busy={busy} onCreateService={createService} onCreateOffering={createOffering} onToggleService={toggleService} onToggleOffering={toggleOffering} onError={setError}/>,
    schedule: <AvailabilityPage clinic={clinic} doctors={doctors} schedules={schedules} offerings={offerings} busy={busy} onCreate={createSchedule} onToggle={toggleSchedule} onError={setError}/>,
    website: clinic && <WebsitePage clinic={clinic} readiness={readiness} busy={busy} onNavigate={changeSection} onPublish={publishClinic} onCheckout={checkoutSubscription} onPreview={() => setPublicSlug(clinic.slug)}/>,
  }

  return <div className="dashboard-shell"><Sidebar clinic={clinic || activeClinic} clinics={clinics} clinicId={clinicId} user={user} section={section} open={mobileNav} onClinicChange={setClinicId} onNavigate={changeSection} onSignOut={signOut} onClose={() => setMobileNav(false)}/><main className="main-area"><Topbar section={section} user={user} onMenu={() => setMobileNav(true)} onSignOut={signOut}/><div className="page-content"><Alert onClose={() => setError('')}>{error}</Alert>{pages[section]}</div><footer className="app-footer"><span>Careloop clinic workspace</span><span>{clinic?.name || 'Clinic management'}</span></footer></main><Toast message={toast}/></div>
}
