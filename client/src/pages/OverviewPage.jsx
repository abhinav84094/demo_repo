import { Button, Icon, PageHeading, StatusChip } from '../components/ui/index.jsx'

export default function OverviewPage({ user, clinic, doctors, services, offerings, schedules, readiness, onNavigate }) {
  const activeDoctors = doctors.filter((doctor) => doctor.isActive)
  const activeOffers = offerings.filter((item) => item.isActive)
  const activeSchedules = schedules.filter((item) => item.isActive)
  const steps = [
    { title: 'Complete clinic profile', detail: 'Add your contact and location', done: Boolean(clinic?.contact?.phone && clinic?.address?.city && clinic?.address?.state), page: 'clinic' },
    { title: 'Add your care team', detail: 'Introduce at least one professional', done: activeDoctors.length > 0, page: 'team' },
    { title: 'Set up services and fees', detail: 'Create an appointment offering', done: activeOffers.length > 0, page: 'services' },
    { title: 'Add weekly availability', detail: 'Choose the hours patients can visit', done: activeSchedules.length > 0, page: 'schedule' },
    { title: 'Publish your clinic page', detail: 'Share your clinic with patients', done: clinic?.status === 'active', page: 'website' },
  ]
  const stats = [
    ['Care professionals', activeDoctors.length], ['Services', services.filter((item) => item.isActive).length],
    ['Appointment offerings', activeOffers.length], ['Weekly shifts', activeSchedules.length],
  ]
  return <>
    <PageHeading eyebrow={`CLINIC WORKSPACE · ${clinic?.timezone || 'ASIA/KOLKATA'}`} title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}`} description="Manage your clinic profile, team, and patient availability." action={clinic?.status === 'active' && <StatusChip tone="black">Website published</StatusChip>}/>
    <section className="welcome-banner"><div><span className="eyebrow">OVERVIEW</span><h2>{clinic?.name}</h2><p>{clinic?.description || 'Your clinic workspace is ready. Complete the setup steps to prepare your public page.'}</p><Button variant="outline" onClick={() => onNavigate(readiness?.ready ? 'website' : 'clinic')}>{readiness?.ready ? 'View website' : 'Continue setup'}<Icon name="arrow" size={15}/></Button></div><div className="welcome-monogram">{(clinic?.name || 'C').slice(0, 1).toUpperCase()}</div></section>
    <div className="stat-grid">{stats.map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <section className="panel setup-panel"><div className="panel-heading"><div><span className="eyebrow">SETUP</span><h2>Clinic launch checklist</h2></div><span className="muted small-text">{steps.filter((step) => step.done).length} / {steps.length} complete</span></div><div className="setup-progress"><i style={{ width: `${steps.filter((step) => step.done).length * 20}%` }}/></div><div className="setup-list">{steps.map((step, index) => <button className="setup-step" key={step.title} onClick={() => onNavigate(step.page)}><span className={`step-mark ${step.done ? 'step-done' : ''}`}>{step.done ? <Icon name="check" size={14}/> : String(index + 1).padStart(2, '0')}</span><span className="step-copy"><strong>{step.title}</strong><small>{step.detail}</small></span><span className="step-state">{step.done ? 'Complete' : 'Set up'}</span><Icon name="chevron" size={16}/></button>)}</div></section>
  </>
}
