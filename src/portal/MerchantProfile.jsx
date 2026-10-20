import Words from "./Words";import { backend } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Badge, Button, Card, Field, PageHeading, ResourceState } from './ui';

export default function MerchantProfile() {
  const { session, refreshAccount } = usePortal();
  const resource = useResource(`seller-profile/${session.id}`, async () => (await backend.sellers()).find((s) => s.id === session.id));
  const mutation = useMutation();
  const save = (e) => {
    e.preventDefault();const body = Object.fromEntries(new FormData(e.currentTarget));
    for (const key of ['business_name', 'email', 'phone', 'commercial_register']) body[key] = body[key].trim();
    mutation.run(() => backend.put(`/seller/update/${session.id}`, body), async () => {await refreshAccount();resource.refresh();});
  };
  return <><PageHeading title="بيانات المؤسسة" description="تحديث بيانات المنشأة المسجلة في النظام." /><ResourceState resource={resource}><Words>{resource.data && <Card className="p-narrow"><div className="p-actions"><Badge value={resource.data.verification_status} /><Badge value={resource.data.status} /></div><form className="p-form" onSubmit={save} key={resource.data.updated_at}>
    <Field label="اسم المؤسسة" name="business_name" defaultValue={resource.data.business_name} required maxLength={150} />
    <Field label="البريد الإلكتروني" name="email" defaultValue={resource.data.email} type="email" required maxLength={150} />
    <Field label="رقم الجوال" name="phone" defaultValue={resource.data.phone} required pattern="[0-9]{10}" inputMode="numeric" maxLength={10} />
    <Field label="السجل التجاري" name="commercial_register" defaultValue={resource.data.commercial_register} required maxLength={50} />
    <Field label="كلمة المرور" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} hint="أدخلي كلمة المرور المطلوبة للحساب عند حفظ البيانات." />
    <p className="p-notice"><Words>تعديل بيانات المؤسسة قد يعيدها إلى انتظار الاعتماد وفق سياسة الخادم.</Words></p><Button type="submit" busy={mutation.busy}><Words>حفظ التعديلات</Words></Button>
  </form></Card>}</Words></ResourceState></>;
}
