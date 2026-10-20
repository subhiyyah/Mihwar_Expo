import { useState } from 'react';
import { backend } from './client';
import { usePortal, useResource, useMutation } from './state';
import { Button, Card, Field, PageHeading, ResourceState, StateBlock, Confirm } from './ui';

export default function DigitalDocuments({ admin=false }) {
 const { session }=usePortal();const [selected,setSelected]=useState('');const [target,setTarget]=useState('');const [adding,setAdding]=useState(false);const [removing,setRemoving]=useState(null);const [approving,setApproving]=useState(null);
 const id=admin?target:session.id;const mutation=useMutation();
 const resource=useResource(`digital-documents/${id}`,()=>id?backend.get(`/digital-documents/user/${id}`):backend.get('/digital-documents/pending').then(documents=>({profile:null,documents})));
 const refresh=()=>{setAdding(false);setRemoving(null);resource.refresh();};
 const download=async doc=>{const blob=await backend.get(`/digital-documents/${doc.id}/file`,{responseType:'blob'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=doc.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <><PageHeading title="الوثائق الرقمية" description="قسم اختياري وخاص؛ تبقى الوثيقة بانتظار المراجعة حتى يعتمدها الأدمن." />
 {admin&&<Card><form className="p-form" onSubmit={e=>{e.preventDefault();setTarget(selected);}}><Field label="رقم المستخدم" type="number" min="1" required value={selected} onChange={e=>setSelected(e.target.value)} /><Button type="submit">عرض وثائق المستخدم</Button></form></Card>}
 {admin&&<Button variant="secondary" onClick={()=>{setTarget('');resource.refresh();}}>الوثائق بانتظار المراجعة</Button>}
 <ResourceState resource={resource}>{resource.data&&<>
 {resource.data.profile&&<Card><h2>البلد واللغة</h2><form className="p-form" key={id+JSON.stringify(resource.data.profile)} onSubmit={e=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.currentTarget));void mutation.run(()=>backend.put(`/digital-documents/user/${id}/profile`,body),()=>resource.refresh());}}>
 <Field label="البلد" name="country" list="digital-countries" maxLength={100} defaultValue={resource.data.profile.country||''} disabled={admin} /><datalist id="digital-countries">{['السعودية','الإمارات','الكويت','قطر','البحرين','عمان','مصر','الأردن','الهند','باكستان','فرنسا','اليابان'].map(v=><option key={v} value={v}/>)}</datalist>
 <Field label="اللغة" name="language" list="digital-languages" maxLength={100} defaultValue={resource.data.profile.language||''} disabled={admin}/><datalist id="digital-languages">{['العربية','الإنجليزية','الفرنسية','الأردية','الهندية','اليابانية','الصينية'].map(v=><option key={v} value={v}/>)}</datalist>
 {!admin&&<Button type="submit" busy={mutation.busy}>حفظ البلد واللغة</Button>}</form></Card>}
 {!admin&&<Button onClick={()=>setAdding(v=>!v)}>إضافة وثيقة رقمية</Button>}
 {adding&&<Card><form className="p-form" onSubmit={e=>{e.preventDefault();const body=new FormData(e.currentTarget);const f=body.get('file');if(!f?.size)body.delete('file');if(!body.get('expiryDate'))body.delete('expiryDate');void mutation.run(()=>backend.post(`/digital-documents/user/${id}`,body),refresh);}}>
 <Field label="نوع الوثيقة"><select name="documentType" required>{['جواز السفر','الإقامة','الهوية الوطنية','التأشيرة','رخصة القيادة','وثيقة أخرى'].map(v=><option key={v}>{v}</option>)}</select></Field>
 <Field label="رقم الوثيقة (اختياري)" name="documentNumber" maxLength={100}/><Field label="تاريخ الانتهاء (اختياري)" name="expiryDate" type="date"/><Field label="الملف (اختياري)" name="file" type="file" accept="application/pdf,image/png,image/jpeg" hint="PDF أو PNG أو JPEG، حتى 5 ميجابايت."/>
 <Button type="submit" busy={mutation.busy}>حفظ الوثيقة</Button></form></Card>}
 <div className="p-grid two">{resource.data.documents.map(doc=><Card key={doc.id}><h2>{doc.documentType}</h2><p><strong>{doc.status==='APPROVED'?'معتمدة':'بانتظار المراجعة'}</strong></p>{admin&&<p>رقم المستخدم: {doc.userId}</p>}<p>رقم الوثيقة: {doc.documentNumber||'غير محدد'}</p><p>تاريخ الانتهاء: {doc.expiryDate||'غير محدد'}</p><div className="p-actions">{admin&&doc.status==='PENDING'&&<Button onClick={()=>setApproving(doc)}>اعتماد الوثيقة</Button>}{doc.hasFile&&<Button onClick={()=>mutation.run(()=>download(doc))}>تحميل الوثيقة</Button>}{!admin&&<Button variant="danger" onClick={()=>setRemoving(doc)}>حذف</Button>}</div></Card>)}</div>
 {!resource.data.documents.length&&<StateBlock title={admin&&!target?"لا توجد وثائق بانتظار المراجعة":"لم تضف وثائق رقمية بعد"}/>}</>}</ResourceState>
 {approving&&<Confirm message="اعتماد هذه الوثيقة؟" busy={mutation.busy} onClose={()=>setApproving(null)} onConfirm={()=>mutation.run(()=>backend.patch(`/digital-documents/${approving.id}/approve`),()=>{setApproving(null);resource.refresh();})}/>}
 {removing&&<Confirm message="حذف الوثيقة الرقمية نهائيًا؟" danger busy={mutation.busy} onClose={()=>setRemoving(null)} onConfirm={()=>mutation.run(()=>backend.delete(`/digital-documents/${removing.id}`),refresh)}/>}
 </>;
}
