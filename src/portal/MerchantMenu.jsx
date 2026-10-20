import Words from "./Words";import { useState } from 'react';
import { backend, list } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Badge, Button, Card, Confirm, Field, Modal, Money, PageHeading, ResourceState, StateBlock, Table, Tabs } from './ui';

export default function MerchantMenu() {
  const { session, notify } = usePortal();
  const resource = useResource(`menus/${session.id}`, () => backend.menus(session.id));
  const [menuId, setMenuId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [editor, setEditor] = useState(null);
  const [newMenu, setNewMenu] = useState(false);
  const [disable, setDisable] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const mutation = useMutation();
  const menus = resource.data || [];
  const menu = menus.find((m) => m.id === menuId) || menus[0];
  const items = list(menu?.menuItems).filter((i) => filter === 'all' || filter === 'active' && i.available || filter === 'inactive' && !i.available);
  const selectMenu = (id) => {setMenuId(id);setPreview(null);setFile(null);};
  const saveMenu = (event) => {
    event.preventDefault();const name = new FormData(event.currentTarget).get('name').trim();
    mutation.run(() => backend.post(`/menus/restaurant/${session.id}`, { name }), () => {setNewMenu(false);resource.refresh();});
  };
  const saveItem = (event) => {
    event.preventDefault();const form = new FormData(event.currentTarget);
    const item = { name: String(form.get('name')).trim(), description: String(form.get('description')).trim() || null, price: Number(form.get('price')), available: form.get('available') === 'on' };
    if (item.available && item.price <= 0) {notify('أدخلي سعرًا أكبر من صفر قبل إتاحة المنتج', 'error');return;}
    mutation.run(() => editor.id ? backend.put(`/menus/items/${editor.id}/restaurant/${session.id}`, item) : backend.post(`/menus/${menu.id}/restaurant/${session.id}/items`, item), () => {setEditor(null);resource.refresh();});
  };
  const activate = (item) => {
    if (!item.name?.trim() || item.name.startsWith('[INCOMPLETE NAME]') || Number(item.price) <= 0) {setEditor(item);return;}
    mutation.run(() => backend.put(`/menus/items/${item.id}/restaurant/${session.id}`, { name: item.name, description: item.description, price: item.price, available: true }), resource.refresh, 'تمت إتاحة المنتج');
  };
  const analyze = async (event) => {
    event.preventDefault();setPreview(null);
    if (!file || !file.name.toLowerCase().endsWith('.pdf') || file.size > 5 * 1024 * 1024) {notify('اختاري ملف PDF لا يتجاوز 5 ميجابايت', 'error');return;}
    const body = new FormData();body.append('file', file);
    await mutation.run(() => backend.post(`/menus/${menu.id}/restaurant/${session.id}/import/preview`, body, { timeout: 120000 }), setPreview, 'اكتمل التحليل. راجعي المنتجات قبل تأكيد الإضافة.');
  };
  const confirmImport = () => mutation.run(() => backend.post(`/menus/${menu.id}/restaurant/${session.id}/import/confirm`), (rows) => {
    notify(`تمت إضافة ${list(rows).length} منتج. تم تجاوز الأسماء الموجودة مسبقًا.`);
    setPreview(null);setFile(null);setImportOpen(false);resource.refresh();
  }, '');
  return <>
    <PageHeading title="المنيو"><Button onClick={() => setEditor({ name: '', description: '', price: '', available: true })} disabled={!menu}><Words>صنف جديد</Words></Button><Button variant="secondary" onClick={() => setNewMenu(true)}><Words>قائمة جديدة</Words></Button><Button variant="secondary" onClick={() => {setImportOpen(true);setPreview(null);}} disabled={!menu}><Words>استيراد PDF بالذكاء الاصطناعي</Words></Button></PageHeading>
    <ResourceState resource={resource}>
      <Words>{!menus.length ? <StateBlock title="لم تُنشأ قائمة بعد"><Button onClick={() => setNewMenu(true)}><Words>إنشاء قائمة</Words></Button></StateBlock> : <div className="p-grid side"><div className="p-stack"><div className="p-row"><h2><Words>{menu?.name}</Words></h2><small className="p-caption"><Words>{items.length}</Words><Words> منتجات</Words></small></div><Tabs value={filter} onChange={setFilter} options={[["all", "الكل"], ["active", "المتاحة"], ["inactive", "غير النشطة"]]} />
        <Table rows={items} empty="لا توجد منتجات في هذه القائمة" columns={[
            { key: 'name', label: 'الصنف', render: (i) => i.name?.startsWith('[INCOMPLETE NAME]') ? 'منتج بحاجة إلى اسم' : i.name },
            { key: 'description', label: 'الوصف', render: (i) => i.description || '—' },
            { key: 'price', label: 'السعر', render: (i) => <Money value={i.price} /> },
            { key: 'available', label: 'التوفر', render: (i) => <Badge value={i.available ? 'ACTIVE' : 'INACTIVE'}><Words>{i.available ? 'متاح' : 'غير نشط'}</Words></Badge> },
            { key: 'actions', label: 'الإجراء', render: (i) => <div className="p-actions"><button className="p-link" onClick={() => setEditor(i)}><Words>تعديل</Words></button><button className={`p-link ${i.available ? 'danger' : ''}`} disabled={mutation.busy} onClick={() => i.available ? setDisable(i) : activate(i)}><Words>{i.available ? 'تعطيل' : 'إتاحة'}</Words></button></div> }]
            } /><p className="p-caption"><Words>المنتجات غير النشطة محفوظة داخل المنيو. اكتمل الاسم والسعر لإتاحتها، والوصف اختياري.</Words></p></div>
        <Card><h3><Words>القوائم</Words></h3><div className="p-menu-list"><Words>{menus.map((m) => <button className={menu.id === m.id ? 'active' : ''} key={m.id} onClick={() => selectMenu(m.id)}><strong><Words>{m.name}</Words></strong><small><Words>{list(m.menuItems).length}</Words><Words> أصناف</Words></small></button>)}</Words></div></Card></div>}</Words>
    </ResourceState>
    {newMenu && <Modal title="قائمة جديدة" onClose={() => setNewMenu(false)} busy={mutation.busy}><form className="p-form" onSubmit={saveMenu}><Field name="name" label="اسم القائمة" maxLength={100} required /><div className="p-actions"><Button type="submit" busy={mutation.busy}><Words>إنشاء</Words></Button><Button variant="secondary" onClick={() => setNewMenu(false)} disabled={mutation.busy}><Words>إلغاء</Words></Button></div></form></Modal>}
    {editor && <Modal title={editor.id ? 'تعديل المنتج' : 'منتج جديد'} onClose={() => setEditor(null)} busy={mutation.busy}><form className="p-form" onSubmit={saveItem}><Field label="الاسم" name="name" defaultValue={editor.name?.startsWith('[INCOMPLETE NAME]') ? '' : editor.name} required maxLength={100} /><Field label="الوصف (اختياري)"><textarea name="description" defaultValue={editor.description || ''} maxLength={500} /></Field><Field label="السعر بالريال" name="price" defaultValue={editor.price} type="number" required min="0" max="99999999.99" step="0.01" /><label className="p-row"><span><Words>متاح للشراء</Words></span><input name="available" type="checkbox" defaultChecked={editor.available} /></label><div className="p-actions"><Button type="submit" busy={mutation.busy}><Words>حفظ</Words></Button><Button variant="secondary" onClick={() => setEditor(null)} disabled={mutation.busy}><Words>إلغاء</Words></Button></div></form></Modal>}
    {disable && <Confirm title="تعطيل المنتج" message={`سيُخفى ${disable.name} عن الشراء، ويبقى محفوظًا في المنيو وسجل الطلبات.`} danger onClose={() => setDisable(null)} busy={mutation.busy} onConfirm={() => mutation.run(() => backend.delete(`/menus/items/${disable.id}/restaurant/${session.id}`), () => {setDisable(null);resource.refresh();}, 'تم تعطيل المنتج')} />}
    {importOpen && menu && <Modal title={`استيراد منتجات إلى ${menu.name}`} wide onClose={() => setImportOpen(false)} busy={mutation.busy}>
      <p className="p-notice"><Words>ارفعي كتالوجًا لأي منتجات لها أسعار. التحليل معاينة فقط؛ الحفظ يحدث بعد الضغط على تأكيد الإضافة.</Words></p><form className="p-form" onSubmit={analyze}><div className="p-file-drop"><Field label="ملف PDF · حتى 5 ميجابايت"><input type="file" accept="application/pdf,.pdf" onChange={(e) => {setFile(e.target.files[0] || null);setPreview(null);}} disabled={mutation.busy} required /></Field></div><Button type="submit" busy={mutation.busy} disabled={!file}><Words>تحليل الملف</Words></Button></form>
      <Words>{preview && <><p><Words>{list(preview.items).length}</Words><Words> منتجات في المعاينة</Words></p><Table rowKey={(i) => i._key} rows={list(preview.items).map((i, index) => ({ ...i, _key: index }))} columns={[{ key: 'name', label: 'الاسم', render: (i) => i.name || 'بحاجة إلى اسم' }, { key: 'description', label: 'الوصف' }, { key: 'price', label: 'السعر', render: (i) => <Money value={i.price} /> }, { key: 'available', label: 'الحالة', render: (i) => <Badge value={i.available ? 'ACTIVE' : 'INACTIVE'} /> }]} />{list(preview.warnings).map((w, i) => <p className="p-notice warning" key={i}><Words>{w}</Words></p>)}<p className="p-caption"><Words>تُضاف جميع المنتجات. ناقص الاسم أو السعر يُحفظ غير نشط، والسعر غير الواضح صفر. تُتجاوز الأسماء المكررة. المعاينة تنتهي بعد 30 دقيقة أو إعادة تشغيل الخادم.</Words></p><Button onClick={confirmImport} busy={mutation.busy} disabled={!list(preview.items).length}><Words>تأكيد إضافة جميع المنتجات</Words></Button></>}</Words>
    </Modal>}
  </>;
}
