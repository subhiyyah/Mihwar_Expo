import { healthGroups } from "./healthFields";
import HealthField from "./HealthField";
import { VisitorAssistance } from "./ParamedicRequests";
import Words from "./Words";import { useState } from 'react';
import { backend, safeLink } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Button, Card, Confirm, Field, PageHeading, ResourceState, StateBlock } from './ui';

export function Profile() {
  const { session, refreshAccount } = usePortal();
  const data = useResource(`profile-${session.id}`, () => backend.account(session.id));
  const mutation = useMutation();
  return <><PageHeading title="ملفي الشخصي" description="بيانات حسابك في محور" /><a className="p-btn secondary" href="#visitor/digital-documents">الوثائق الرقمية الاختيارية</a><ResourceState resource={data}><Words>{data.data && <Card><form className="p-form" key={JSON.stringify(data.data)} onSubmit={(event) => {
            event.preventDefault();const fields = Object.fromEntries(new FormData(event.currentTarget));
            void mutation.run(() => backend.put(`/users/updateUser/${session.id}`, { ...fields, role: data.data.role, status: data.data.status }), async () => {await refreshAccount();data.refresh();});
          }}><Field label="اسم المستخدم" name="username" defaultValue={data.data.username} required /><Field label="البريد الإلكتروني" name="email" type="email" defaultValue={data.data.email} required /><Field label="رقم الجوال" name="phone" defaultValue={data.data.phone} required /><Field label="كلمة مرور جديدة" name="password" type="password" minLength={8} maxLength={72} required autoComplete="new-password" hint="حفظ الملف الشخصي يتطلب إدخال كلمة مرور جديدة." /><Button type="submit" busy={mutation.busy}><Words>حفظ التغييرات</Words></Button></form></Card>}</Words></ResourceState></>;
}

export function Documents() {
  const { session, refreshAccount } = usePortal();
  const resource = useResource(`documents-${session.id}`, async () => ({documents: await backend.get(`/documents/user/${session.id}`)}));
  const mutation = useMutation();
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const refresh = async () => {await refreshAccount();resource.refresh();setEditing(null);setRemoving(null);};
  return <><PageHeading title="تذاكري وتصاريحي" description="احتفظي بروابط وثائقك للرجوع إليها أثناء الزيارة."><Button onClick={() => setEditing({})}><Words>إضافة وثيقة</Words></Button></PageHeading>
    {editing && <Card><h2><Words>{editing.id ? 'تعديل الوثيقة' : 'وثيقة جديدة'}</Words></h2><form className="p-form" onSubmit={(event) => {
        event.preventDefault();const body = Object.fromEntries(new FormData(event.currentTarget));if (!safeLink(body.fileUrl)) return;
        if (!body.expiryDate) body.expiryDate = null;
        void mutation.run(() => editing.id ? backend.put(`/documents/updateDocument/${session.id}/${editing.id}`, body) : backend.post(`/documents/addDocument/${session.id}`, body), refresh);
      }}><Field label="نوع الوثيقة" name="documentType" maxLength={50} defaultValue={editing.documentType || ''} required /><Field label="رابط الوثيقة" name="fileUrl" type="url" maxLength={250} defaultValue={editing.fileUrl || ''} required hint="أدخلي رابطًا محفوظًا على الإنترنت؛ رفع الملفات غير متاح في الخدمة الحالية." /><Field label="تاريخ الانتهاء" name="expiryDate" type="date" defaultValue={editing.expiryDate || ''} /><div className="p-actions"><Button type="submit" busy={mutation.busy}><Words>حفظ</Words></Button><Button variant="secondary" onClick={() => setEditing(null)}><Words>إلغاء</Words></Button></div></form></Card>}
    <ResourceState resource={resource}><div className="p-grid two"><Words>{resource.data?.documents.map((doc) => <Card key={doc.id}><h2><Words>{doc.documentType}</Words></h2><p><Words>تاريخ الانتهاء: </Words><Words>{doc.expiryDate || 'غير محدد'}</Words></p><div className="p-actions"><Words>{safeLink(doc.fileUrl) && <a className="p-btn secondary" href={safeLink(doc.fileUrl)} target="_blank" rel="noopener noreferrer"><Words>عرض الوثيقة</Words></a>}</Words><Button variant="secondary" onClick={() => setEditing(doc)}><Words>تعديل</Words></Button><Button variant="danger" onClick={() => setRemoving(doc)}><Words>حذف</Words></Button></div></Card>)}</Words></div><Words>{resource.data && !resource.data.documents.length && <StateBlock title="لا توجد وثائق محفوظة" />}</Words></ResourceState>
    {removing && <Confirm message="حذف الوثيقة من الحساب؟" danger busy={mutation.busy} onClose={() => setRemoving(null)} onConfirm={() => mutation.run(() => backend.delete(`/documents/deleteDocument/${session.id}/${removing.id}`), refresh)} />}
  </>;
}

// The keys mirror the existing health-card PATCH contract. Empty values clear only edited fields.


