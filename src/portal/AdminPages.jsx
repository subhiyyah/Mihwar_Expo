import Words from "./Words";import { useState } from 'react';
import { backend, list } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Badge, Button, Confirm, Field, Modal, Money, PageHeading, ResourceState, Table } from './ui';
import Receipt from './Receipt';

export function Verification({ pending = false }) {
  const { session } = usePortal();
  const resource = useResource(`verification-${pending}`, () => pending ? backend.get(`/admin/restaurants/pending?adminId=${session.id}`).then(list) : backend.sellers());
  const [action, setAction] = useState(null);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const mutation = useMutation();
  return <><PageHeading title={pending ? 'اعتماد المؤسسات' : 'المؤسسات'}><Words>{!pending && <Button onClick={() => setEditing({})}><Words>إضافة مؤسسة</Words></Button>}</Words><Button variant="secondary" onClick={resource.refresh}><Words>تحديث</Words></Button></PageHeading><ResourceState resource={resource}><Table rows={resource.data || []} columns={[
      { key: 'business_name', label: 'المؤسسة' }, { key: 'email', label: 'البريد الإلكتروني' }, { key: 'phone', label: 'الجوال' }, { key: 'commercial_register', label: 'السجل التجاري' },
      { key: 'verification_status', label: 'الاعتماد', render: (row) => <Badge value={row.verification_status} /> },
      { key: 'actions', label: 'الإجراء', render: (row) => <div className="p-actions"><Words>{['VERIFIED', 'REJECTED', 'PENDING'].filter((status) => status !== row.verification_status).map((status) => <Button key={status} variant={status === 'REJECTED' ? 'danger' : 'secondary'} onClick={() => setAction({ row, status })}><Words>{status === 'VERIFIED' ? 'اعتماد' : status === 'REJECTED' ? 'رفض' : 'إعادة للمراجعة'}</Words></Button>)}</Words><Words>{!pending && <><Button variant="secondary" onClick={() => setEditing(row)}><Words>تعديل</Words></Button><Button variant="danger" onClick={() => setRemoving(row)}><Words>حذف</Words></Button></>}</Words></div> }]
      } /></ResourceState>{action && <Confirm message={`تغيير اعتماد ${action.row.business_name} إلى ${action.status}؟`} busy={mutation.busy} onClose={() => setAction(null)} onConfirm={() => mutation.run(() => backend.patch(`/admin/restaurants/${action.row.id}/verification?adminId=${session.id}&status=${action.status}`), () => {setAction(null);resource.refresh();})} />}
    {editing && <Modal title="بيانات المؤسسة" onClose={() => setEditing(null)} busy={mutation.busy}><form className="p-form" onSubmit={(event) => {event.preventDefault();const body = Object.fromEntries(new FormData(event.currentTarget));void mutation.run(() => editing.id ? backend.put(`/seller/update/${editing.id}`, body) : backend.post('/seller/add', body), () => {setEditing(null);resource.refresh();});}}><Words>{[['business_name', 'اسم المؤسسة', 'text', 150], ['email', 'البريد الإلكتروني', 'email', 150], ['phone', 'رقم الجوال', 'text', 10], ['commercial_register', 'السجل التجاري', 'text', 50], ['password', 'كلمة مرور جديدة', 'password', 72]].map(([key, label, type, max]) => <Field key={key} label={label} name={key} type={type} maxLength={max} minLength={key === 'password' ? 8 : undefined} pattern={key === 'phone' ? '[0-9]{10}' : undefined} defaultValue={editing[key] || ''} required />)}</Words><p className="p-caption"><Words>تحديث المؤسسة المعتمدة يعيدها إلى المراجعة بحسب منطق النظام.</Words></p><Button type="submit" busy={mutation.busy}><Words>حفظ</Words></Button></form></Modal>}
    {removing && <Confirm message="حذف المؤسسة؟ قد يرفض النظام الحذف لوجود فواتير مرتبطة بها." danger busy={mutation.busy} onClose={() => setRemoving(null)} onConfirm={() => mutation.run(() => backend.delete(`/seller/delete/${removing.id}`), () => {setRemoving(null);resource.refresh();})} />}
  </>;
}

