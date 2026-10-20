import Words from "./Words";import { useState } from 'react';
import { backend, dateText, list } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Badge, Button, Confirm, Field, Modal, Money, PageHeading, ResourceState, Table } from './ui';
import Receipt from './Receipt';

const readCreated = (id) => {try {return JSON.parse(localStorage.getItem(`expo-invoices-${id}`)) || [];} catch {return [];}};
export default function Invoices() {
  const { session } = usePortal();
  const [created, setCreated] = useState(() => readCreated(session.id));
  const resource = useResource(`invoices/${session.id}/${created.join(',')}`, async () => {
    const [invoices, orders] = await Promise.all([backend.get('/invoices/get'), backend.get(`/orders/restaurant/${session.id}`)]);
    const ids = new Set(list(orders).map((o) => o.orderId));
    return list(invoices).filter((i) => ids.has(i.orderId) || created.includes(i.invoiceNumber));
  });
  const [editor, setEditor] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [removing, setRemoving] = useState(null);
  const mutation = useMutation();
  const save = (e) => {
    e.preventDefault();const f = new FormData(e.currentTarget);
    const body = { invoice_number: editor.invoiceNumber || `INV-${crypto.randomUUID().slice(0, 18)}`, description: String(f.get('description')).trim(), subtotal: Number(f.get('subtotal')), tax_amount: Number(f.get('tax_amount')), qr_token: editor.qrToken || crypto.randomUUID(), user_id: f.get('user_id') ? Number(f.get('user_id')) : null, expires_at: f.get('expires_at') || null };
    mutation.run(() => editor.invoiceId ? backend.put(`/invoices/update/${editor.invoiceId}`, body) : backend.post(`/invoices/add/${session.id}`, body), () => {
      const next = [...new Set([...created, body.invoice_number])];setCreated(next);localStorage.setItem(`expo-invoices-${session.id}`, JSON.stringify(next));setEditor(null);resource.refresh();
    });
  };
  return <><PageHeading title="الفواتير اليدوية"><Button onClick={() => setEditor({})}><Words>فاتورة جديدة</Words></Button><Button variant="secondary" onClick={resource.refresh}><Words>تحديث</Words></Button></PageHeading>
    <p className="p-caption"><Words>تظهر فواتير طلبات المؤسسة والفواتير التي أنشأتها من هذه الواجهة.</Words></p><ResourceState resource={resource}><Table rows={resource.data || []} rowKey={(i) => i.invoiceId} empty="لا توجد فواتير معروضة" columns={[
      { key: 'invoiceNumber', label: 'رقم الفاتورة' }, { key: 'description', label: 'الوصف' }, { key: 'createdAt', label: 'التاريخ', render: (i) => dateText(i.createdAt) },
      { key: 'totalAmount', label: 'المبلغ', render: (i) => <Money value={i.totalAmount} /> }, { key: 'status', label: 'الحالة', render: (i) => <Badge value={i.status} /> },
      { key: 'actions', label: 'الإجراء', render: (i) => <div className="p-actions"><button className="p-link" onClick={() => setReceipt(i)}><Words>عرض</Words></button><Words>{i.orderId == null && i.status === 'PENDING' && <><button className="p-link" onClick={() => setEditor(i)}><Words>تعديل</Words></button><button className="p-link danger" onClick={() => setRemoving(i)}><Words>حذف</Words></button></>}</Words></div> }]
      } /></ResourceState>
    {editor && <Modal title={editor.invoiceId ? 'تعديل الفاتورة' : 'فاتورة جديدة'} onClose={() => setEditor(null)} busy={mutation.busy}><form className="p-form" onSubmit={save}>
      <Field label="الوصف" name="description" required maxLength={255} defaultValue={editor.description || ''} />
      <div className="p-grid two"><Field label="المبلغ قبل الضريبة" name="subtotal" type="number" required min="0" step="0.01" defaultValue={editor.subtotal || ''} /><Field label="الضريبة" name="tax_amount" type="number" required min="0" step="0.01" defaultValue={editor.taxAmount || 0} /></div>
      <Field label="رقم المستخدم (اختياري)" name="user_id" type="number" min="1" />
      <Field label="تاريخ الانتهاء (اختياري)" name="expires_at" type="datetime-local" defaultValue={editor.expiresAt?.slice(0, 16) || ''} />
      <p className="p-caption"><Words>إنشاء الفاتورة لا يعني دفعها، ويُعرض وضعها كما يعيده الخادم.</Words></p><div className="p-actions"><Button type="submit" busy={mutation.busy}><Words>حفظ</Words></Button><Button variant="secondary" disabled={mutation.busy} onClick={() => setEditor(null)}><Words>إلغاء</Words></Button></div>
    </form></Modal>}
    {removing && <Confirm danger title="حذف الفاتورة" message={`حذف الفاتورة ${removing.invoiceNumber}؟`} onClose={() => setRemoving(null)} busy={mutation.busy} onConfirm={() => mutation.run(() => backend.delete(`/invoices/delete/${removing.invoiceId}`), () => {setRemoving(null);resource.refresh();}, 'تم حذف الفاتورة')} />}
    {receipt && <Receipt invoice={receipt} onClose={() => setReceipt(null)} />}
  </>;
}