export function Health() {
  const { session, refreshAccount, notify } = usePortal();
  const resource = useResource(`health-${session.id}`, () => backend.account(session.id));
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const mutation = useMutation();
  const card = resource.data?.userHealthCard;
  const refresh = async () => {await refreshAccount();resource.refresh();setEditing(false);setRemoving(false);};
  const submit = (event) => {
    event.preventDefault();const form = new FormData(event.currentTarget);const body = {};
    for (const [key, label, max, kind] of healthGroups.flatMap(group => group[1])) {
      const raw = String(form.get(key) || '').trim();
      if (kind === 'set' ? raw.split('\n').some(item => item.trim().length > max) : raw.length > max) {
        notify(`تجاوزت القيمة الحد المسموح في حقل ${label}`, 'error');return;
      }
    }
    healthGroups.flatMap((group) => group[1]).forEach(([key,,, kind]) => {
      const value = String(form.get(key) || '').trim();
      const next = kind === 'set' ? [...new Set(value.split('\n').map((x) => x.trim()).filter(Boolean))] : value || null;
      if (!card || JSON.stringify(next) !== JSON.stringify(card[key] ?? (kind === 'set' ? [] : null))) body[key] = next;
    });
    void mutation.run(() => card ? backend.patch(`/health-cards/updateHealthCard/${session.id}/${card.id}`, body) : backend.post(`/health-cards/addHealthCard/${session.id}`, body), refresh);
  };
  return <><PageHeading title="البطاقة الصحية" description="معلوماتك الصحية واحتياجاتك أثناء الزيارة."><Button onClick={() => setEditing(true)}><Words>{card ? 'تعديل البطاقة' : 'إنشاء البطاقة'}</Words></Button></PageHeading>{session.role === 'USER' && <VisitorAssistance />}<ResourceState resource={resource}>
    <Words>{editing ? <Card><form className="p-form" onSubmit={submit}><Words>{healthGroups.map(([title, fields], index) => <details key={title} open={index === 0}><summary><Words>{title}</Words></summary><div className="p-grid two"><Words>{fields.map(field => <HealthField key={field[0]} field={field} value={card?.[field[0]]} />)}</Words></div></details>)}</Words><div className="p-actions"><Button type="submit" busy={mutation.busy}><Words>حفظ البطاقة</Words></Button><Button variant="secondary" onClick={() => setEditing(false)}><Words>إلغاء</Words></Button></div></form></Card> : card ? <><Card><div className="p-actions"><h2><Words>فصيلة الدم: </Words><span dir="ltr"><Words>{card.bloodType || '—'}</Words></span></h2><a className="p-btn secondary" href={`/api/v1/health-cards/qr/${session.id}`} target="_blank" rel="noopener noreferrer"><Words>عرض رمز المشاركة</Words></a><Button variant="danger" onClick={() => setRemoving(true)}><Words>حذف البطاقة</Words></Button></div><p className="p-caption"><Words>رمز المشاركة يعرض الحقول المتاحة في البطاقة العامة فقط.</Words></p></Card>{healthGroups.map(([title, fields]) => <Card key={title}><h2><Words>{title}</Words></h2><dl className="p-grid two"><Words>{fields.filter(([key]) => card[key]?.length).map(([key, label]) => <div key={key}><dt className="p-muted"><Words>{label}</Words></dt><dd style={{ whiteSpace: 'pre-wrap', margin: 0 }}><Words>{Array.isArray(card[key]) ? card[key].join('، ') : card[key]}</Words></dd></div>)}</Words></dl></Card>)}</> : <StateBlock title="لم تُنشأ بطاقة صحية بعد" />}</Words>
    </ResourceState>{removing && <Confirm message="حذف البطاقة الصحية وإلغاء رابط مشاركتها؟" danger busy={mutation.busy} onClose={() => setRemoving(false)} onConfirm={() => mutation.run(() => backend.delete(`/health-cards/deleteHealthCard/${session.id}/${card.id}`), refresh)} />}</>;
}

export function Settings() {
  const { theme, setTheme, logout } = usePortal();
  return <><PageHeading title="الإعدادات" /><Card><Field label="مظهر الموقع"><select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="system"><Words>حسب الجهاز</Words></option><option value="light"><Words>فاتح</Words></option><option value="dark"><Words>داكن</Words></option></select></Field><Button variant="danger" onClick={logout}><Words>تسجيل الخروج</Words></Button></Card></>;
}
export function Notifications() {
  const { session } = usePortal();
  const resource = useResource(`notifications-${session.id}-${session.role}`, () => backend.get(`/orders/${session.role === 'SELLER' ? 'restaurant' : 'user'}/${session.id}`));
  return <><PageHeading title="متابعة الطلبات" description="الحالة الحالية لطلباتك؛ لا تتوفر خدمة إشعارات فورية في الباك الحالي."><Button variant="secondary" onClick={resource.refresh}><Words>تحديث</Words></Button></PageHeading><ResourceState resource={resource}><Words>{resource.data?.map((order) => <Card key={order.orderId}><h2><Words>طلب #</Words><Words>{order.orderId}</Words></h2><p><Words>{order.sellerName}</Words><Words> · </Words><Words>{order.status}</Words></p></Card>)}</Words></ResourceState></>;
}
