import { useEffect, useState } from 'react'
import { api, getInitials, todayISO } from '../lib/api.js'
import { Field, Icon } from '../components/ui/index.jsx'
import Brand from '../components/ui/Brand.jsx'

export default function PublicClinicPage({ slug, onBack }) {
  const [profile, setProfile] = useState(null)
  const [services, setServices] = useState([])
  const [error, setError] = useState('')
  const [offering, setOffering] = useState(null)
  const [date, setDate] = useState(todayISO())
  const [slots, setSlots] = useState(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    Promise.all([api(`/public/clinics/${encodeURIComponent(slug)}`), api(`/public/clinics/${encodeURIComponent(slug)}/services`)]).then(([clinicResult, serviceResult]) => { setProfile(clinicResult.data); setServices(serviceResult.services || []) }).catch((requestError) => setError(requestError.message))
  }, [slug])
  async function checkTimes(item, requestedDate = date) {
    setOffering(item); setSelectedTime(''); setSlots(null); setLoading(true)
    try { setSlots(await api(`/public/clinics/${encodeURIComponent(slug)}/availability?doctorServiceId=${item.offeringId}&date=${requestedDate}`)) }
    catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }
  if (error && !profile) return <main className="public-page"><header className="public-nav"><Brand/><button className="plain-link" onClick={onBack}>Back to workspace</button></header><section className="public-not-found"><h1>Clinic not found</h1><p>{error}</p></section></main>
  if (!profile) return <div className="app-loading">Loading clinic…</div>
  const clinic = profile.clinic
  return <main className="public-page"><header className="public-nav"><button className="public-brand" onClick={onBack}><Brand/></button><div><span>{clinic.address?.city}{clinic.address?.state ? `, ${clinic.address.state}` : ''}</span>{clinic.contact?.phone && <a className="button button-outline" href={`tel:${clinic.contact.phone}`}>Call clinic</a>}</div></header>
    <section className="public-hero"><span className="eyebrow">CLINIC</span><h1>{clinic.name}</h1><p>{clinic.description || 'Quality care from a team that puts patients first.'}</p><div className="public-meta">{clinic.address?.line1 && <span><Icon name="pin" size={15}/>{[clinic.address.line1, clinic.address.city].filter(Boolean).join(', ')}</span>}{clinic.contact?.email && <span>{clinic.contact.email}</span>}</div><div className="public-rule"/></section>
    <section className="public-team"><div className="public-section-heading"><div><span className="eyebrow">OUR TEAM</span><h2>Care professionals</h2></div><span>{profile.doctors.length}</span></div>{profile.doctors.length ? <div className="public-doctor-grid">{profile.doctors.map((doctor) => <article className="public-doctor" key={doctor.id}><div className="public-doctor-avatar">{doctor.photoUrl ? <img src={doctor.photoUrl} alt={doctor.name}/> : getInitials(doctor.name)}</div><div><h3>{doctor.name}</h3><p>{doctor.specialization || 'Care professional'}</p><small>{doctor.qualifications?.join(' · ') || ''}</small></div></article>)}</div> : <p className="muted">Care team details will be available soon.</p>}</section>
    <section className="public-booking"><div className="public-section-heading"><div><span className="eyebrow">SERVICES</span><h2>Appointments</h2></div><p>Select a provider to view available times.</p></div><div className="public-service-grid">{services.map((service) => <article className="public-service" key={service.id}><h3>{service.name}</h3><p>{service.description || 'Personalized care with our experienced team.'}</p>{service.doctors.map((doctor) => <button className={`public-offering ${offering?.offeringId === doctor.offeringId ? 'offering-active' : ''}`} key={doctor.offeringId} onClick={() => checkTimes(doctor)}><span>{doctor.name}</span><small>{doctor.durationMinutes} min · ₹{Number(doctor.fee).toLocaleString('en-IN')}</small><Icon name="chevron" size={16}/></button>)}</article>)}{!services.length && <p className="muted">No services published yet.</p>}</div>
      <aside className="public-availability"><div><span className="eyebrow">AVAILABILITY</span><h3>{offering ? `Times with ${offering.name}` : 'Choose a service and provider'}</h3></div><Field label="Date" type="date" min={todayISO()} value={date} onChange={(event) => { setDate(event.target.value); if (offering) checkTimes(offering, event.target.value) }}/>{loading && <p className="muted small-text">Checking availability…</p>}{slots?.slots?.length > 0 && <div className="slot-grid">{slots.slots.map((slot) => <button className={selectedTime === slot.startTime ? 'slot-active' : ''} key={slot.startTime} onClick={() => setSelectedTime(slot.startTime)}>{slot.startTime}</button>)}</div>}{slots && !slots.slots?.length && <p className="muted small-text">No times available on this date.</p>}{selectedTime && <p className="muted small-text">Selected {selectedTime}. To request an appointment, contact the clinic directly.</p>}<small>Appointment requests are not enabled in the current backend.</small></aside>
    </section><footer className="public-footer"><Brand/><span>{clinic.name}</span><button className="plain-link" onClick={onBack}>Workspace</button></footer>
  </main>
}
