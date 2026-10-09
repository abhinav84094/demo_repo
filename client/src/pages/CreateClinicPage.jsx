import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { Button, Field, Icon } from '../components/ui/index.jsx'
import Brand from '../components/ui/Brand.jsx'

export default function CreateClinicPage({ onCreated, onCancel }) {
  const [form, setForm] = useState({ name: '', slug: '', description: '', billingCycle: 'monthly', timezone: 'Asia/Kolkata' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [slugState, setSlugState] = useState(null)
  useEffect(() => {
    if (!form.slug) return
    const timer = setTimeout(() => api(`/clinics/slug-availability?slug=${encodeURIComponent(form.slug)}`).then(setSlugState).catch(() => setSlugState(null)), 350)
    return () => clearTimeout(timer)
  }, [form.slug])
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await api('/clinics', { method: 'POST', body: JSON.stringify({ ...form, contact: {}, address: {} }) })
      await onCreated(result.clinic)
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  return <main className="create-page"><header className="create-header"><Brand/><button className="plain-link" onClick={onCancel}>Back to workspace</button></header><section className="create-card"><span className="eyebrow">NEW CLINIC</span><h1>Set up your clinic</h1><p className="muted">Add the basics now. You can complete the clinic profile later.</p>
    <form className="stack-form" onSubmit={submit}><Field label="Clinic name" value={form.name} onChange={update('name')} placeholder="Willow Family Clinic" required/>
      <label className="field"><span>Clinic link</span><div className="slug-input"><span>careloop.health/</span><input value={form.slug} onChange={update('slug')} placeholder="willow-family" required/><span>{form.slug && slugState?.available ? '✓' : form.slug && slugState && !slugState.available ? '×' : ''}</span></div>{form.slug && slugState?.message && <small>{slugState.message}</small>}</label>
      <label className="field"><span>Short introduction</span><textarea rows="3" value={form.description} onChange={update('description')} placeholder="A few words about the care you provide"/></label>
      <label className="field"><span>Billing cycle</span><select value={form.billingCycle} onChange={update('billingCycle')}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
      {error && <div className="form-alert error-alert">{error}</div>}<Button type="submit" disabled={busy} className="full-button">{busy ? 'Creating clinic…' : 'Create clinic'}<Icon name="arrow" size={16}/></Button>
    </form></section></main>
}
