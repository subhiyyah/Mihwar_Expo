import { healthGroups } from "./healthFields";
import { useEffect, useRef, useState } from 'react';
import Words from './Words';
import { backend, dateText, list, problem } from './client';
import { useMutation, usePortal } from './state';
import { Badge, Button, Card, Field, Modal } from './ui';

// Refresh silently: the list stays visible while the clinic receives new requests.
function useAssistanceFeed(path) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion(v => v + 1);
  useEffect(() => {
    let alive = true, timer;
    const load = async () => {
      try { const data = await backend.get(path); if (alive) {setRows(list(data));setError('');} }
      catch (e) {if (alive) setError(problem(e));}
      finally {if (alive) {setLoading(false);timer = setTimeout(load, 10000);}}
    };
    void load();
    return () => {alive = false;clearTimeout(timer);};
  }, [path, version]);
  return {rows, error, loading, refresh};
}
const labels = {PENDING: 'بانتظار قبول العيادة', ACCEPTED: 'قبلت العيادة طلبك', COMPLETED: 'تم إنهاء طلب المساعدة', CANCELLED: 'أُلغي الطلب'};
function RequestCard({ request, children }) {
  return <Card><div className="p-row"><h3><Words>طلب مسعف #</Words>{request.id}</h3><Badge value={request.status}><Words>{labels[request.status]}</Words></Badge></div><p><strong><Words>الموقع: </Words></strong><Words>{request.locationDescription}</Words></p>{request.note && <p><Words>{request.note}</Words></p>}{request.clinicName && <p><Words>العيادة: </Words><Words>{request.clinicName}</Words></p>}<p className="p-caption">{dateText(request.createdAt)}</p>{children}</Card>;
}
export function VisitorAssistance() {
  const {session, notify} = usePortal();
  const feed = useAssistanceFeed(`/paramedic-requests/user/${session.id}`);
  const [open, setOpen] = useState(false);
  const mutation = useMutation();
  const previous = useRef({});
  const hasOpen = feed.rows.some(row => ['PENDING','ACCEPTED'].includes(row.status));
  useEffect(() => {
    for (const row of feed.rows) {
      if (previous.current[row.id] === 'PENDING' && row.status === 'ACCEPTED') notify(`تم قبول طلبك من عيادة ${row.clinicName}`);
      previous.current[row.id] = row.status;
    }
  }, [feed.rows, notify]);
  return <section className="p-stack" aria-label="طلب مسعف"><Card><div className="p-row"><div><h2><Words>طلب مسعف</Words></h2><p className="p-muted"><Words>اكتبي موقعك يدويًا ليظهر طلبك للعيادات داخل المنصة.</Words></p></div><Button variant="danger" disabled={hasOpen || feed.loading || !!feed.error} onClick={() => setOpen(true)}><Words>طلب مسعف</Words></Button></div><p className="p-caption"><Words>يصل موقعك وملاحظتك إلى العيادات، ويمكن لمقدم الرعاية عرض بطاقتك الصحية من طلب المساعدة.</Words></p></Card>
    <div role="status" aria-live="polite">{feed.error ? <p className="p-notice"><Words>{feed.error}</Words></p> : hasOpen && <p className="p-notice"><Words>لديك طلب مساعدة مفتوح. تتحدث حالته تلقائيًا كل 10 ثوانٍ.</Words></p>}</div>
    {feed.rows.slice(0,5).map(row => <RequestCard key={row.id} request={row}>{row.status === 'PENDING' && <Button variant="secondary" busy={mutation.busy} onClick={() => mutation.run(() => backend.post(`/paramedic-requests/${row.id}/cancel?userId=${session.id}`), feed.refresh, 'تم إلغاء الطلب')}><Words>إلغاء طلب المساعدة</Words></Button>}</RequestCard>)}
    {open && <Modal title="طلب مسعف" onClose={() => setOpen(false)} busy={mutation.busy}><form className="p-form" onSubmit={(event) => {event.preventDefault();const body=Object.fromEntries(new FormData(event.currentTarget));void mutation.run(() => backend.post(`/paramedic-requests/user/${session.id}`, body), () => {setOpen(false);feed.refresh();}, 'أُرسل طلب المساعدة إلى العيادات');}}><Field label="موقعك بالتفصيل" hint="مثال: جناح السعودية، بجوار المدخل، عند النافورة."><textarea name="locationDescription" required maxLength={500} rows={3} /></Field><Field label="ملاحظة للعيادة (اختياري)"><textarea name="note" maxLength={1000} rows={2} /></Field><Button type="submit" busy={mutation.busy}><Words>إرسال طلب المسعف</Words></Button></form></Modal>}
  </section>;
}
export function ClinicRequests() {
  const {session} = usePortal();
  const feed = useAssistanceFeed(`/paramedic-requests/clinic/inbox?caregiverId=${session.id}`);
  const mutation = useMutation();
  const [healthRequest, setHealthRequest] = useState(null);
  const pending = feed.rows.filter(row => row.status === 'PENDING');
  return <section className="p-stack"><div className="p-row"><h1><Words>طلبات المسعف</Words></h1><Button variant="secondary" onClick={feed.refresh}><Words>تحديث</Words></Button></div><p className="p-caption"><Words>تتحدث الطلبات تلقائيًا كل 10 ثوانٍ. عند قبول طلب يُحجز لعيادتك ويختفي من قوائم العيادات الأخرى.</Words></p><div role="status" aria-live="polite"><p className="p-notice"><Words>طلبات بانتظار القبول: </Words>{pending.length}</p>{feed.error && <p className="p-notice"><Words>{feed.error}</Words></p>}</div>{!feed.loading && !feed.error && !feed.rows.length && <Card><Words>لا توجد طلبات مسعف حاليًا.</Words></Card>}{feed.rows.map(row => <RequestCard key={row.id} request={row}><p><Words>الزائر: </Words><Words>{row.visitorName}</Words></p>{row.reporterName && <div><h3><Words>بيانات مقدم البلاغ</Words></h3><p><Words>الاسم: </Words><Words>{row.reporterName}</Words></p><p><Words>رقم الجوال: </Words><a dir="ltr" href={`tel:${row.reporterPhone}`}>{row.reporterPhone}</a></p></div>}<Button variant="secondary" onClick={() => setHealthRequest(row)}><Words>عرض البطاقة الصحية</Words></Button>{row.status === 'PENDING' && <Button busy={mutation.busy} onClick={() => mutation.run(() => backend.post(`/paramedic-requests/${row.id}/accept?caregiverId=${session.id}`), feed.refresh, 'قبلت عيادتك طلب المساعدة')}><Words>قبول طلب المسعف</Words></Button>}{row.status === 'ACCEPTED' && <Button variant="secondary" busy={mutation.busy} onClick={() => mutation.run(() => backend.post(`/paramedic-requests/${row.id}/complete?caregiverId=${session.id}`), feed.refresh, 'تم إنهاء طلب المساعدة')}><Words>إنهاء طلب المساعدة</Words></Button>}</RequestCard>)}{healthRequest && <RequestHealthCard request={healthRequest} caregiverId={session.id} onClose={() => setHealthRequest(null)} />}</section>;
}

