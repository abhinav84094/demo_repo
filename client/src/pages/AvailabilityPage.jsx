import { useState } from 'react'
import { api, todayISO, weekdays } from '../lib/api.js'
import { Button, EmptyState, Field, Icon, Modal, ModalActions, PageHeading } from '../components/ui/index.jsx'

export default function AvailabilityPage({ clinic, doctors, schedules, offerings, busy, onCreate, onToggle, onError }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ doctorId: doctors.find((item) => item.isActive)?._id || '', dayOfWeek: '1', startTime: '09:00', endTime: '17:00' })
  const [offeringId, setOfferingId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [slots, setSlots] = useState(null)
  const [checking, setChecking] = useState(false)
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  async function submit(event) {
    event.preventDefault()
    try { await onCreate({ ...form, dayOfWeek: Number(form.dayOfWeek) }); setAdding(false) } catch (error) { onError(error.message) }
  }
  async function checkAvailability(event) {
    event.preventDefault(); setChecking(true); setSlots(null)
    try { setSlots(await api(`/public/clinics/${clinic.slug}/availability?doctorServiceId=${offeringId}&date=${date}`)) }
    catch (error) { onError(error.message) } finally { setChecking(false) }
  }
  return <><PageHeading title="Availability" description="Set recurring working hours and preview bookable slots." action={<Button onClick={() => setAdding(true)} disabled={!doctors.some((item) => item.isActive)}><Icon name="plus" size={15}/>Add weekly shift</Button>}/>
    <section className="panel table-panel"><div className="table-heading"><div><h2>Weekly schedule</h2><p>All hours are shown in {clinic?.timezone || 'Asia/Kolkata'}.</p></div></div>{doctors.filter((doctor) => doctor.isActive).map((doctor) => { const shifts = schedules.filter((item) => String(item.doctorId) === String(doctor._id)); return <div className="schedule-person" key={doctor._id}><h3>{doctor.name}</h3><div className="week-list">{weekdays.map((day, index) => { const dayShifts = shifts.filter((shift) => shift.dayOfWeek === index && shift.isActive); return <div className="week-row" key={day}><span>{day}</span>{dayShifts.length ? <span className="shift-list">{dayShifts.map((shift) => <span className="shift-chip" key={shift._id}>{shift.startTime} – {shift.endTime}<button aria-label="Deactivate shift" onClick={() => onToggle(shift, false)}>×</button></span>)}</span> : <small>Closed</small>}</div>})}</div></div>})}{!doctors.some((item) => item.isActive) && <EmptyState title="Add a care professional first" body="Create a team member before configuring weekly hours."/>}</section>
    <section className="panel availability-test"><div className="panel-heading"><div><span className="eyebrow">PUBLIC AVAILABILITY</span><h2>Preview open times</h2></div><Icon name="search"/></div><p className="muted small-text">Check the same availability endpoint used by the clinic website.</p><form className="availability-form" onSubmit={checkAvailability}><label className="field"><span>Service offering</span><select value={offeringId} onChange={(event) => setOfferingId(event.target.value)} required><option value="">Choose an offering</option>{offerings.filter((item) => item.isActive).map((item) => <option key={item._id} value={item._id}>{item.serviceId?.name} · {item.doctorId?.name}</option>)}</select></label><Field label="Date" type="date" min={todayISO()} value={date} onChange={(event) => setDate(event.target.value)} required/><Button type="submit" disabled={checking || !offerings.some((item) => item.isActive)}>{checking ? 'Checking…' : 'Check availability'}</Button></form>{slots && <div className="slot-results"><span>{slots.slots?.length || 0} times · {slots.timezone}</span><div className="slot-grid">{slots.slots?.map((slot) => <span key={slot.startTime}>{slot.startTime}</span>)}</div>{!slots.slots?.length && <p>No available times for this date.</p>}</div>}</section>
    {adding && <Modal eyebrow="WEEKLY SCHEDULE" title="Add weekly shift" onClose={() => setAdding(false)}><form className="stack-form" onSubmit={submit}><label className="field"><span>Professional</span><select value={form.doctorId} onChange={update('doctorId')} required><option value="">Choose professional</option>{doctors.filter((item) => item.isActive).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><label className="field"><span>Day</span><select value={form.dayOfWeek} onChange={update('dayOfWeek')}>{weekdays.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label><div className="form-grid"><Field label="Start" type="time" value={form.startTime} onChange={update('startTime')} required/><Field label="End" type="time" value={form.endTime} onChange={update('endTime')} required/></div><ModalActions busy={busy} onCancel={() => setAdding(false)} submit="Save hours"/></form></Modal>}
  </>
}
