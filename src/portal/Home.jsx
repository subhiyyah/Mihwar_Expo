import Words from "./Words";import { backend, list, routeTo } from './client';
import { usePortal, useResource } from './state';
import { readPlan } from './Navigation';
import { Button, Card, Icon, PageHeading, ResourceState } from './ui';

export default function Home() {
  const { session, account } = usePortal();
  const resource = useResource(`home/${session.id}`, async () => {
    const [visits, progress, orders] = await Promise.all([backend.get(`/user-destination-progress/user/${session.id}/passport`), backend.get(`/user-destination-progress/user/${session.id}/passport/progress`).catch(() => null), backend.get(`/orders/user/${session.id}`)]);
    return { visits: list(visits), percentage: progress?.progressPercentage, orders: list(orders) };
  });
  const plan = readPlan(session.id);
  const [welcome, setWelcome] = useWelcomeHint();
  return <><PageHeading title={`أهلًا، ${account?.username || 'زائر إكسبو'}`} description="تجربتك في إكسبو تبدأ من محور." />
    {welcome && <div className="p-notice p-row"><div><h3><Words>أكمل تجهيز حسابك</Words></h3><div className="p-actions"><Button variant="ghost" onClick={() => routeTo('visitor/documents')}><Words>أضف تذاكرك</Words></Button><Button variant="ghost" onClick={() => routeTo('visitor/health')}><Words>البطاقة الصحية (اختيارية)</Words></Button><Button variant="ghost" onClick={() => routeTo('visitor/wallet')}><Words>اطلع على المحفظة</Words></Button></div></div><button className="p-link" onClick={() => setWelcome(false)} aria-label="إخفاء التلميح"><Words>×</Words></button></div>}
    <ResourceState resource={resource}><div className="p-grid two"><Card><div className="p-row"><h2><Words>جواز إكسبو</Words></h2><button className="p-link" onClick={() => routeTo('visitor/passport')}><Words>عرض جواز إكسبو</Words></button></div><p><Words>زرت </Words><Words>{resource.data?.visits.length || 0}</Words><Words> وجهات </Words><strong className="p-progress-number"><Words>{resource.data?.percentage == null ? '—' : `${Number(resource.data.percentage).toFixed(0)}%`}</Words></strong></p><p className="p-caption"><Words>من وجهات إكسبو المتاحة حاليًا</Words></p></Card><Card><div className="p-row"><h2><Words>خطتي لليوم</Words></h2><button className="p-link" onClick={() => routeTo('visitor/plan')}><Words>عرض خطتي</Words></button></div><Words>{plan.length ? plan.slice(0, 3).map((d, i) => <div className="p-row" key={d.id}><span><Words>{d.name}</Words></span><small><Words>المحطة </Words><Words>{i + 1}</Words></small></div>) : <p className="p-muted"><Words>أضيفي محطاتك من الخريطة.</Words></p>}</Words><p className="p-caption"><Words>محطات الخطة لا تُحسب تلقائيًا كزيارات.</Words></p></Card></div>
    <div className="p-grid four p-home-grid"><Words>{[
          ['sellers', 'المطاعم والمؤسسات', 'Utensils', 'اطلب واستلم من المؤسسة'],
          ['orders', 'طلباتي', 'Orders', `${list(resource.data?.orders).filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length} طلبات قيد التنفيذ`],
          ['wallet', 'المحفظة', 'Wallet', account?.wallet ? `الرصيد ${Number(account.wallet.balance).toFixed(2)} ر.س` : 'المحفظة الرقمية'],
          ['health', 'البطاقة الصحية', 'Health', 'اختيارية']].
          map(([path, title, icon, subtitle]) => <a href={`#visitor/${path}`} key={path} className="p-home-tile"><Card><Icon name={icon} size={28} /><h2><Words>{title}</Words></h2><p className="p-caption"><Words>{subtitle}</Words></p></Card></a>)}</Words></div></ResourceState>
  </>;
}
import { useState } from 'react';
function useWelcomeHint() {return useState(true);}
