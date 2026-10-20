import Words from "./Words";import { useState } from 'react';
import { backend, list, statusLabels } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Badge, Button, Card, Confirm, Modal, Money, PageHeading, ResourceState, Table, Tabs } from './ui';
import Receipt from './Receipt';

export default function Orders({ merchant = false, orderId = null }) {
  const { session } = usePortal();
  const resource = useResource(`${merchant}/${session.id}`, () => backend.get(`/orders/${merchant ? 'restaurant' : 'user'}/${session.id}`).then(list));
  const [filter, setFilter] = useState(merchant ? 'active' : 'all');
  const [selected, setSelected] = useState(orderId ? Number(orderId) : null);
  const [confirm, setConfirm] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const mutation = useMutation();
  const orders = resource.data || [];
  const current = orders.find((o) => o.orderId === selected);
  const options = merchant ? [['active', 'النشطة'], ['new', 'جديدة'], ['unpaid', 'غير مدفوعة'], ['completed', 'مكتملة'], ['cancelled', 'ملغاة']] : [['all', 'الكل'], ['active', 'قيد التنفيذ'], ['unpaid', 'بانتظار الدفع'], ['completed', 'مكتملة'], ['cancelled', 'ملغاة']];
  const rows = orders.filter((o) => filter === 'all' || filter === 'active' && !['COMPLETED', 'CANCELLED'].includes(o.status) || filter === 'new' && o.status === 'NEW' || filter === 'unpaid' && o.paymentStatus !== 'PAID' && o.status !== 'CANCELLED' || filter === 'completed' && o.status === 'COMPLETED' || filter === 'cancelled' && o.status === 'CANCELLED');
  const changes = { NEW: ['ACCEPTED', 'CANCELLED'], ACCEPTED: ['PREPARING', 'DELAYED', 'CANCELLED'], PREPARING: ['READY', 'DELAYED', 'CANCELLED'], DELAYED: ['PREPARING', 'READY', 'CANCELLED'], READY: ['COMPLETED'] };
  async function showReceipt(order) {
    await mutation.run(async () => {
      const found = list(await backend.get('/invoices/get')).find((i) => i.orderId === order.orderId);
      if (!found) throw { response: { data: { message: 'لا يوجد إيصال لهذا الطلب حتى الآن' } } };
      return found;
    }, setReceipt, '');
  }
  const change = (next) => setConfirm({ kind: 'status', next, order: current });
  const settle = (order) => setConfirm({ kind: 'payment', order });
  const perform = () => mutation.run(() => confirm.kind === 'payment' ?
  backend.post(`/orders/${confirm.order.orderId}/restaurant/${session.id}/payments/on-site/confirm`) :
  backend.patch(`/orders/${confirm.order.orderId}/restaurant/${session.id}/status`, { status: confirm.next }),
  () => {setConfirm(null);resource.refresh();}, confirm.kind === 'payment' ? 'تم تأكيد استلام المبلغ، ولم تتغير حالة تجهيز الطلب' : 'تم تحديث حالة الطلب');
  return <>
    <PageHeading title={merchant ? 'الطلبات' : 'طلباتي'} description={!merchant ? 'حالة الطلب منفصلة عن حالة الدفع.' : undefined}><Button variant="secondary" onClick={resource.refresh} busy={resource.loading}><Words>تحديث</Words></Button></PageHeading>
    {merchant && <div className="p-grid four"><Card className="p-kpi"><span><Words>طلبات جديدة</Words></span><strong><Words>{orders.filter((o) => o.status === 'NEW').length}</Words></strong></Card><Card className="p-kpi"><span><Words>قيد التنفيذ</Words></span><strong><Words>{orders.filter((o) => ['ACCEPTED', 'PREPARING', 'DELAYED'].includes(o.status)).length}</Words></strong><small><Words>مقبول · قيد التحضير · متأخر</Words></small></Card><Card className="p-kpi"><span><Words>بانتظار تحصيل في الموقع</Words></span><strong><Words>{orders.filter((o) => o.paymentMethod === 'ON_SITE' && o.paymentStatus !== 'PAID' && o.status !== 'CANCELLED').length}</Words></strong></Card><Card className="p-kpi"><span><Words>إجمالي الطلبات المدفوعة</Words></span><strong><Money value={orders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + Number(o.totalAmount), 0)} /></strong><small><Words>من الطلبات المعروضة، وليست رصيد المحفظة</Words></small></Card></div>}
    <Tabs value={filter} onChange={setFilter} options={options} />
    <ResourceState resource={resource}><Table rows={rows} rowKey={(o) => o.orderId} empty="لا توجد طلبات في هذه القائمة" columns={[
      { key: 'orderId', label: 'رقم الطلب', render: (o) => `#${o.orderId}` },
      ...(!merchant ? [{ key: 'sellerName', label: 'المؤسسة' }] : [{ key: 'quantity', label: 'القطع', render: (o) => list(o.items).reduce((s, i) => s + i.quantity, 0) }]),
      { key: 'totalAmount', label: 'المبلغ', render: (o) => <Money value={o.totalAmount} /> },
      { key: 'paymentMethod', label: 'وسيلة الدفع', render: (o) => statusLabels[o.paymentMethod] || o.paymentMethod },
      { key: 'status', label: 'حالة الطلب', render: (o) => <Badge value={o.status} /> },
      { key: 'paymentStatus', label: 'حالة الدفع', render: (o) => <Badge value={o.paymentStatus} /> },
      { key: 'actions', label: 'الإجراء', render: (o) => <div className="p-actions"><button className="p-link" onClick={() => setSelected(o.orderId)}><Words>التفاصيل</Words></button><Words>{merchant && o.paymentMethod === 'ON_SITE' && o.paymentStatus !== 'PAID' && o.status !== 'CANCELLED' && <Button variant="secondary" onClick={() => settle(o)}><Words>تأكيد الدفع</Words></Button>}</Words></div> }]
      } /></ResourceState>
    {current && <Modal title={`الطلب #${current.orderId} · ${current.sellerName}`} wide onClose={() => setSelected(null)} busy={mutation.busy}>
      <div className="p-actions"><Badge value={current.status} /><Badge value={current.paymentStatus} /></div>
      <Card><div className="p-row"><h3><Words>حالة الطلب</Words></h3><Button variant="ghost" onClick={resource.refresh}><Words>تحديث</Words></Button></div><div className="p-timeline"><Words>{['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'].map((status, i) => <div key={status} className={i <= ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'].indexOf(current.status) ? 'done' : ''}><i /><span><Words>{statusLabels[status]}</Words></span></div>)}</Words></div></Card>
      <Table rowKey={(item) => item.id} rows={list(current.items).map((item, index) => ({ ...item, id: index }))} columns={[{ key: 'itemName', label: 'الصنف' }, { key: 'quantity', label: 'الكمية' }, { key: 'unitPrice', label: 'سعر الوحدة', render: (i) => <Money value={i.unitPrice} /> }, { key: 'total', label: 'المجموع', render: (i) => <Money value={i.unitPrice * i.quantity} /> }]} />
      {Number(current.discountAmount) > 0 && <><div className="p-row"><span><Words>المبلغ قبل الخصم</Words></span><Money value={current.subtotalAmount} /></div><div className="p-row"><span><Words>خصم محفظة محور</Words> ({current.walletDiscountPercentage}%)</span><span>− <Money value={current.discountAmount} /></span></div></>}<div className="p-row"><strong><Words>الإجمالي</Words></strong><Money value={current.totalAmount} /></div>
      <div className="p-actions"><Words>{!merchant && current.paymentStatus !== 'PAID' && current.status !== 'CANCELLED' && ['VISA', 'APPLE_PAY', 'MOYASAR'].includes(current.paymentMethod) && <a className="p-btn primary" href={`#visitor/pay/${current.orderId}`}><Words>إكمال الدفع</Words></a>}</Words><Words>{current.paymentStatus === 'PAID' && <Button variant="secondary" onClick={() => showReceipt(current)} busy={mutation.busy}><Words>عرض الإيصال</Words></Button>}</Words>
        <Words>{merchant && (changes[current.status] || []).filter((next) => !(next === 'CANCELLED' && current.paymentStatus === 'PAID') && !(next === 'COMPLETED' && current.paymentStatus !== 'PAID')).map((next) => <Button key={next} variant={next === 'CANCELLED' ? 'danger' : 'primary'} onClick={() => change(next)} disabled={mutation.busy}><Words>{statusLabels[next]}</Words></Button>)}</Words>
        <Words>{merchant && current.paymentMethod === 'ON_SITE' && current.paymentStatus !== 'PAID' && current.status !== 'CANCELLED' && <Button onClick={() => settle(current)}><Words>تأكيد استلام المبلغ</Words></Button>}</Words>
      </div>
      <Words>{current.paymentStatus === 'PAID' && merchant && <p className="p-caption"><Words>إلغاء الطلب المدفوع يحتاج إجراء استرداد، ولا يتم من تغيير الحالة.</Words></p>}</Words>
    </Modal>}
    {confirm && <Confirm title={confirm.kind === 'payment' ? 'تأكيد استلام المبلغ' : 'تغيير حالة الطلب'} message={confirm.kind === 'payment' ? 'هل استلمت المبلغ كاملًا؟ سيتحول الدفع إلى مدفوع وتبقى حالة تجهيز الطلب مستقلة.' : `هل تريدين تغيير حالة الطلب إلى ${statusLabels[confirm.next]}؟`} danger={confirm.next === 'CANCELLED'} onClose={() => setConfirm(null)} onConfirm={perform} busy={mutation.busy} />}
    {receipt && <Receipt invoice={receipt} onClose={() => setReceipt(null)} />}
  </>;
}
