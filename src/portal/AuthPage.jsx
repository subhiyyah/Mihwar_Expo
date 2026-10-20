import Words from "./Words";import { useState } from 'react';
import Brand from '../welcome/Brand';
import { backend, problem, routeTo } from './client';
import { usePortal } from './state';
import { Badge, Button, Card, Field, StateBlock } from './ui';
import './portal.css';

export default function AuthPage({ mode }) {
  const { login, language, setLanguage } = usePortal();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const seller = mode === 'merchant-register';
  const register = mode.endsWith('register');
  const submit = async (e) => {
    e.preventDefault();if (busy) return;setError('');setBusy(true);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    for (const key of Object.keys(body)) if (key !== 'password') body[key] = body[key].trim();
    try {
      const data = await backend.post(register ? `/auth/register/${seller ? 'restaurant' : 'user'}` : '/auth/login/user', body);
      if (!data?.id) throw new Error('Missing account');
      if (seller) {setPending(true);return;}
      if (!register && mode === 'admin-login' && data.role !== 'ADMIN') {setError('هذا الحساب لا يملك دور المشرف');return;}
      login(data);routeTo(data.role === 'ADMIN' ? 'admin/pending' : data.role === 'CAREGIVER' ? 'clinic' : 'visitor/home');
    } catch (e) {setError(problem(e));} finally {setBusy(false);}
  };
  return <div className="portal" dir={language === 'ar' ? 'rtl' : 'ltr'}><header className="p-auth-header"><a href="#home"><Brand light /></a><div className="p-actions"><a href={seller ? '#visitor-login' : '#merchant-login'}><Words>{seller ? 'دخول الزائر' : 'للتجار'}</Words></a><button className="p-link" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}><Words>{language === 'ar' ? 'EN' : 'العربية'}</Words></button></div></header><main className="p-auth-body">
    <Words>{pending ? <Card className="p-auth-card seller"><StateBlock title="تم تقديم طلب التسجيل" message="مؤسستك بانتظار اعتماد الإدارة. يمكنك الدخول بعد الاعتماد."><Badge value="PENDING" /><Button onClick={() => routeTo('merchant-login')}><Words>العودة للدخول</Words></Button></StateBlock></Card> : <Card className={`p-auth-card ${seller ? 'seller' : ''}`}><h1><Words>{register ? seller ? 'تسجيل المؤسسة' : 'إنشاء حساب' : 'دخول الإدارة'}</Words></h1><p className="p-muted"><Words>{register ? seller ? 'سجّلي بيانات المنشأة لإرسال طلب الاعتماد.' : 'حساب واحد لجواز إكسبو والطلب والمحفظة.' : 'بالبريد الإلكتروني وكلمة المرور المسجلين.'}</Words></p>
      <form className="p-form" onSubmit={submit}>
        <Words>{register && <Field label={seller ? 'اسم المؤسسة' : 'اسم المستخدم'} name={seller ? 'business_name' : 'username'} maxLength={seller ? 150 : 100} required autoComplete="organization" />}</Words>
        <Field label="البريد الإلكتروني" name="email" type="email" required autoComplete="username" maxLength={150} />
        <Words>{register && <Field label="رقم الجوال" name="phone" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} hint="10 أرقام" />}</Words>
        <Words>{seller && <Field label="السجل التجاري" name="commercial_register" required maxLength={50} />}</Words>
        <Field label="كلمة المرور" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : undefined} maxLength={72} hint={register ? 'من 8 إلى 72 حرفًا' : undefined} />
        <Words>{error && <p className="p-notice error" role="alert"><Words>{error}</Words></p>}</Words>
        <Button type="submit" busy={busy} className="full"><Words>{register ? seller ? 'إرسال طلب التسجيل' : 'إنشاء الحساب' : 'دخول'}</Words></Button>
        <p className="p-caption"><Words>{register ? 'لديك حساب؟' : 'العودة إلى'}</Words> <a href={seller ? '#merchant-login' : '#visitor-login'}><Words>تسجيل الدخول</Words></a></p>
      </form></Card>}</Words>
  </main></div>;
}
