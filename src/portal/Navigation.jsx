import Words from "./Words"; /* eslint-disable react-refresh/only-export-components -- Plan helpers are colocated with their screens. */
import { useState } from 'react';
import { backend, dateText, list, routeTo } from './client';
import { useMutation, usePortal, useResource } from './state';
import { Badge, Button, Card, Confirm, Field, Icon, Modal, PageHeading, ResourceState, StateBlock } from './ui';

export function readPlan(id) {try {const value=JSON.parse(localStorage.getItem(`expo-plan-${id}`));return Array.isArray(value)?value:[];} catch {return [];}}
export function addToPlan(id, destination) {
  const next = [...readPlan(id).filter((x) => x.id !== destination.id), destination];
  localStorage.setItem(`expo-plan-${id}`, JSON.stringify(next));return next;
}
export function MapPage({ destinationId = null }) {
  const { session, notify } = usePortal();
  const resource = useResource(`map-nodes-destinations-${session.id}`, async () => {
    const [nodes, destinations, visits] = await Promise.all([backend.get('/map-nodes'), backend.get('/destinations'), backend.get(`/user-destination-progress/user/${session.id}/passport`)]);
    return { nodes: list(nodes), destinations: list(destinations), visits: list(visits) };
  });
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [route, setRoute] = useState(null);
  const [selected, setSelected] = useState(destinationId ? Number(destinationId) : null);
  const [confirm, setConfirm] = useState(false);
  const [lastVisit, setLastVisit] = useState(null);
  const mutation = useMutation();
  const nodes = resource.data?.nodes || [];
  const destinations = resource.data?.destinations || [];
  const active = destinations.filter((d) => d.status === 'ACTIVE');
  // Once a destination is selected, keep only the journey endpoints visible.
  // Intermediate route points remain in the polyline so corridor turns are preserved.
  const visibleNodes = end ? nodes.filter((node) => String(node.id) === start || String(node.id) === end) : nodes;
  const destination = destinations.find((d) => d.id === selected);
  const visited = resource.data?.visits.some((v) => v.destination?.id === selected);
  const findRoute = () => mutation.run(() => backend.get('/navigation/route', { params: { startNodeId: start, endNodeId: end } }), setRoute, '');
  const markVisit = () => mutation.run(() => backend.post('/user-destination-progress/visit', { userId: session.id, destinationId: selected }), (data) => {setConfirm(false);setLastVisit(data);resource.refresh();}, 'سُجلت الزيارة في جواز إكسبو');
  return <><PageHeading title="الخريطة التفاعلية" description="اختاري نقطة البداية والوجهة لحساب المسار داخل المعرض." /><ResourceState resource={resource}>
    <div className="p-grid split"><div className="p-stack"><div className="p-map-visual"><img src="/Expo%20MockMap.jpg" alt="خريطة أجنحة المعرض" />
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="نقاط المسار">
        <Words>{route?.points?.length > 0 && <polyline className="p-map-path" points={route.points.map((p) => `${Number(p.x) * 1000},${Number(p.y) * 1000}`).join(' ')} />}</Words>
        <Words>{visibleNodes.filter((n) => Number.isFinite(Number(n.x)) && Number.isFinite(Number(n.y))).map((n) => <circle key={n.id} className={`p-map-point ${String(n.id) === end ? 'selected' : ''}`} cx={Number(n.x) * 1000} cy={Number(n.y) * 1000} r={12} tabIndex={0} role="button" aria-label={n.name} onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setEnd(String(n.id));setRoute(null);}}} onClick={() => {setEnd(String(n.id));setSelected(n.destination?.id || n.destinationId || null);setRoute(null);}}><title><Words>{n.name}</Words></title></circle>)}</Words>
      </svg></div><p className="p-caption"><Words>المسار يعتمد على نقاط وروابط الخريطة المسجلة لدى إدارة المعرض.</Words></p>
      <div className="p-grid two"><Words>{active.map((d) => <Card key={d.id}><div className="p-actions"><Badge value="ACTIVE"><Words>متاحة الآن</Words></Badge><Badge><Words>{d.type}</Words></Badge></div><h3><Words>{d.name}</Words></h3><p className="p-muted"><Words>{d.description}</Words></p><Button variant="ghost" onClick={() => setSelected(d.id)}><Words>التفاصيل</Words></Button></Card>)}</Words></div>
    </div><Card className="p-form"><h2><Words>حساب المسار</Words></h2><Field label="نقطة البداية"><select value={start} onChange={(e) => {setStart(e.target.value);setRoute(null);}}><option value=""><Words>اختاري نقطة البداية</Words></option><Words>{nodes.map((n) => <option key={n.id} value={n.id}><Words>{n.name}</Words></option>)}</Words></select></Field><Field label="الوجهة"><select value={end} onChange={(e) => {setEnd(e.target.value);setRoute(null);}}><option value=""><Words>اختاري الوجهة</Words></option><Words>{nodes.map((n) => <option key={n.id} value={n.id}><Words>{n.name}</Words></option>)}</Words></select></Field><Button busy={mutation.busy} disabled={!start || !end || start === end} onClick={findRoute}><Words>ابدأ المسار</Words></Button><Words>{route && <><p><Words>المسافة المحسوبة: </Words><Words>{route.totalDistance}</Words></p><ol className="p-route-points"><Words>{list(route.points).map((p, i) => <li key={i}><Words>{p.name || `نقطة ${i + 1}`}</Words></li>)}</Words></ol><Button variant="secondary" onClick={() => setRoute(null)}><Words>مسح المسار</Words></Button></>}</Words></Card></div>
  </ResourceState>
  {destination && <Modal title={destination.name} onClose={() => setSelected(null)}><div className="p-actions"><Badge value={destination.status} /><Badge><Words>{destination.type}</Words></Badge></div><p><Words>{destination.description || 'لم يُضف وصف لهذه الوجهة.'}</Words></p><div className="p-actions"><Button disabled={visited || destination.status !== 'ACTIVE'} onClick={() => setConfirm(true)}><Words>{visited ? 'سبق تسجيل الزيارة' : 'سجّل زيارتي'}</Words></Button><Button variant="secondary" onClick={() => {addToPlan(session.id, destination);notify('أضيفت الوجهة إلى خطتك');}}><Words>أضف إلى خطتي</Words></Button></div><p className="p-caption"><Words>سجّلي زيارتك عند وجودك في الوجهة لتُضاف إلى جواز إكسبو.</Words></p></Modal>}
  {confirm && <Confirm title="تسجيل زيارة" message={`تأكيد وجودك في ${destination?.name} وتسجيل الزيارة؟`} onClose={() => setConfirm(false)} busy={mutation.busy} onConfirm={markVisit} />}
  {lastVisit && <div className="p-notice p-row"><span><Words>تم تسجيل الزيارة</Words></span><Button variant="ghost" busy={mutation.busy} onClick={() => mutation.run(() => backend.delete(`/user-destination-progress/${lastVisit.id}`), () => {setLastVisit(null);resource.refresh();}, 'تم التراجع عن الزيارة')}><Words>تراجع</Words></Button><button className="p-link" onClick={() => setLastVisit(null)}><Words>إغلاق</Words></button></div>}
  </>;
}
export function Plan() {
  const { session } = usePortal();
  const [plan, setPlan] = useState(() => readPlan(session.id));
  const save = (next) => {setPlan(next);localStorage.setItem(`expo-plan-${session.id}`, JSON.stringify(next));};
  const move = (index, step) => {const next = [...plan];[next[index], next[index + step]] = [next[index + step], next[index]];save(next);};
  return <><PageHeading title="خطتي لليوم" description="خطة محفوظة على هذا الجهاز. لا تُحسب ضمن زيارات جواز إكسبو." />{!plan.length ? <StateBlock title="لم تضيفي محطات إلى خطتك"><Button onClick={() => routeTo('visitor/map')}><Words>استكشاف الخريطة</Words></Button></StateBlock> : <div className="p-stack"><Words>{plan.map((d, index) => <Card key={d.id}><div className="p-row"><div><span className="p-caption"><Words>المحطة </Words><Words>{index + 1}</Words></span><h2><Words>{d.name}</Words></h2><p className="p-muted"><Words>{d.description}</Words></p></div><div className="p-actions"><Button variant="secondary" disabled={index === 0} onClick={() => move(index, -1)}><Words>أعلى</Words></Button><Button variant="secondary" disabled={index === plan.length - 1} onClick={() => move(index, 1)}><Words>أسفل</Words></Button><Button variant="ghost" onClick={() => routeTo('visitor/map', d.id)}><Words>الخريطة</Words></Button><button className="p-link danger" onClick={() => save(plan.filter((x) => x.id !== d.id))}><Words>حذف</Words></button></div></div></Card>)}</Words></div>}</>;
}
export function Passport() {
  const { session } = usePortal();
  const resource = useResource(`passport/${session.id}`, async () => {
    const [visits, progress] = await Promise.all([backend.get(`/user-destination-progress/user/${session.id}/passport`), backend.get(`/user-destination-progress/user/${session.id}/passport/progress`).catch(() => null)]);
    return { visits: list(visits).sort((a, b) => String(b.visitedAt).localeCompare(String(a.visitedAt))), percentage: progress?.progressPercentage ?? null };
  });
  const [open, setOpen] = useState(true);
  const data = resource.data;
  return <><PageHeading title="جواز إكسبو" description="سجلك الرقمي للوجهات التي زرتها، وتقدمك في استكشافها."><Button variant="secondary" onClick={resource.refresh} busy={resource.loading}><Words>تحديث</Words></Button></PageHeading><ResourceState resource={resource}>
    <div className="p-grid split"><section className={`p-passport-paper ${open ? '' : 'passport-closed'}`}><div className="p-row"><h2><Words>جواز إكسبو</Words><br /><Words>سجل الزيارات</Words></h2><Icon name="PpEmblem" size={56} /></div><p><Words>{list(data?.visits).length}</Words><Words> زيارات</Words></p><hr className="p-rule" /><Words>{!data?.visits.length ? <StateBlock title="أول ختم لك يبدأ هنا"><Button onClick={() => routeTo('visitor/map')}><Words>استكشاف الخريطة</Words></Button></StateBlock> : <div className="p-grid two"><Words>{data.visits.map((v) => <article className="p-visit-stamp" key={v.id}><div className="p-row"><Badge value="SUCCESS"><Words>تمت الزيارة</Words></Badge><Badge><Words>{v.destination?.type}</Words></Badge></div><h3><Words>{v.destination?.name || 'وجهة'}</Words></h3><p><Words>{v.destination?.description}</Words></p><p><Words>{dateText(v.visitedAt)}</Words></p><div className="p-visit-seal"><span><Words>MIHWAR</Words></span><Icon name="PpEmblem" size={20} /><span><Words>VISITED</Words></span></div></article>)}</Words></div>}</Words></section>
    <Card className="p-stack"><button className={`p-passport-cover ${open ? 'book-open' : ''}`} onClick={() => setOpen((v) => !v)} aria-pressed={open}><Icon name="PpEmblem" size={36} /><small><Words>KINGDOM OF SAUDI ARABIA</Words></small><strong><Words>VISITOR PASSPORT</Words></strong><small><Words>MIHWAR · EXPO RIYADH</Words></small></button><h3><Words>تقدمك في استكشاف إكسبو</Words></h3><div className="p-row"><span><Words>زرت </Words><Words>{data?.visits.length || 0}</Words><Words> وجهات</Words></span><strong className="p-progress-number"><Words>{data?.percentage == null ? '—' : `${Number(data.percentage).toFixed(0)}%`}</Words></strong></div><div className="p-progress"><span style={{ width: `${Math.max(0, Math.min(100, data?.percentage || 0))}%` }} /></div><Words>{data?.percentage == null && <p className="p-caption"><Words>تعذر تحميل نسبة التقدم. سجل الزيارات ظاهر أدناه.</Words></p>}</Words><p className="p-caption"><Words>جواز إكسبو سجل استكشافك، وليس وثيقة سفر أو تذكرة دخول.</Words></p><div className="p-actions"><Button variant="secondary" onClick={() => routeTo('visitor/plan')}><Words>خطتي لليوم</Words></Button><Button variant="ghost" onClick={() => routeTo('visitor/map')}><Words>استكشف الخريطة</Words></Button></div></Card></div>
  </ResourceState></>;
}
