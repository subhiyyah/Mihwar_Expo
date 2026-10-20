import Words from "./Words";import { useEffect, useRef, useState } from 'react';
import { backend, list, routeTo } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Badge, Button, Card, Icon, Money, PageHeading, ResourceState, StateBlock } from './ui';

const publicKey = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY || '';
const paymentsConfigured = /^pk_(test|live)_/.test(publicKey);
const appleSupported = paymentsConfigured && typeof window.ApplePaySession !== 'undefined';

export default function Checkout({ cartId }) {
  const { session } = usePortal();
  const resource = useResource(`checkout/${cartId}/${session.id}`, async () => {
    const [cart, account] = await Promise.all([backend.get(`/carts/${cartId}/user/${session.id}`), backend.account(session.id)]);
    const quote = cart.status === 'PENDING' ? await backend.get(`/wallet-discounts/cart/${cartId}/user/${session.id}`) : null;
    return { cart, wallet: account.wallet, quote };
  });
  const [method, setMethod] = useState('ON_SITE');
  const mutation = useMutation();
  const cart = resource.data?.cart;
  const wallet = resource.data?.wallet;
  const quote = resource.data?.quote;
  const payable = method === 'WALLET' ? quote?.totalAmount : cart?.totalAmount;
  const canWallet = wallet?.status === 'ACTIVE' && Number(wallet.balance) >= Number(quote?.totalAmount ?? cart?.totalAmount);
  const options = [
  ['WALLET', 'محفظة محور', wallet ? `الرصيد ${Number(wallet.balance).toFixed(2)} ر.س${wallet.status !== 'ACTIVE' ? ' · موقوفة' : ''}` : 'لم تُنشأ محفظة بعد', 'Wallet', !canWallet],
  ['VISA', 'بطاقة ائتمانية', 'Visa / Mastercard / mada', 'Card', !paymentsConfigured],
  ['APPLE_PAY', 'Apple Pay', appleSupported ? 'متاح على هذا الجهاز' : 'يحتاج جهازًا مدعومًا وإعداد الدفع', 'Shield', !appleSupported],
  ['ON_SITE', 'الدفع عند الاستلام', 'ادفعي للمؤسسة عند استلام الطلب', 'Cash', false]];

  const pay = () => mutation.run(async () => {
    const result = method === 'WALLET' ? await backend.post(`/payments/cart/${cartId}/user/${session.id}`, { expectedTotal: quote?.totalAmount }) : await backend.post(`/orders/user/${session.id}/checkout/${cartId}`, { paymentMethod: method, expectedTotal: cart.totalAmount });
    if (result.status === 'FAILED' || !result.orderId) throw { response: { data: { message: result.message || 'لم يتم تأكيد الطلب' } } };
    return result;
  }, (result) => {routeTo(method === 'VISA' || method === 'APPLE_PAY' ? 'visitor/pay' : 'visitor/order', result.orderId);}, 'تم إنشاء الطلب');
  return <><a href={`#visitor/cart/${cartId}`}><Words>العودة إلى السلة</Words></a><PageHeading title="مراجعة الطلب والدفع" /><ResourceState resource={resource}><Words>{cart && (cart.status !== 'PENDING' ? <StateBlock title="تم استخدام هذه السلة سابقًا"><Button onClick={() => routeTo('visitor/orders')}><Words>عرض طلباتي</Words></Button></StateBlock> : <div className="p-grid split">
    <div className="p-stack"><Card><h2><Words>اختر وسيلة دفع هذا الطلب</Words></h2><p className="p-caption"><Words>وسيلة دفع الطلب مستقلة عن شحن المحفظة.</Words></p><div className="p-form"><Words>{options.map(([id, label, hint, icon, disabled]) => <label className={`p-choice ${method === id ? 'selected' : ''}`} key={id}><input type="radio" name="method" value={id} checked={method === id} onChange={() => setMethod(id)} disabled={disabled || mutation.busy} /><Icon name={icon} /><span><strong><Words>{label}</Words></strong><small><Words>{hint}</Words></small></span><small className="p-choice-processor"><Words>{id === 'WALLET' ? 'المعالج داخلي' : id === 'ON_SITE' ? 'المؤسسة' : 'ميسّر'}</Words></small></label>)}</Words></div>
      <Words>{!paymentsConfigured && <p className="p-caption"><Words>الدفع بالبطاقة يحتاج تفعيل إعدادات ميسّر. الدفع بالمحفظة وعند الاستلام متاحان حسب حالة الحساب.</Words></p>}</Words>
    </Card><Card><h2><Words>طلبك من </Words><Words>{cart.sellerName}</Words></h2><Words>{list(cart.items).map((i) => <div className="p-row" key={i.cartItemId}><span><Words>{i.name}</Words><Words> × </Words><Words>{i.quantity}</Words></span><Money value={i.subtotal} /></div>)}</Words></Card></div>
    <Card className="p-cart-summary"><h2><Words>ملخص الطلب</Words></h2><div className="p-row"><span><Words>المؤسسة</Words></span><strong><Words>{cart.sellerName}</Words></strong></div><div className="p-row"><span><Words>عدد القطع</Words></span><strong><Words>{list(cart.items).reduce((s, i) => s + i.quantity, 0)}</Words></strong></div><hr className="p-rule" />{method === 'WALLET' && Number(quote?.percentage) > 0 && <><div className="p-row"><span><Words>المبلغ قبل الخصم</Words></span><Money value={quote.subtotalAmount} /></div><div className="p-row"><span><Words>خصم محفظة محور</Words> ({quote.percentage}%)</span><span>− <Money value={quote.discountAmount} /></span></div><p className="p-caption"><Words>خصم للزائر يتحمله المتجر، دون رسوم للمنصة.</Words></p></>}<div className="p-row"><h3><Words>الإجمالي</Words></h3><Money value={payable} /></div><p className="p-caption"><Words>يحسب الخادم المبلغ النهائي ويتحقق من الأسعار والتوفر.</Words></p><Button onClick={pay} busy={mutation.busy} disabled={!cart.items.length || options.find((o) => o[0] === method)?.[4]}><Words>متابعة الدفع</Words></Button></Card>
  </div>)}</Words></ResourceState></>;
}

