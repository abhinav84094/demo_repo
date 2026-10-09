import { useState } from 'react'
import { getInitials } from '../lib/api.js'
import { Button, EmptyState, Field, Icon, Modal, ModalActions, PageHeading, StatusChip } from '../components/ui/index.jsx'

export default function TeamPage({ doctors, schedules, offerings, busy, onCreate, onToggle, onError }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', specialization: '', qualifications: '', experienceYears: '', bio: '' })
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  async function submit(event) {
    event.preventDefault()
    try {
      await onCreate({ name: form.name, specialization: form.specialization, qualifications: form.qualifications.split(',').map((item) => item.trim()).filter(Boolean), ...(form.experienceYears ? { experienceYears: Number(form.experienceYears) } : {}), bio: form.bio })
      setAdding(false); setForm({ name: '', specialization: '', qualifications: '', experienceYears: '', bio: '' })
    } catch (error) { onError(error.message) }
  }
  return <><PageHeading title="Care team" description="Manage the professionals patients will meet at your clinic." action={<Button onClick={() => setAdding(true)}><Icon name="plus" size={16}/>Add professional</Button>}/>
    {doctors.length ? <div className="doctor-grid">{doctors.map((doctor) => <article className="panel doctor-card" key={doctor._id}><div className="doctor-card-top"><div className="doctor-avatar">{doctor.photoUrl ? <img src={doctor.photoUrl} alt={doctor.name}/> : getInitials(doctor.name)}</div><button className="plain-link" onClick={() => onToggle(doctor, !doctor.isActive)}>{doctor.isActive ? 'Deactivate' : 'Activate'}</button></div><div className="doctor-card-info"><span className="eyebrow">{doctor.specialization || 'CARE PROFESSIONAL'}</span><h3>{doctor.name}</h3><p>{doctor.qualifications?.join(' · ') || 'Qualifications not added'}</p><small>{doctor.experienceYears ? `${doctor.experienceYears} years of experience` : 'Experience not specified'}</small></div><div className="doctor-card-bottom"><StatusChip tone={doctor.isActive ? 'black' : 'neutral'}>{doctor.isActive ? 'Active' : 'Inactive'}</StatusChip><span>{schedules.filter((item) => String(item.doctorId) === String(doctor._id) && item.isActive).length} shifts · {offerings.filter((item) => String(item.doctorId?._id || item.doctorId) === String(doctor._id) && item.isActive).length} services</span></div></article>)}</div> : <section className="panel"><EmptyState title="No care professionals yet" body="Add a professional to start configuring services and availability." action="Add professional" onAction={() => setAdding(true)}/></section>}
    {adding && <Modal eyebrow="CARE TEAM" title="Add professional" onClose={() => setAdding(false)}><form className="stack-form" onSubmit={submit}><Field label="Full name" value={form.name} onChange={update('name')} required minLength={2}/><Field label="Specialization" value={form.specialization} onChange={update('specialization')} placeholder="Family medicine"/><Field label="Qualifications" value={form.qualifications} onChange={update('qualifications')} placeholder="MBBS, MD" hint="Separate qualifications with commas."/><Field label="Years of experience" type="number" min="0" max="70" value={form.experienceYears} onChange={update('experienceYears')}/><label className="field"><span>Introduction</span><textarea rows="3" value={form.bio} onChange={update('bio')} placeholder="A short professional introduction"/></label><ModalActions busy={busy} onCancel={() => setAdding(false)} submit="Add professional"/></form></Modal>}
  </>
}
