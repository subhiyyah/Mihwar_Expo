import Words from "./Words";import { useEffect, useRef } from 'react';
import FigmaAsset from '../welcome/FigmaAsset';
import icons from './icons.json';
import { statusLabels } from './client';
import { usePortal } from './state';
import english from './english.json';

export function Icon({ name, size = 22 }) {
  const path = icons[`imgIcon${name}`] || icons[`img${name}`];
  if (!path) return null;
  return <span className="portal-icon" style={{ width: size, height: size }} aria-hidden="true"><FigmaAsset src={path} /></span>;
}
export function Button({ children, variant = 'primary', busy = false, className = '', ...props }) {
  return <button type="button" className={`p-btn ${variant} ${className}`} {...props} disabled={props.disabled || busy}><Words>{busy && <span className="p-spinner" />}</Words><Words>{children}</Words></button>;
}
export function Card({ children, className = '', ...props }) {return <section className={`p-card ${className}`} {...props}><Words>{children}</Words></section>;}
export function Badge({ value, children }) {
  const success = ['ACTIVE', 'PAID', 'SUCCESS', 'VERIFIED', 'READY'].includes(value);
  const warning = ['PENDING', 'UNPAID', 'DELAYED'].includes(value);
  const error = ['FAILED', 'CANCELLED', 'REJECTED', 'INACTIVE', 'SUSPENDED'].includes(value);
  return <span className={`p-badge ${success ? 'success' : warning ? 'warning' : error ? 'error' : 'brand'}`}><Words>{children || statusLabels[value] || value || '—'}</Words></span>;
}
export function Field({ label, hint, error, children, ...props }) {
  return <label className="p-field"><span><Words>{label}</Words><Words>{props.required && ' *'}</Words></span><Words>{children || <input {...props} aria-invalid={!!error} />}</Words><Words>{(error || hint) && <small className={error ? 'p-field-error' : ''}><Words>{error || hint}</Words></small>}</Words></label>;
}
export function PageHeading({ title, description, children }) {return <div className="p-heading"><div><h1><Words>{title}</Words></h1><Words>{description && <p><Words>{description}</Words></p>}</Words></div><div className="p-actions"><Words>{children}</Words></div></div>;}
export function StateBlock({ kind = 'empty', title, message, onRetry, children }) {
  return <div className={`p-state ${kind}`} role={kind === 'error' ? 'alert' : 'status'}><span className="p-state-icon"><Icon name={kind === 'error' ? 'Alert' : 'Info'} size={30} /></span><h2><Words>{title || (kind === 'error' ? 'تعذر تحميل البيانات' : 'لا توجد بيانات بعد')}</Words></h2><Words>{message && <p><Words>{message}</Words></p>}</Words><Words>{onRetry && <Button variant="secondary" onClick={onRetry}><Words>إعادة المحاولة</Words></Button>}</Words><Words>{children}</Words></div>;
}
export function ResourceState({ resource, empty, children }) {
  if (resource.loading) return <div className="p-skeletons" aria-label="جارٍ التحميل" role="status"><Words>{[1, 2, 3].map((x) => <div className="p-skeleton" key={x} />)}</Words></div>;
  if (resource.error) return <StateBlock kind="error" message={resource.error} onRetry={resource.refresh} />;
  if (empty) return <StateBlock title={typeof empty === 'string' ? empty : undefined} />;
  return children;
}
export function Modal({ title, children, onClose, busy = false, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const body = document.body;const overflow = body.style.overflow;body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {body.style.overflow = overflow;previous?.focus?.();};
  }, []);
  const keyboard = (event) => {
    if (event.key === 'Escape' && !busy) onClose();
    if (event.key !== 'Tab') return;
    const targets = [...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter((el) => el.getClientRects().length);
    if (!targets.length) {event.preventDefault();return;}
    if (event.shiftKey && document.activeElement === targets[0]) {event.preventDefault();targets.at(-1).focus();} else
    if (!event.shiftKey && document.activeElement === targets.at(-1)) {event.preventDefault();targets[0].focus();}
  };
  return <div className="p-modal-backdrop" onClick={(event) => {if (event.target === event.currentTarget && !busy) onClose();}}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="p-dialog-title" className={`p-modal ${wide ? 'wide' : ''}`} onKeyDown={keyboard}><button className="p-modal-close" onClick={onClose} disabled={busy} aria-label="إغلاق"><Words>×</Words></button><h2 id="p-dialog-title"><Words>{title}</Words></h2><Words>{children}</Words></section></div>;
}
export function Confirm({ title = 'تأكيد الإجراء', message, onConfirm, onClose, busy, danger = false }) {
  return <Modal title={title} onClose={onClose} busy={busy}><p><Words>{message}</Words></p><div className="p-actions"><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} busy={busy}><Words>تأكيد</Words></Button><Button variant="secondary" onClick={onClose} disabled={busy}><Words>إلغاء</Words></Button></div></Modal>;
}
export function Table({ columns, rows, rowKey = (row) => row.id, empty = 'لا توجد عناصر' }) {
  const { language } = usePortal();
  if (!rows.length) return <StateBlock title={empty} />;
  return <div className="p-table-wrap"><table className="p-table"><thead><tr><Words>{columns.map((col) => <th key={col.key}><Words>{col.label}</Words></th>)}</Words></tr></thead><tbody><Words>{rows.map((row) => <tr key={rowKey(row)}><Words>{columns.map((col) => <td key={col.key} data-label={language === 'en' ? english[col.label] || col.label : col.label}><Words>{col.render ? col.render(row) : row[col.key] ?? '—'}</Words></td>)}</Words></tr>)}</Words></tbody></table></div>;
}
export function Tabs({ options, value, onChange }) {return <div className="p-tabs" aria-label="تصفية"><Words>{options.map(([id, label]) => <button type="button" key={id} className={id === value ? 'active' : ''} aria-pressed={id === value} onClick={() => onChange(id)}><Words>{label}</Words></button>)}</Words></div>;}
export function Money({ value }) {return <b className="p-money"><span dir="ltr"><Words>{Number(value || 0).toFixed(2)}</Words></span><Words> ر.س</Words></b>;}
