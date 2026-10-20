import Words from "./Words";import { useState } from 'react';
import { backend, dateText, list } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Badge, Button, Card, Confirm, Field, Modal, Money, PageHeading, ResourceState, StateBlock, Table } from './ui';

export default function Wallet({ merchant = false }) {
  const { session, refreshAccount } = usePortal();
  const [transfer, setTransfer] = useState(false);
  const [amount, setAmount] = useState(null);
  const mutation = useMutation();
  const resource = useResource(`wallet/${session.id}/${merchant}`, async () => {
    if (!merchant) {
      const account = await backend.account(session.id);
      return { wallet: account.wallet, transactions: list(await backend.get(`/orders/user/${session.id}`)).filter((o) => o.paymentMethod === 'WALLET' && o.paymentStatus === 'PAID') };
    }
    let wallet;
    try {wallet = await backend.get(`/seller-wallet/seller/${session.id}`);}
    catch (error) {if (/wallet.*not found|no wallet/i.test(error.response?.data?.message || '')) return { wallet: null, transactions: [] };throw error;}
    return { wallet, transactions: list(await backend.get(`/seller-wallet/transactions/${wallet.id}`)) };
  });
  const wallet = resource.data?.wallet;
  const transactions = resource.data?.transactions || [];
  const pending = transactions.filter((t) => t.type === 'BANK_TRANSFER' && t.status === 'PENDING').reduce((s, t) => s + Number(t.amount), 0);
  const create = () => mutation.run(() => backend.post(merchant ? `/seller-wallet/add/${session.id}` : `/wallets/addWallet/${session.id}`), async () => {await refreshAccount();resource.refresh();}, 'تم إنشاء المحفظة');
  return <>
    <PageHeading title="المحفظة" description={merchant ? undefined : 'رصيدك للدفع لدى مؤسسات إكسبو.'}><Button variant="secondary" onClick={resource.refresh} busy={resource.loading}><Words>تحديث</Words></Button><Words>{merchant && wallet && <Button disabled={wallet.status !== 'ACTIVE'} onClick={() => setTransfer(true)}><Words>طلب تحويل الرصيد</Words></Button>}</Words></PageHeading>
    <ResourceState resource={resource}><Words>{wallet ? <>
      <div className={merchant ? 'p-grid two' : ''}><Card className="p-kpi"><div className="p-row"><span><Words>رصيد المحفظة</Words></span><Badge value={wallet.status} /></div><strong className="p-hero-amount"><Money value={wallet.balance} /></strong><small><Words>العملة · SAR</Words></small></Card><Words>{merchant && <Card className="p-kpi"><span><Words>تحويلات معلقة</Words></span><strong><Money value={pending} /></strong><small><Words>المبالغ المحجوزة عند تقديم طلب التحويل</Words></small></Card>}</Words></div>
      {wallet.status !== 'ACTIVE' && <p className="p-notice warning"><Words>المحفظة موقوفة. لا يمكن الدفع أو التحويل حتى إعادة تفعيلها.</Words></p>}
      <h2><Words>{merchant ? 'حركات المحفظة' : 'مدفوعات الطلبات بالمحفظة'}</Words></h2>
      <Table rows={transactions} rowKey={(t) => merchant ? t.id : t.orderId} empty="لا توجد حركات معروضة" columns={merchant ? [
          { key: 'created_at', label: 'التاريخ', render: (t) => dateText(t.created_at || t.createdAt) },
          { key: 'type', label: 'النوع', render: (t) => ({ BANK_TRANSFER: 'طلب تحويل بنكي', TOP_UP: 'إيداع مستحقات', REFUND: 'استرداد' })[t.type] || t.type },
          { key: 'reference', label: 'المرجع' }, { key: 'amount', label: 'المبلغ', render: (t) => <Money value={t.amount} /> }, { key: 'status', label: 'الحالة', render: (t) => <Badge value={t.status} /> }] :
          [{ key: 'orderId', label: 'رقم الطلب', render: (o) => `#${o.orderId}` }, { key: 'sellerName', label: 'المؤسسة' }, { key: 'totalAmount', label: 'المبلغ المدفوع', render: (o) => <Money value={o.totalAmount} /> }, { key: 'paymentStatus', label: 'الحالة', render: (o) => <Badge value={o.paymentStatus} /> }]} />
      {!merchant && <p className="p-caption"><Words>تظهر هنا مدفوعات الطلبات بالمحفظة. سجل الشحن والاسترداد الكامل غير متاح حاليًا.</Words></p>}
    </> : <StateBlock title="لم تُنشأ محفظة لهذا الحساب"><Button onClick={create} busy={mutation.busy}><Words>إنشاء المحفظة</Words></Button></StateBlock>}</Words></ResourceState>
    {transfer && <Modal title="طلب تحويل بنكي" onClose={() => setTransfer(false)} busy={mutation.busy}><form className="p-form" onSubmit={(e) => {e.preventDefault();setAmount(Number(new FormData(e.currentTarget).get('amount')));}}><p><Words>الرصيد المتاح </Words><Money value={wallet.balance} /></p><Field label="المبلغ بالريال" name="amount" type="number" required step="0.01" min="0.01" max={wallet.balance} /><p className="p-caption"><Words>يُخصم المبلغ من الرصيد عند تقديم الطلب، وتبقى حركة التحويل معلقة حتى معالجتها.</Words></p><Button type="submit"><Words>مراجعة الطلب</Words></Button></form></Modal>}
    {amount !== null && <Confirm title="تأكيد طلب التحويل" message={`هل تريدين تقديم طلب تحويل بمبلغ ${amount.toFixed(2)} ر.س؟`} busy={mutation.busy} onClose={() => setAmount(null)} onConfirm={() => mutation.run(() => backend.post(`/seller-wallet/transfer/${wallet.id}`, null, { params: { amount } }), () => {setTransfer(false);setAmount(null);resource.refresh();}, 'تم تقديم طلب التحويل')} />}
  </>;
}
