import Icon from './Icon.jsx'

export { Icon }

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

export function Field({ label, hint, ...props }) {
  return <label className="field"><span>{label}</span><input {...props}/>{hint && <small>{hint}</small>}</label>
}

export function Panel({ title, eyebrow, action, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}{title && <h2>{title}</h2>}</div>{action}</div>{children}</section>
}

export function PageHeading({ eyebrow = 'CLINIC WORKSPACE', title, description, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

export function EmptyState({ title, body, action, onAction }) {
  return <div className="empty-state"><span className="empty-symbol">□</span><h3>{title}</h3><p>{body}</p>{action && <Button variant="outline" onClick={onAction}><Icon name="plus" size={15}/>{action}</Button>}</div>
}

export function StatusChip({ children, tone = 'neutral' }) {
  return <span className={`status-chip chip-${tone}`}><i/>{children}</span>
}

export function Modal({ title, eyebrow, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div>{children}</section></div>
}

export function ModalActions({ busy, onCancel, submit = 'Save changes' }) {
  return <div className="modal-actions"><Button variant="outline" type="button" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : submit}<Icon name="arrow" size={14}/></Button></div>
}

export function Toast({ message }) {
  return message ? <div className="toast-message"><span><Icon name="check" size={15}/></span>{message}</div> : null
}

export function Alert({ children, onClose }) {
  return children ? <div className="global-error"><span>{children}</span><button onClick={onClose} aria-label="Dismiss"><Icon name="close" size={15}/></button></div> : null
}
