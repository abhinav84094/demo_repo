import { useState } from 'react'
import { Button, Field, PageHeading, StatusChip } from '../components/ui/index.jsx'

const omitBlank = (value) => Object.fromEntries(Object.entries(value || {}).filter(([, item]) => item !== '' && item !== undefined))

export default function ClinicProfilePage({ clinic, busy, onSave }) {
  const [form, setForm] = useState(clinic)
  if (!form) return null
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const setNested = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }))
  function submit(event) {
    event.preventDefault()
    onSave({ name: form.name, description: form.description || '', timezone: form.timezone || 'Asia/Kolkata', contact: omitBlank(form.contact), address: omitBlank(form.address), branding: omitBlank(form.branding) })
  }
  return <><PageHeading title="Clinic profile" description="Maintain the information patients see on your clinic page." action={<StatusChip tone={clinic.status === 'active' ? 'black' : 'neutral'}>{clinic.status === 'active' ? 'Published' : 'Draft'}</StatusChip>}/>
    <section className="panel form-panel"><div className="panel-heading"><div><span className="eyebrow">CLINIC DETAILS</span><h2>Practice information</h2><p>Your clinic link is created once and cannot be changed here.</p></div></div><form onSubmit={submit}><div className="form-grid"><Field label="Clinic name" value={form.name || ''} onChange={(event) => set('name', event.target.value)} required/><Field label="Clinic link" value={`careloop.health/${form.slug}`} readOnly/><label className="field field-wide"><span>Introduction</span><textarea rows="4" value={form.description || ''} onChange={(event) => set('description', event.target.value)} placeholder="A short introduction to your practice"/></label><Field label="Phone" type="tel" value={form.contact?.phone || ''} onChange={(event) => setNested('contact', 'phone', event.target.value)} placeholder="+919876543210"/><Field label="Email" type="email" value={form.contact?.email || ''} onChange={(event) => setNested('contact', 'email', event.target.value)} placeholder="hello@clinic.com"/><Field label="Street address" value={form.address?.line1 || ''} onChange={(event) => setNested('address', 'line1', event.target.value)}/><Field label="Address line 2" value={form.address?.line2 || ''} onChange={(event) => setNested('address', 'line2', event.target.value)}/><Field label="City" value={form.address?.city || ''} onChange={(event) => setNested('address', 'city', event.target.value)}/><Field label="State" value={form.address?.state || ''} onChange={(event) => setNested('address', 'state', event.target.value)}/><Field label="Postal code" value={form.address?.postalCode || ''} onChange={(event) => setNested('address', 'postalCode', event.target.value)}/><Field label="Time zone" value={form.timezone || 'Asia/Kolkata'} onChange={(event) => set('timezone', event.target.value)} hint="Used for appointment availability."/></div><div className="form-actions"><span className="muted small-text">Changes appear on your public page.</span><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></div></form></section>
  </>
}