export function Users() {
  const resource = useResource('admin-users', backend.users);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const mutation = useMutation();
  return <><PageHeading title="المستخدمون"><Button onClick={() => setEditing({ role: 'USER', status: 'ACTIVE' })}><Words>إضافة مستخدم</Words></Button></PageHeading><ResourceState resource={resource}><Table rows={resource.data || []} columns={[{ key: 'username', label: 'الاسم' }, { key: 'email', label: 'البريد' }, { key: 'phone', label: 'الجوال' }, { key: 'role', label: 'الدور' }, { key: 'status', label: 'الحالة', render: (row) => <Badge value={row.status} /> }, { key: 'actions', label: 'الإجراء', render: (row) => <div className="p-actions"><Button variant="secondary" onClick={() => setEditing(row)}><Words>تعديل</Words></Button><Button variant="danger" onClick={() => setRemoving(row)}><Words>حذف</Words></Button></div> }]} /></ResourceState>
    {editing && <Modal title={editing.id ? 'تعديل المستخدم' : 'إضافة مستخدم'} onClose={() => setEditing(null)} busy={mutation.busy}><form className="p-form" onSubmit={(event) => {event.preventDefault();const body = Object.fromEntries(new FormData(event.currentTarget));void mutation.run(() => editing.id ? backend.put(`/users/updateUser/${editing.id}`, body) : backend.post('/users/addUser', body), () => {setEditing(null);resource.refresh();});}}><Field label="الاسم" name="username" defaultValue={editing.username || ''} required /><Field label="البريد" type="email" name="email" defaultValue={editing.email || ''} required /><Field label="الجوال" name="phone" defaultValue={editing.phone || ''} required /><Field label="كلمة مرور جديدة" name="password" type="password" minLength={8} maxLength={72} required autoComplete="new-password" /><Field label="الدور"><select name="role" defaultValue={editing.role}><Words>{['USER', 'CAREGIVER', 'ADMIN'].map((value) => <option key={value} value={value}><Words>{value}</Words></option>)}</Words></select></Field><Field label="الحالة"><select name="status" defaultValue={editing.status}><option value={"ACTIVE"}><Words>ACTIVE</Words></option><option value={"INACTIVE"}><Words>INACTIVE</Words></option></select></Field><Button type="submit" busy={mutation.busy}><Words>حفظ</Words></Button></form></Modal>}
    {removing && <Confirm message={`حذف حساب ${removing.username}؟ قد يرفض النظام الحذف إذا كان الحساب مرتبطًا بمعاملات.`} danger busy={mutation.busy} onClose={() => setRemoving(null)} onConfirm={() => mutation.run(() => backend.delete(`/users/deleteUser/${removing.id}`), () => {setRemoving(null);resource.refresh();})} />}
  </>;
}

