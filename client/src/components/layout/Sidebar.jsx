import Brand from '../ui/Brand.jsx'
import { getInitials } from '../../lib/api.js'
import { Icon } from '../ui/index.jsx'

const navigation = [
  { id: 'overview', label: 'Overview', icon: 'grid', group: 'WORKSPACE' },
  { id: 'clinic', label: 'Clinic profile', icon: 'clinic', group: 'MANAGE' },
  { id: 'team', label: 'Care team', icon: 'people', group: 'MANAGE' },
  { id: 'services', label: 'Services & fees', icon: 'services', group: 'MANAGE' },
  { id: 'schedule', label: 'Availability', icon: 'calendar', group: 'MANAGE' },
  { id: 'website', label: 'Public website', icon: 'globe', group: 'PUBLISH' },
]

export default function Sidebar({ clinic, clinics, clinicId, user, section, onClinicChange, onNavigate, onSignOut, open, onClose }) {
  return <>
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}><div className="side-top"><Brand/><button className="mobile-close" onClick={onClose} aria-label="Close menu"><Icon name="close"/></button></div>
      <label className="clinic-switcher"><span className="switcher-avatar">{getInitials(clinic?.name || 'C')}</span><span className="switcher-copy"><strong>{clinic?.name || 'Select clinic'}</strong><small>{clinic?.status === 'active' ? 'Published' : 'Setup in progress'}</small></span><span className="switcher-chevron">⌄</span><select aria-label="Switch clinic" value={clinicId} onChange={(event) => onClinicChange(event.target.value)}>{clinics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <nav className="side-nav">{['WORKSPACE', 'MANAGE', 'PUBLISH'].map((group) => <div className="nav-group" key={group}><span className="nav-group-title">{group}</span>{navigation.filter((item) => item.group === group).map((item) => <button key={item.id} className={`nav-item ${section === item.id ? 'nav-active' : ''}`} onClick={() => onNavigate(item.id)}><Icon name={item.icon} size={17}/><span>{item.label}</span>{item.id === 'website' && clinic?.status === 'active' && <i className="nav-live-dot"/>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><strong>Need a hand?</strong><p>Clinic setup, services, and availability.</p><button onClick={() => onNavigate('clinic')}>Review clinic setup <Icon name="arrow" size={13}/></button></div><button className="profile-row" onClick={onSignOut}><span className="profile-avatar">{getInitials(user?.name)}</span><span className="profile-copy"><strong>{user?.name}</strong><small>Sign out</small></span><Icon name="logout" size={16}/></button></div>
    </aside>
    {open && <button className="nav-scrim" onClick={onClose} aria-label="Close menu"/>}
  </>
}

export function Topbar({ section, user, onMenu, onSignOut }) {
  const labels = { overview: 'Overview', clinic: 'Clinic profile', team: 'Care team', services: 'Services & fees', schedule: 'Availability', website: 'Public website' }
  return <header className="topbar"><button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Icon name="menu"/></button><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14}/><strong>{labels[section]}</strong></div><div className="topbar-right"><span className="today-label">{new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span><button className="top-avatar" onClick={onSignOut} title={`Sign out ${user?.name}`}>{getInitials(user?.name)}</button></div></header>
}
