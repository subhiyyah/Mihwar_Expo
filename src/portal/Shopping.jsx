import Words from "./Words";import { useState } from 'react';
import { backend, list, routeTo } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Badge, Button, Card, Confirm, Icon, Money, PageHeading, ResourceState, StateBlock, Tabs } from './ui';

export function Sellers() {
  const resource = useResource('available-sellers', () => backend.sellers().then((xs) => xs.filter((s) => s.status === 'ACTIVE' && s.verification_status === 'VERIFIED')));
  return <><PageHeading title="المطاعم والمؤسسات" description="استعرضي المنتجات واطلبي من مؤسسات إكسبو." /><ResourceState resource={resource} empty={!resource.loading && !resource.error && !resource.data?.length && 'لا توجد مؤسسات متاحة حاليًا'}><div className="p-grid three"><Words>{list(resource.data).map((s) => <Card key={s.id}><div className="p-row"><div><h2><Words>{s.business_name}</Words></h2><small className="p-caption"><Words>{s.phone}</Words></small></div><Icon name="Store" size={30} /></div><Button variant="secondary" onClick={() => routeTo('visitor/seller', s.id)}><Words>عرض المنيو</Words></Button></Card>)}</Words></div></ResourceState></>;
}
export function Quantity({ value, onChange, disabled = false }) {
  return <div className="p-quantity"><button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="تقليل الكمية"><Words>−</Words></button><span><Words>{value}</Words></span><button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= 999} aria-label="زيادة الكمية"><Words>+</Words></button></div>;
}
export function CartLines({ cart, onChanged }) {
  const { session } = usePortal();
  const mutation = useMutation();
  const mutate = (item, qty) => mutation.run(() => qty == null ? backend.delete(`/carts/${cart.cartId}/user/${session.id}/items/${item.cartItemId}`) : backend.put(`/carts/${cart.cartId}/user/${session.id}/items/${item.cartItemId}`, null, { params: { quantity: qty } }), onChanged, qty == null ? 'تم حذف الصنف' : '');
  return <>{list(cart.items).map((i) => <div className="p-cart-line" key={i.cartItemId}><div><strong><Words>{i.name}</Words></strong><small><Words>{i.quantity}</Words><Words> × </Words><Money value={i.unitPrice} /></small></div><Money value={i.subtotal} /><Quantity value={i.quantity} disabled={mutation.busy} onChange={(qty) => mutate(i, qty)} /><button className="p-icon-button danger-text" disabled={mutation.busy} aria-label={`حذف ${i.name}`} onClick={() => mutate(i, null)}><Icon name="Trash" size={20} /></button></div>)}</>;
}
export function SellerMenu({ sellerId }) {
  const { session } = usePortal();
  const resource = useResource(`seller-menu/${sellerId}/${session.id}`, async () => {
    const [menus, sellers, carts] = await Promise.all([backend.menus(sellerId), backend.sellers(), backend.get(`/carts/user/${session.id}`)]);
    return { menus, seller: sellers.find((s) => s.id === Number(sellerId)), carts: list(carts) };
  });
  const [selected, setSelected] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [clear, setClear] = useState(false);
  const mutation = useMutation();
  const menu = resource.data?.menus.find((m) => m.id === selected) || resource.data?.menus[0];
  const ids = new Set(list(resource.data?.menus).flatMap((m) => list(m.menuItems).map((i) => i.id)));
  // Match by the actual menu item IDs rather than the seller's display name.
  const cart = list(resource.data?.carts).find((c) => c.status === 'PENDING' && list(c.items).some((i) => ids.has(i.menuItemId)));
  const add = (item) => mutation.run(() => backend.post(`/carts/user/${session.id}/restaurant/${sellerId}/items`, { menuItemId: item.id, quantity: quantities[item.id] || 1 }), resource.refresh, 'أضيف المنتج إلى السلة');
  const allowed = resource.data?.seller?.status === 'ACTIVE' && resource.data?.seller?.verification_status === 'VERIFIED';
  return <><a href="#visitor/sellers"><Words>المؤسسات ‹ </Words><Words>{resource.data?.seller?.business_name || 'المنيو'}</Words></a><ResourceState resource={resource}>
    <Card><div className="p-row"><div><h1><Words>{resource.data?.seller?.business_name || 'المنيو'}</Words></h1><p className="p-muted"><Words>الطلب للاستلام من المؤسسة · الأسعار بالريال السعودي</Words></p></div><Icon name="Store" size={40} /></div></Card>
    <Words>{!allowed ? <StateBlock title="هذه المؤسسة غير متاحة للطلب حاليًا" /> : <>
      <Tabs value={menu?.id} onChange={setSelected} options={list(resource.data?.menus).map((m) => [m.id, m.name])} />
      <div className="p-grid split"><div className="p-grid two"><Words>{list(menu?.menuItems).map((item) => <Card className={`p-product ${!item.available ? 'disabled' : ''}`} key={item.id}><h2 className="p-product-title"><Words>{item.name?.startsWith('[INCOMPLETE NAME]') ? 'منتج غير متاح' : item.name}</Words></h2><Words>{item.description && <p><Words>{item.description}</Words></p>}</Words><div className="p-product-footer"><Money value={item.price} /><Words>{item.available && Number(item.price) > 0 ? <div className="p-actions"><Quantity value={quantities[item.id] || 1} onChange={(value) => setQuantities((q) => ({ ...q, [item.id]: value }))} /><Button className="small" onClick={() => add(item)} busy={mutation.busy}><Words>أضف</Words></Button></div> : <Badge value="INACTIVE"><Words>غير متاح حاليًا</Words></Badge>}</Words></div></Card>)}</Words></div>
      <Card className="p-cart-summary"><h2><Words>سلتك من المؤسسة</Words></h2><Words>{cart && cart.items.length ? <><CartLines cart={cart} onChanged={resource.refresh} /><hr className="p-rule" /><div className="p-row"><strong><Words>الإجمالي</Words></strong><Money value={cart.totalAmount} /></div><p className="p-caption"><Words>المبلغ النهائي يُراجع عند تأكيد الطلب.</Words></p><Button onClick={() => routeTo('visitor/cart', cart.cartId)}><Words>مراجعة الطلب</Words></Button><Button variant="ghost" onClick={() => setClear(true)}><Words>تفريغ السلة</Words></Button></> : <p className="p-muted"><Words>أضيفي منتجات لتظهر سلتك هنا.</Words></p>}</Words></Card></div>
    </>}</Words>
    </ResourceState>{clear && <Confirm title="تفريغ السلة" message="حذف جميع أصناف هذه السلة؟" danger onClose={() => setClear(false)} busy={mutation.busy} onConfirm={() => mutation.run(() => backend.delete(`/carts/${cart.cartId}/user/${session.id}/items`), () => {setClear(false);resource.refresh();}, 'تم تفريغ السلة')} />}</>;
}
export function Carts() {
  const { session } = usePortal();
  const resource = useResource(`carts/${session.id}`, () => backend.get(`/carts/user/${session.id}`).then(list));
  const carts = list(resource.data).filter((c) => c.status === 'PENDING' && list(c.items).length);
  return <><PageHeading title="سلالي" description="كل مؤسسة لها سلة وطلب مستقلان." /><ResourceState resource={resource} empty={!resource.loading && !resource.error && !carts.length && 'سلالك فارغة'}><div className="p-grid two"><Words>{carts.map((cart) => <Card key={cart.cartId}><h2><Words>{cart.sellerName}</Words></h2><p className="p-muted"><Words>{list(cart.items).reduce((s, i) => s + i.quantity, 0)}</Words><Words> قطع</Words></p><div className="p-row"><Money value={cart.totalAmount} /><Button variant="secondary" onClick={() => routeTo('visitor/cart', cart.cartId)}><Words>مراجعة السلة</Words></Button></div></Card>)}</Words></div></ResourceState></>;
}
export function CartReview({ cartId }) {
  const { session } = usePortal();
  const resource = useResource(`cart/${cartId}/${session.id}`, () => backend.get(`/carts/${cartId}/user/${session.id}`));
  const [clear, setClear] = useState(false);
  const mutation = useMutation();
  const cart = resource.data;
  return <><a href="#visitor/carts"><Words>سلالي ‹ مراجعة السلة</Words></a><PageHeading title={`مراجعة السلة${cart ? ` · ${cart.sellerName}` : ''}`} /><ResourceState resource={resource}><Words>{cart && (cart.status !== 'PENDING' ? <StateBlock title="تم تأكيد هذه السلة سابقًا"><Button onClick={() => routeTo('visitor/orders')}><Words>عرض الطلبات</Words></Button></StateBlock> : <div className="p-grid split"><Card><CartLines cart={cart} onChanged={resource.refresh} /><Words>{!list(cart.items).length && <p><Words>السلة فارغة</Words></p>}</Words></Card><Card className="p-cart-summary"><h2><Words>الملخص</Words></h2><div className="p-row"><span><Words>عدد القطع</Words></span><strong><Words>{list(cart.items).reduce((s, i) => s + i.quantity, 0)}</Words></strong></div><hr className="p-rule" /><div className="p-row"><strong><Words>الإجمالي</Words></strong><Money value={cart.totalAmount} /></div><Button disabled={!cart.items.length} onClick={() => routeTo('visitor/checkout', cartId)}><Words>متابعة إلى الدفع</Words></Button><Button variant="ghost" onClick={() => setClear(true)} disabled={!cart.items.length}><Words>تفريغ السلة</Words></Button></Card></div>)}</Words></ResourceState>{clear && <Confirm danger title="تفريغ السلة" message="حذف جميع الأصناف؟" onClose={() => setClear(false)} busy={mutation.busy} onConfirm={() => mutation.run(() => backend.delete(`/carts/${cartId}/user/${session.id}/items`), () => {setClear(false);resource.refresh();})} />}</>;
}
