'use client';
import {useEffect,useState} from 'react';
import Link from '@/components/native-link';
import {useProgress} from '@/app/shell';
type Queue={alerts:{id:string;title:string;severity:string;status:string;closedAt:string|null}[];cases:{id:string;title:string;status:string;severity:string;updatedAt:string}[]};
type Snapshot={account:string;data:Queue|null;error:string};
const status:Record<string,string>={New:'جديد',Investigating:'قيد التحقيق',Escalated:'مصعّد',Resolved:'محلول','False Positive':'إنذار كاذب'};
const severity:Record<string,string>={Critical:'حرج',High:'مرتفع',Medium:'متوسط',Low:'منخفض'};
export const alertTrainingHref=(id:string)=>'/soc/alerts/'+encodeURIComponent(id)+(id==='SOC-002'?'?view=guided':['SOC-004','SOC-010'].includes(id)?'?view=defensive':'');
export default function OperationsDesk(){
 const {user}=useProgress(),account=user?.email||'guest';
 const [snapshot,setSnapshot]=useState<Snapshot>({account:'',data:null,error:''}),[retry,setRetry]=useState(0);
 useEffect(()=>{
  if(account==='guest')return;const controller=new AbortController();let current=true;
  void (async()=>{try{const response=await fetch('/api/soc',{cache:'no-store',signal:controller.signal}),data=await response.json() as Queue&{error?:string};if(!response.ok)throw Error(data.error||'تعذر استعادة القضايا.');if(current)setSnapshot({account,data,error:''})}catch(e){if(current)setSnapshot({account,data:null,error:e instanceof Error?e.message:'تعذر الاتصال.'})}})();
  return()=>{current=false;controller.abort()};
 },[account,retry]);
 if(!user)return <section className="training-focus"><div><span className="eyebrow">تحقيق موجّه</span><h2>من الرسالة إلى نشاط الحساب</h2><p>ابدأ بـFirst Signal: افحص الرسالة، ثم اربطها بالدخول ونشاط الجهاز قبل قرار الاحتواء.</p></div><Link className="primary-button" href="/campaigns/first-signal">افتح التحقيق</Link></section>;
 if(snapshot.account!==account||(!snapshot.data&&!snapshot.error))return <section className="panel" role="status">جارٍ استعادة عملك في العمليات…</section>;
 if(snapshot.error)return <section className="panel"><p role="alert">{snapshot.error}</p><button type="button" className="secondary-button" onClick={()=>{setSnapshot({account,data:null,error:''});setRetry(n=>n+1)}}>إعادة المحاولة</button></section>;
 const cases=snapshot.data!.cases.filter(c=>c.status!=='Resolved'),alerts=snapshot.data!.alerts.filter(a=>a.status!=='New'&&!a.closedAt);
 const entries=[...cases.map(c=>({...c,href:'/soc/cases/'+encodeURIComponent(c.id),kind:'قضية'})),...alerts.map(a=>({...a,href:alertTrainingHref(a.id),kind:'تنبيه'}))].slice(0,3);
 return <section className="operations-desk" aria-labelledby="operations-work"><div className="between"><h2 id="operations-work">عملك الجاري</h2><Link href="/soc">جميع التنبيهات والقضايا</Link></div>{entries.length?<ul>{entries.map(e=><li key={e.kind+e.id}><Link href={e.href}><span>{e.kind} · <bdi>{e.id}</bdi></span><strong>{e.title}</strong><small>{status[e.status]||e.status} · خطورة {severity[e.severity]||e.severity}</small><em>استكمل الفحص</em></Link></li>)}</ul>:<div><p>لا توجد قضايا أو تنبيهات قيد العمل. اختر تحقيقًا لبدء جمع الأدلة.</p><Link className="primary-button" href="/campaigns/first-signal">ابدأ First Signal</Link></div>}</section>;
}