const schemas = {
  content: { title: 'الوجهات', path: '/destinations', fields: [['name', 'الاسم', 'text', true], ['type', 'النوع', ['PAVILION', 'ZONE', 'SERVICE']], ['description', 'الوصف'], ['status', 'الحالة', ['ACTIVE', 'INACTIVE']]] },
  nodes: { title: 'نقاط الخريطة', path: '/map-nodes', fields: [['name', 'الاسم', 'text', true], ['x', 'الإحداثي X', 'number', true], ['y', 'الإحداثي Y', 'number', true], ['nodeType', 'نوع النقطة', ['ENTRY', 'ZONE', 'SERVICE', 'EXIT']], ['destinationId', 'رقم الوجهة', 'number']] },
  edges: { title: 'روابط المسارات', path: '/map-edges', fields: [['startNodeId', 'رقم نقطة البداية', 'number', true], ['endNodeId', 'رقم نقطة النهاية', 'number', true], ['distance', 'المسافة', 'number', true], ['pathType', 'نوع المسار', ['WALK']]] },
  clinics: { title: 'فروع العيادات', path: '/admin/clinic-branches', fields: [['name', 'اسم الفرع', 'text', true], ['zone', 'المنطقة', 'text', true], ['locationDescription', 'وصف الموقع', 'text', true], ['phone', 'الهاتف', 'text', true], ['email', 'البريد', 'email', true], ['openingHours', 'ساعات العمل'], ['servicesDescription', 'الخدمات']] }
};
export function ContentEditor({ kind }) {
  const schema = schemas[kind];
  const { session } = usePortal();
  const suffix = kind === 'clinics' ? `?adminId=${session.id}` : '';
  const resource = useResource(`admin-${kind}`, () => backend.get(schema.path + suffix).then(list));
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const mutation = useMutation();
  const value = (row, key) => key === 'destinationId' ? row.destination?.id : key === 'startNodeId' ? row.startNode?.id : key === 'endNodeId' ? row.endNode?.id : row[key];
  const save = (event) => {
    event.preventDefault();const body = Object.fromEntries(new FormData(event.currentTarget));
    schema.fields.forEach(([key,, type]) => {if (type === 'number') body[key] = body[key] === '' ? null : Number(body[key]);});
    if (kind === 'nodes') {body.destination = body.destinationId ? { id: body.destinationId } : null;delete body.destinationId;}
    if (kind === 'edges') {body.startNode = { id: body.startNodeId };body.endNode = { id: body.endNodeId };delete body.startNodeId;delete body.endNodeId;}
    void mutation.run(() => editing.id ? backend.put(`${schema.path}/${editing.id}${suffix}`, body) : backend.post(schema.path + suffix, body), () => {setEditing(null);resource.refresh();});
  };
  return <><PageHeading title={schema.title}><Button onClick={() => setEditing({})}><Words>إضافة</Words></Button></PageHeading><ResourceState resource={resource}><Table rows={resource.data || []} columns={[{ key: 'id', label: 'الرقم' }, ...schema.fields.map(([key, label]) => ({ key, label, render: (row) => String(value(row, key) ?? '—') })), ...(kind === 'clinics' ? [{ key: 'caregiverId', label: 'رقم مقدم الرعاية' }] : []), { key: 'actions', label: 'الإجراء', render: (row) => <div className="p-actions">{kind === 'clinics' && <Button variant="secondary" onClick={() => setAssigning(row)}><Words>ربط مقدم الرعاية</Words></Button>}<Button variant="secondary" onClick={() => setEditing(row)}><Words>تعديل</Words></Button><Button variant="danger" onClick={() => setRemoving(row)}><Words>حذف</Words></Button></div> }]} /></ResourceState>
    {assigning && <Modal title="ربط مقدم الرعاية بالعيادة" onClose={() => setAssigning(null)} busy={mutation.busy}><p><Words>{assigning.name}</Words></p><form className="p-form" onSubmit={(event) => {
      event.preventDefault(); const raw = new FormData(event.currentTarget).get('caregiverId');
      void mutation.run(() => backend.put(`/paramedic-requests/clinics/${assigning.id}/caregiver?adminId=${session.id}`, { caregiverId: raw ? Number(raw) : null }), () => {setAssigning(null);resource.refresh();});
    }}><Field label="رقم حساب مقدم الرعاية" name="caregiverId" type="number" min="1" step="1" defaultValue={assigning.caregiverId || ''} hint="يجب أن يكون الحساب نشطًا بدور CAREGIVER. اتركيه فارغًا لإلغاء الربط." /><Button type="submit" busy={mutation.busy}><Words>حفظ الربط</Words></Button></form></Modal>}
    {editing && <Modal title={schema.title} onClose={() => setEditing(null)} busy={mutation.busy}><form className="p-form" onSubmit={save}><Words>{schema.fields.map(([key, label, type = 'text', required]) => <Field key={key} label={label}><Words>{Array.isArray(type) ? <select name={key} defaultValue={value(editing, key) || type[0]}><Words>{type.map((option) => <option key={option} value={option}><Words>{option}</Words></option>)}</Words></select> : <input name={key} type={type} required={required} step={type === 'number' ? 'any' : undefined} defaultValue={value(editing, key) ?? ''} />}</Words></Field>)}</Words><Button type="submit" busy={mutation.busy}><Words>حفظ</Words></Button></form></Modal>}
    {removing && <Confirm message="حذف هذا العنصر؟ قد يكون مرتبطًا ببيانات أخرى في النظام." danger busy={mutation.busy} onClose={() => setRemoving(null)} onConfirm={() => mutation.run(() => backend.delete(`${schema.path}/${removing.id}${suffix}`), () => {setRemoving(null);resource.refresh();})} />}
  </>;
}

