import Words from "./Words";import { lazy, Suspense, useEffect, useState } from 'react';
const App = lazy(() => import('../App'));
import WelcomeSite from '../welcome/WelcomeSite';
import { PortalProvider, usePortal } from './state';
import Shell, { LoginRequired } from './Shell';
const Home = lazy(() => import('./Home'));
const AuthPage = lazy(() => import('./AuthPage'));
const WalletDiscounts = lazy(() => import('./WalletDiscounts'));
const Orders = lazy(() => import('./Orders'));
const MerchantMenu = lazy(() => import('./MerchantMenu'));
const MerchantProfile = lazy(() => import('./MerchantProfile'));
const Wallet = lazy(() => import('./Wallet'));
const Invoices = lazy(() => import('./Invoices'));
const Carts = lazy(() => import('./Shopping').then(module => ({ default: module.Carts })));
const CartReview = lazy(() => import('./Shopping').then(module => ({ default: module.CartReview })));
const Sellers = lazy(() => import('./Shopping').then(module => ({ default: module.Sellers })));
const SellerMenu = lazy(() => import('./Shopping').then(module => ({ default: module.SellerMenu })));
const Checkout = lazy(() => import('./Checkout'));
const ElectronicPayment = lazy(() => import('./Checkout').then(module => ({ default: module.ElectronicPayment })));
const PaymentReturn = lazy(() => import('./Checkout').then(module => ({ default: module.PaymentReturn })));
const MapPage = lazy(() => import('./Navigation').then(module => ({ default: module.MapPage })));
const Passport = lazy(() => import('./Navigation').then(module => ({ default: module.Passport })));
const Plan = lazy(() => import('./Navigation').then(module => ({ default: module.Plan })));
const DigitalDocuments = lazy(() => import('./DigitalDocuments'));
const Documents = lazy(() => import('./AccountPages').then(module => ({ default: module.Documents })));
const Health = lazy(() => import('./AccountPages').then(module => ({ default: module.Health })));
const Profile = lazy(() => import('./AccountPages').then(module => ({ default: module.Profile })));
const Settings = lazy(() => import('./AccountPages').then(module => ({ default: module.Settings })));
const Notifications = lazy(() => import('./AccountPages').then(module => ({ default: module.Notifications })));
const AdminRecords = lazy(() => import('./AdminPages').then(module => ({ default: module.AdminRecords })));
const AdminWallets = lazy(() => import('./AdminPages').then(module => ({ default: module.AdminWallets })));
const ContentEditor = lazy(() => import('./AdminPages').then(module => ({ default: module.ContentEditor })));
const Users = lazy(() => import('./AdminPages').then(module => ({ default: module.Users })));
const Verification = lazy(() => import('./AdminPages').then(module => ({ default: module.Verification })));
import { Button, Card, Field, StateBlock } from './ui';

function SharedHealthCard() {
  const [token, setToken] = useState('');
  const [opened, setOpened] = useState('');
  return <Card><h1><Words>عرض البطاقة الصحية المشتركة</Words></h1><p><Words>أدخلي رمز البطاقة الذي شاركه الزائر معك.</Words></p><form className="p-form" onSubmit={(event) => {event.preventDefault();setOpened(token);}}><Field label="رمز المشاركة" pattern="[a-fA-F0-9]{32}" value={token} onChange={(event) => setToken(event.target.value.trim())} required /><Button type="submit"><Words>عرض البطاقة</Words></Button></form><Words>{opened && <iframe title="البطاقة الصحية العامة" src={`/api/v1/health-cards/public/${opened}`} style={{ width: '100%', height: 650, border: 0 }} />}</Words></Card>;
}
const ClinicRequests = lazy(() => import('./ParamedicRequests').then(module => ({ default: module.ClinicRequests })));
function Clinic() { return <><ClinicRequests /><SharedHealthCard /></>; }
function Router() {
  const [hash, setHash] = useState(() => location.hash.slice(1) || 'home');
  const { session, login } = usePortal();
  useEffect(() => {const sync = () => {setHash(location.hash.slice(1) || 'home');scrollTo(0, 0);};addEventListener('hashchange', sync);return () => removeEventListener('hashchange', sync);}, []);
  const enter = (account) => {login(account);location.hash = account.role === 'SELLER' ? 'merchant/orders' : account.role === 'ADMIN' ? 'admin/pending' : account.role === 'CAREGIVER' ? 'clinic' : 'visitor/home';};
  if (['visitor-register', 'merchant-register', 'admin-login'].includes(hash)) return <AuthPage mode={hash} />;
  if (hash === 'preview') return <><nav className="existing-shell-nav"><a href="#home"><Words>العودة للرئيسية</Words></a><span><Words>معاينة الواجهة السابقة</Words></span></nav><App userId={session?.id || 1} /></>;
  const [role, page = 'home', id] = hash.split('/');
  const callback = new URLSearchParams(location.search).has('expo_order');
  if (['visitor-login', 'merchant-login'].includes(hash) || !['visitor', 'merchant', 'admin', 'clinic'].includes(role) && !callback) return <WelcomeSite onPreview={() => {location.hash = 'preview';}} onVisitorLogin={enter} onMerchantLogin={enter} />;
  if (!session) return <LoginRequired />;
  if (callback) return <Shell role="visitor" page="orders"><PaymentReturn /></Shell>;
  if (role === 'clinic' && session.role !== 'CAREGIVER' || role === 'merchant' && session.role !== 'SELLER' || role === 'admin' && session.role !== 'ADMIN' || role === 'visitor' && !['USER', 'ADMIN', 'CAREGIVER'].includes(session.role)) return <LoginRequired />;
  let content;
  if (page === 'settings') content = <Settings />;else
  if (page === 'notifications') content = <Notifications />;else
  if (role === 'clinic') content = <Clinic />;else
  if (role === 'merchant') content = { orders: <Orders merchant />, menu: <MerchantMenu />, wallet: <Wallet merchant />, invoices: <Invoices />, profile: <MerchantProfile /> }[page];else
  if (role === 'admin') content = { 'digital-documents': <DigitalDocuments admin />, discounts: <WalletDiscounts />, pending: <Verification pending />, sellers: <Verification />, users: <Users />, wallets: <AdminWallets />, sellerwallets: <AdminWallets merchant />, content: <ContentEditor kind="content" />, nodes: <ContentEditor kind="nodes" />, edges: <ContentEditor kind="edges" />, clinics: <ContentEditor kind="clinics" />, payments: <AdminRecords kind="payments" />, invoices: <AdminRecords kind="invoices" />, orders: <AdminRecords kind="orders" /> }[page];else
  content = { 'digital-documents': <DigitalDocuments />, home: <Home />, map: <MapPage destinationId={id} />, plan: <Plan />, passport: <Passport />, sellers: <Sellers />, seller: <SellerMenu sellerId={Number(id)} />, carts: <Carts />, cart: <CartReview cartId={Number(id)} />, checkout: <Checkout cartId={Number(id)} />, pay: <ElectronicPayment orderId={Number(id)} />, order: <Orders orderId={id} />, orders: <Orders />, wallet: <Wallet />, health: <Health />, documents: <Documents />, profile: <Profile /> }[page];
  return <Shell role={role === 'clinic' ? 'visitor' : role} page={page}><Words>{content || <StateBlock title="الصفحة غير موجودة"><a href="#home"><Words>العودة للرئيسية</Words></a></StateBlock>}</Words></Shell>;
}
export default function PortalRouter() {return <PortalProvider><Suspense fallback={<div className="portal p-login-required" role="status"><Words>جارٍ التحميل</Words></div>}><Router /></Suspense></PortalProvider>;}

