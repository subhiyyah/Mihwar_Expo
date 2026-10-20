import Words from "./Words";import { useEffect, useState } from 'react';
import Brand from '../welcome/Brand';
import { Icon, Button } from './ui';
import { usePortal } from './state';
import { routeTo } from './client';
import './portal.css';

const visitorLinks = [['home', 'الرئيسية', 'Home'], ['map', 'الخريطة', 'Map'], ['plan', 'خطتي', 'Route'], ['passport', 'جواز إكسبو', 'Passport'], ['sellers', 'المتاجر والمطاعم', 'Utensils'], ['wallet', 'المحفظة', 'Wallet']];
const merchantLinks = [['orders', 'الطلبات', 'Orders'], ['menu', 'المنيو', 'Utensils'], ['wallet', 'المحفظة', 'Wallet'], ['invoices', 'الفواتير اليدوية', 'Receipt'], ['profile', 'بيانات المؤسسة', 'Store']];
const adminLinks = [['digital-documents', 'الوثائق الرقمية', 'File'], ['discounts', 'خصومات المحفظة', 'Wallet'], ['pending', 'اعتماد المؤسسات', 'Shield'], ['sellers', 'المؤسسات', 'Store'], ['users', 'المستخدمون', 'Users'], ['wallets', 'المحافظ', 'Wallet'], ['sellerwallets', 'محافظ المؤسسات', 'Wallet'], ['content', 'الوجهات', 'File'], ['nodes', 'نقاط الخريطة', 'Map'], ['edges', 'روابط المسارات', 'Route'], ['clinics', 'العيادات', 'Shield'], ['orders', 'الطلبات', 'Orders'], ['payments', 'المدفوعات', 'Wallet'], ['invoices', 'الفواتير', 'Receipt']];
const accountLinks = [['digital-documents', 'الوثائق الرقمية'], ['profile', 'ملفي الشخصي'], ['documents', 'تذاكري وتصاريحي'], ['health', 'البطاقة الصحية'], ['orders', 'طلباتي'], ['settings', 'الإعدادات'], ['notifications', 'الإشعارات']];
export default function Shell({ role, page, children }) {
  const { session, account, logout, language, setLanguage, resolvedTheme } = usePortal();
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const isVisitor = role === 'visitor';
  const links = isVisitor ? visitorLinks : role === 'merchant' ? merchantLinks : adminLinks;
  const title = links.find((x) => x[0] === page)?.[1] || 'محور';
  useEffect(() => {
    document.documentElement.classList.add('portal-active');
    return () => document.documentElement.classList.remove('portal-active');
  }, []);
  useEffect(() => {
    const close = (event) => {if (event.key === 'Escape') {setMenu(false);setMobile(false);}};
    addEventListener('keydown', close);
    return () => removeEventListener('keydown', close);
  }, []);
  const go = (path) => {setMenu(false);setMobile(false);routeTo(`${role}/${path}`);};
  return <div className={`portal ${isVisitor ? 'visitor-portal' : 'console-portal'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <Words>{!isVisitor && <><button className={`sidebar-scrim ${mobile ? 'visible' : ''}`} onClick={() => setMobile(false)} aria-label="إغلاق القائمة" /><aside className={`p-sidebar ${mobile ? 'open' : ''}`}>
      <a href={`#${role}/${links[0][0]}`} className="p-sidebar-brand"><Icon name="MihwarOnLight" size={36} /><span><strong><Words>{role === 'merchant' ? 'بوابة التاجر' : 'لوحة الإدارة'}</Words></strong><small><Words>{account?.business_name || account?.username || `#${session?.id}`}</Words></small></span></a>
      <nav><Words>{links.map(([id, label, icon]) => <a key={id} href={`#${role}/${id}`} onClick={() => setMobile(false)} aria-current={id === page ? 'page' : undefined} className={id === page ? 'active' : ''}><Icon name={icon} size={20} /><span><Words>{label}</Words></span></a>)}</Words></nav>
      <button className="p-logout" onClick={logout}><Icon name="Logout" size={20} /><Words>تسجيل الخروج</Words></button>
    </aside></>}</Words>
    <div className="p-page">
      <header className={isVisitor ? 'p-visitor-header' : 'p-console-header'}>
        <Words>{isVisitor ? <><a href="#visitor/home" className="p-logo"><Brand light={resolvedTheme !== 'dark'} /><small><Words>الرياض · EXPO 2030</Words></small></a><nav className="p-desktop-nav"><Words>{visitorLinks.map(([id, label]) => <a className={page === id ? 'active' : ''} key={id} href={`#visitor/${id}`}><Words>{label}</Words></a>)}</Words></nav></> : <div className="p-console-title"><button className="p-mobile-toggle" onClick={() => setMobile((v) => !v)} aria-expanded={mobile} aria-label="القائمة"><Icon name="Menu" /></button><h1><Words>{title}</Words></h1></div>}</Words>
        <div className="p-header-tools"><button className="p-language" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}><Icon name="Globe" size={18} /><Words>{language === 'ar' ? 'EN' : 'العربية'}</Words></button>
          <Words>{isVisitor && <button className="p-icon-button" aria-label="سلالي" onClick={() => go('carts')}><Icon name="Cart" /></button>}</Words>
          <button className="p-icon-button" aria-label="الإشعارات" onClick={() => go('notifications')}><Icon name="Bell" /></button>
          <div className="p-account-wrap"><button className="p-account-button" onClick={() => setMenu((v) => !v)} aria-expanded={menu}><span className="p-avatar"><Words>{(account?.username || account?.business_name || 'م').slice(0, 1)}</Words></span><Words>{account?.username || (role === 'merchant' ? 'حساب المؤسسة' : role === 'admin' ? 'المشرف' : 'حسابي')}</Words><Icon name="ChevronDown" size={14} /></button>
            <Words>{menu && <><button className="p-dropdown-scrim" aria-label="إغلاق قائمة الحساب" onClick={() => setMenu(false)} /><nav className="p-account-menu"><Words>{(isVisitor ? accountLinks : [['settings', 'الإعدادات']]).map(([id, label]) => <button key={id} onClick={() => go(id)}><Words>{label}</Words></button>)}</Words><button className="danger-text" onClick={logout}><Words>تسجيل الخروج</Words></button></nav></>}</Words>
          </div>
        </div>
      </header>
      <main className="p-main" key={`${role}/${page}`}><Words>{children}</Words></main>
      <Words>{isVisitor && <nav className="p-bottom-nav"><Words>{[visitorLinks[0], visitorLinks[1], visitorLinks[3], visitorLinks[4], ['profile', 'حسابي', 'User']].map(([id, label, icon]) => <a key={id} href={`#visitor/${id}`} className={page === id ? 'active' : ''}><Icon name={icon} size={20} /><span><Words>{label}</Words></span></a>)}</Words></nav>}</Words>
    </div>
  </div>;
}

export function LoginRequired() {
  const { resolvedTheme } = usePortal();
  return <div className="portal p-login-required" dir="rtl"><Brand light={resolvedTheme !== 'dark'} /><h1><Words>سجّلي الدخول للمتابعة</Words></h1><p><Words>اختاري نوع حسابك للوصول إلى خدمات محور.</Words></p><div className="p-actions"><Button onClick={() => routeTo('visitor-login')}><Words>دخول الزائر</Words></Button><Button variant="secondary" onClick={() => routeTo('merchant-login')}><Words>دخول التاجر</Words></Button></div><a href="#home"><Words>العودة للرئيسية</Words></a></div>;
}