export function AdminWallets({ merchant = false }) {
  const resource = useResource(`admin-wallets-${merchant}`, async () => {
    if (!merchant) return backend.users();
    return Promise.all((await backend.sellers()).map(async seller => {
      let wallet=null;
      try { wallet=await backend.get(`/seller-wallet/seller/${seller.id}`); }
      catch(error) { if (!/wallet.*not found|no wallet/i.test(error.response?.data?.message || '')) throw error; }
      return { ...seller,username:seller.business_name,wallet };
    }));
  });
  const mutation = useMutation();
  const [action, setAction] = useState(null);
  return <><PageHeading title={merchant ? 'محافظ المؤسسات' : 'محافظ المستخدمين'} /><ResourceState resource={resource}><Table rows={resource.data || []} columns={[{ key: 'username', label: 'المستخدم' }, { key: 'balance', label: 'الرصيد', render: (row) => <Money value={row.wallet?.balance} /> }, { key: 'status', label: 'الحالة', render: (row) => row.wallet ? <Badge value={row.wallet.status} /> : 'لم تُنشأ' }, { key: 'action', label: 'الإجراء', render: (row) => <Button variant="secondary" onClick={() => setAction(row)}><Words>{!row.wallet ? 'إنشاء محفظة' : row.wallet.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}</Words></Button> }]} /></ResourceState>{action && <Confirm message="تأكيد تغيير حالة المحفظة؟" busy={mutation.busy} onClose={() => setAction(null)} onConfirm={() => mutation.run(() => merchant ? (action.wallet ? backend.put(`/seller-wallet/update/${action.wallet.id}?status=${action.wallet.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}`) : backend.post(`/seller-wallet/add/${action.id}`)) : action.wallet ? backend.put(`/wallets/${action.wallet.status === 'ACTIVE' ? 'suspendWallet' : 'activateWallet'}/${action.id}/${action.wallet.id}`) : backend.post(`/wallets/addWallet/${action.id}`), () => {setAction(null);resource.refresh();})} />}</>;
}

export function AdminRecords({ kind }) {
  const invoices = kind === 'invoices';
  const resource = useResource(`admin-records-${kind}`, () => backend.get(invoices ? '/invoices/get' : kind === 'orders' ? '/orders/all' : '/payments/all').then(list));
  const [selected, setSelected] = useState(null);
  return <><PageHeading title={invoices ? 'الفواتير' : kind === 'orders' ? 'جميع الطلبات' : 'المدفوعات'}><Button variant="secondary" onClick={resource.refresh}><Words>تحديث</Words></Button></PageHeading><ResourceState resource={resource}><Table rows={resource.data || []} rowKey={(row) => invoices ? row.invoiceId : kind === 'payments' ? row.paymentId : row.orderId} columns={[{ key: 'number', label: 'الرقم', render: (row) => row.invoiceNumber ?? row.orderId ?? row.paymentId }, { key: 'seller', label: 'المؤسسة', render: (row) => row.sellerName ?? row.storeName ?? '—' }, { key: 'status', label: 'الحالة', render: (row) => <Badge value={row.status} /> }, { key: 'totalAmount', label: 'المبلغ', render: (row) => <Money value={row.totalAmount} /> }, ...(invoices ? [{ key: 'receipt', label: 'الإيصال', render: (row) => <Button variant="secondary" onClick={() => setSelected(row)}><Words>عرض</Words></Button> }] : [])]} /></ResourceState>{selected && <Receipt invoice={selected} onClose={() => setSelected(null)} />}</>;
}
