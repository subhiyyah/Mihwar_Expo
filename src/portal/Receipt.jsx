import Words from "./Words";import { useEffect, useRef } from 'react';
import { dateText } from './client';
import { Button, Modal, Money } from './ui';

let qrLoader;
export function QrCode({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    let alive = true;
    if (!qrLoader) qrLoader = new Promise((resolve, reject) => {
      if (window.QRCode) {resolve();return;}
      const script = document.createElement('script');script.src = '/vendor/qrcode.min.js';script.onload = resolve;script.onerror = reject;document.head.appendChild(script);
    });
    qrLoader.then(() => {
      if (!alive || !ref.current) return;
      ref.current.replaceChildren();
      new window.QRCode(ref.current, { text: String(value), width: 160, height: 160, colorDark: '#17182f', colorLight: '#ffffff' });
    }).catch(() => {if (alive && ref.current) ref.current.textContent = String(value);});
    return () => {alive = false;};
  }, [value]);
  return <div ref={ref} className="p-receipt-qr" aria-label="رمز الفاتورة" />;
}
export default function Receipt({ invoice, onClose }) {
  return <Modal title={`إيصال ${invoice.orderId ? `الطلب #${invoice.orderId}` : 'الفاتورة'}`} onClose={onClose}>
    <dl className="p-description"><Words>{[['رقم الإيصال', invoice.invoiceNumber], ['الوصف', invoice.description], ['المؤسسة', invoice.sellerName], ['تاريخ الدفع', dateText(invoice.paidAt)], ['الحالة', invoice.status]].map(([label, value]) => <div key={label}><dt><Words>{label}</Words></dt><dd><Words>{value || '—'}</Words></dd></div>)}</Words></dl>
    <hr className="p-rule" /><div className="p-row"><span><Words>{Number(invoice.discountAmount) > 0 ? 'المبلغ قبل الخصم' : 'المبلغ قبل الضريبة'}</Words></span><Money value={invoice.subtotal} /></div>{Number(invoice.discountAmount) > 0 && <div className="p-row"><span><Words>خصم محفظة محور</Words> ({invoice.walletDiscountPercentage}%)</span><span>− <Money value={invoice.discountAmount} /></span></div>}<div className="p-row"><span><Words>الضريبة</Words></span><Money value={invoice.taxAmount} /></div><div className="p-row"><h3><Words>الإجمالي</Words></h3><Money value={invoice.totalAmount} /></div>
    <Words>{invoice.qrToken && <div className="p-receipt-qr-wrap"><QrCode value={invoice.qrToken} /><small className="p-caption"><Words>رمز الفاتورة</Words></small></div>}</Words>
    <div className="p-actions"><Button onClick={() => window.print()}><Words>طباعة</Words></Button><Button variant="secondary" onClick={onClose}><Words>إغلاق</Words></Button></div>
  </Modal>;
}