let formLoader;
function loadForm() {
  if (!formLoader) formLoader = new Promise((resolve, reject) => {
    if (window.Moyasar) {resolve();return;}
    const css = document.createElement('link');css.rel = 'stylesheet';css.href = '/vendor/moyasar.css';document.head.appendChild(css);
    const script = document.createElement('script');script.src = '/vendor/moyasar.umd.min.js';script.onload = resolve;script.onerror = reject;document.head.appendChild(script);
  }).catch((error) => {formLoader = null;throw error;});
  return formLoader;
}
export function ElectronicPayment({ orderId }) {
  const { session } = usePortal();
  const resource = useResource(`pay-order/${orderId}/${session.id}`, () => backend.get(`/orders/${orderId}/user/${session.id}`));
  return <><PageHeading title="الدفع الإلكتروني" /><ResourceState resource={resource}><Words>{resource.data && (resource.data.paymentStatus === 'PAID' ? <StateBlock title="هذا الطلب مدفوع بالفعل"><Button onClick={() => routeTo('visitor/order', orderId)}><Words>تفاصيل الطلب</Words></Button></StateBlock> : resource.data.status === 'CANCELLED' || resource.data.paymentMethod === 'ON_SITE' || resource.data.paymentMethod === 'WALLET' ? <StateBlock title="الدفع الإلكتروني غير متاح لهذا الطلب" /> : !paymentsConfigured ? <StateBlock title="الدفع الإلكتروني غير مهيأ حاليًا" message="يمكنك العودة إلى تفاصيل الطلب دون إنشاء طلب جديد."><Button variant="secondary" onClick={() => routeTo('visitor/order', orderId)}><Words>تفاصيل الطلب</Words></Button></StateBlock> : <MoyasarForm order={resource.data} userId={session.id} />)}</Words></ResourceState></>;
}
function MoyasarForm({ order, userId }) {
  const ref = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const element = ref.current;
    loadForm().then(() => {
      if (!active || !ref.current) return;
      const url = new URL(location.pathname, location.origin);url.searchParams.set('expo_order', order.orderId);url.searchParams.set('expo_user', userId);
      window.Moyasar.init({ element: ref.current, amount: Math.round(Number(order.totalAmount) * 100), currency: 'SAR', description: `Order #${order.orderId}`, publishable_api_key: publicKey, callback_url: url.href, methods: order.paymentMethod === 'APPLE_PAY' ? ['applepay'] : ['creditcard'], supported_networks: ['visa', 'mastercard', 'mada'], fixed_width: false, language: document.documentElement.lang,
        metadata: { order_id: String(order.orderId) }, apple_pay: { country: 'SA', label: 'Mihwar', validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate' },
        on_completed: (payment) => {sessionStorage.setItem(`expo-payment-${userId}-${order.orderId}`, payment.id);},
        on_failure: (message) => {if (active) setError(String(message));}
      });
    }).catch(() => {if (active) setError('تعذر تحميل نموذج الدفع. حاولي مرة أخرى.');});
    return () => {active = false;element?.replaceChildren();};
  }, [order, userId]);
  return <Card className="p-narrow"><h2><Words>الطلب #</Words><Words>{order.orderId}</Words></h2><p><Words>المبلغ </Words><Money value={order.totalAmount} /></p><p className="p-caption"><Words>تُعالج بيانات البطاقة مباشرة بواسطة ميسّر.</Words></p><div ref={ref} /><Words>{error && <p className="p-notice error" role="alert"><Words>{error}</Words></p>}</Words></Card>;
}
export function PaymentReturn() {
  const { session } = usePortal();
  const params = new URLSearchParams(location.search);
  const orderId = Number(params.get('expo_order'));
  const expectedUser = Number(params.get('expo_user'));
  const paymentId = params.get('id') || sessionStorage.getItem(`expo-payment-${session.id}-${orderId}`);
  const mutation = useMutation();
  const [confirmed, setConfirmed] = useState(false);
  // The backend checks status, amount and currency; redirect parameters are never proof of payment.
  const verify = () => mutation.run(() => backend.post(`/orders/${orderId}/user/${session.id}/payments/moyasar/${encodeURIComponent(paymentId)}/confirm`), () => {setConfirmed(true);sessionStorage.removeItem(`expo-payment-${session.id}-${orderId}`);}, 'تم التحقق من الدفع');
  if (!orderId || expectedUser !== session.id || !paymentId) return <StateBlock kind="error" title="بيانات تأكيد الدفع غير مكتملة" message="ادخلي بالحساب الذي أنشأ الطلب، ثم راجعي طلباتك." />;
  return <Card className="p-narrow"><h1><Words>التحقق من الدفع</Words></h1><p><Words>الطلب #</Words><Words>{orderId}</Words></p><Words>{confirmed ? <><Badge value="PAID" /><Button onClick={() => {history.replaceState(null, '', location.pathname);routeTo('visitor/order', orderId);}}><Words>تفاصيل الطلب</Words></Button></> : <><p className="p-muted"><Words>اضغطي للتحقق من نتيجة الدفع لدى الخادم قبل اعتبار الطلب مدفوعًا.</Words></p><Button onClick={verify} busy={mutation.busy}><Words>التحقق من الدفع</Words></Button></>}</Words></Card>;
}

