import { useState } from 'react';
import Words from './Words';
import {backend} from './client';
import {useMutation,usePortal,useResource} from './state';
import {Button,Card,Confirm,Field,Modal,PageHeading,ResourceState,Table} from './ui';

export default function WalletDiscounts() {
  const {session}=usePortal();
  const resource=useResource('admin-wallet-discounts',()=>backend.get(`/wallet-discounts/admin?adminId=${session.id}`));
  const mutation=useMutation();
  const [editing,setEditing]=useState(null),[confirmation,setConfirmation]=useState(null);
  const apply=()=>mutation.run(()=>confirmation.inherit
    ? backend.delete(`/wallet-discounts/admin/stores/${confirmation.sellerId}?adminId=${session.id}`)
    : backend.put(`/wallet-discounts/admin/${confirmation.sellerId ? `stores/${confirmation.sellerId}` : 'all'}?adminId=${session.id}`,{percentage:confirmation.percentage}),
    ()=>{setConfirmation(null);setEditing(null);resource.refresh();},'تم تحديث خصم محفظة محور');
  return <><PageHeading title="خصومات محفظة محور" description="خصم للزائر يتحمله المتجر، ويطبق فقط عند الدفع بمحفظة محور." />
    <ResourceState resource={resource}>{resource.data && <><Card><h2><Words>النسبة العامة لجميع المتاجر</Words></h2><p>{resource.data.globalPercentage}%</p><Button onClick={()=>setEditing({percentage:resource.data.globalPercentage})}><Words>تطبيق نسبة على جميع المتاجر</Words></Button><p className="p-caption"><Words>التطبيق على الجميع يستبدل النسب الخاصة السابقة. المتاجر الجديدة تتبع النسبة العامة.</Words></p></Card>
    <Table rows={resource.data.stores} rowKey={row=>row.sellerId} columns={[{key:'sellerName',label:'المتجر'},{key:'effectivePercentage',label:'الخصم الفعلي',render:row=>`${row.effectivePercentage}%`},{key:'source',label:'المصدر',render:row=><Words>{row.overridePercentage==null?'النسبة العامة':'نسبة خاصة'}</Words>},{key:'actions',label:'الإجراء',render:row=><div className="p-actions"><Button variant="secondary" onClick={()=>setEditing({sellerId:row.sellerId,name:row.sellerName,percentage:row.effectivePercentage})}><Words>تحديد نسبة خاصة</Words></Button>{row.overridePercentage!=null&&<Button variant="ghost" onClick={()=>setConfirmation({inherit:true,sellerId:row.sellerId})}><Words>العودة للنسبة العامة</Words></Button>}</div>}]} /></>}</ResourceState>
    {editing&&<Modal title={editing.sellerId?'خصم متجر محدد':'خصم جميع المتاجر'} onClose={()=>setEditing(null)} busy={mutation.busy}><form className="p-form" onSubmit={event=>{event.preventDefault();setConfirmation({...editing,percentage:Number(new FormData(event.currentTarget).get('percentage'))});setEditing(null);}}><p><Words>{editing.name||'جميع المتاجر'}</Words></p><Field label="نسبة الخصم (%)" name="percentage" type="number" min="0" max="99" step="0.01" required defaultValue={editing.percentage} hint="صفر لإيقاف الخصم. يخصم المبلغ من السعر ويصل الصافي للمتجر." /><Button type="submit"><Words>مراجعة التغيير</Words></Button></form></Modal>}
    {confirmation&&<Confirm title="تأكيد الخصم" message={confirmation.inherit?'إلغاء النسبة الخاصة والعودة للنسبة العامة؟':confirmation.sellerId?`تطبيق خصم ${confirmation.percentage}% على هذا المتجر للدفع بمحفظة محور؟`:`تطبيق خصم ${confirmation.percentage}% على جميع المتاجر وإلغاء نسبها الخاصة السابقة؟`} busy={mutation.busy} onClose={()=>setConfirmation(null)} onConfirm={apply} />}
  </>;
}