function RequestHealthCard({ request, caregiverId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    backend.get(`/paramedic-requests/${request.id}/health-card?caregiverId=${caregiverId}`)
      .then(value => {if (alive) setData(value);})
      .catch(e => {if (alive) setError(problem(e));});
    return () => {alive = false;};
  }, [request.id, caregiverId]);
  return <Modal title="البطاقة الصحية لصاحب الطلب" onClose={onClose} wide>
    <h3><Words>{request.visitorName}</Words></h3>
    {error ? <p className="p-notice error" role="alert"><Words>{error}</Words></p>
      : !data ? <p role="status"><Words>جارٍ تحميل البطاقة الصحية...</Words></p>
      : !data.available ? <p className="p-notice"><Words>لم ينشئ صاحب الطلب بطاقة صحية، أو حُذفت البطاقة.</Words></p>
      : <div className="p-stack"><p className="p-caption"><Words>المعلومات الصحية الحالية كما أدخلها صاحب البطاقة.</Words></p>
        <p className="p-caption"><Words>آخر تحديث: </Words>{dateText(data.updatedAt)}</p>
        {healthGroups.map(([title, fields]) => <Card key={title}><h3><Words>{title}</Words></h3><dl className="p-grid two">{fields.map(([key, label]) => {
          const value = data.fields[key];
          return <div key={key}><dt className="p-muted"><Words>{label}</Words></dt><dd style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',margin:0}} dir={key === 'bloodType' ? 'ltr' : undefined}><Words>{Array.isArray(value) ? value.join('، ') || 'غير مسجل' : value || 'غير مسجل'}</Words></dd></div>;
        })}</dl></Card>)}
      </div>}
  </Modal>;
}

