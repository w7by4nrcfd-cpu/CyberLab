'use client';
/* eslint-disable @next/next/no-img-element */
import ActivityBrief from '@/components/activity-brief';
import JourneyShortcuts from '@/components/journey-shortcuts';
import LoadingState from '@/components/loading-state';
import LearningStartPreference,{useStartPreference} from '@/components/learning-start-preference';
import {startingActivity} from '@/lib/learning-start';
import {useEffect,useState} from 'react';
import {useProgress} from '@/app/shell';
import {firstPilot,pilotGuestKey} from '@/lib/mission-first-pilot';
import {coreJourney,coreNextStep} from '@/lib/mission-first-core';
type Network={state:{session:{networkFixed:string[]}}|null};
type Missions={states:{id:string;completedAt:string|null}[]};
type SocQueue={alerts:{id:string;status:string;closedAt:string|null}[]};
type Board={workspace:{status:string}};
export default function CoreJourneyStart({onAdvanced,compact=false,visual=false}:{onAdvanced?:()=>void;compact?:boolean;visual?:boolean}){
 const {user}=useProgress(),[started,setStarted]=useState(false),[next,setNext]=useState<ReturnType<typeof coreNextStep>|null>(null),[error,setError]=useState('');
 const {preference,apply,notice}=useStartPreference(user?.email||'guest');
 useEffect(()=>{let live=true;setNext(null);setStarted(false);setError('');
  if(!user){let network=false,email=false,networkStarted=false,emailStarted=false;try{const n=JSON.parse(sessionStorage.getItem(pilotGuestKey)||'null'),e=JSON.parse(sessionStorage.getItem('cyberlab-email-preview')||'null');network=!!n?.networkFixed?.includes(firstPilot.caseId);email=!!e?.completedAt;networkStarted=!!n;emailStarted=!!e}catch{}setStarted(networkStarted||emailStarted);setNext(!networkStarted&&emailStarted&&!email?coreNextStep(true,false,false,false,false):coreNextStep(network,email,false,false,false));return()=>{live=false}}
  const read=async<T,>(path:string)=>{const r=await fetch(path,{cache:'no-store'});const d=await r.json() as T&{error?:string};if(!r.ok)throw Error(d.error||'تعذر استعادة خطوتك التالية.');return d};
  Promise.all([read<Network>('/api/interactive-labs/'+firstPilot.labId),read<Missions>('/api/missions'),read<SocQueue>('/api/soc'),read<Board>('/api/investigations/'+coreJourney.boardId)]).then(async([network,missions,soc,board])=>{
   if(!live)return;
   setStarted(!!network.state||missions.states.length>0||soc.alerts.some(a=>a.status!=='New'));
   if(onAdvanced&&(soc.alerts.some((a:{id:string;status:string})=>a.id!==coreJourney.socId&&a.status!=='New')||missions.states.some((m:{id:string})=>!['003',coreJourney.signalMissionId].includes(m.id)))){onAdvanced();return}
   if(soc.alerts.find(a=>a.id===coreJourney.socId)?.closedAt){
    const outcome=await read<{state:{session:{lastResult:{correct:boolean}|null}}|null}>('/api/soc/alerts/'+coreJourney.socId);
    if(!live)return;
    if(outcome.state?.session.lastResult?.correct===false){setNext({href:coreJourney.socHref,title:'راجع قرار التنبيه وفق الأدلة',action:'أعد فحص التنبيه',detail:'قرارك محفوظ، لكنه يحتاج مراجعة. ارجع إلى ملاحظات النتيجة قبل متابعة التحقيق.'});return}
   }
   const done=(id:string)=>missions.states.some((m:{id:string;completedAt:string|null})=>m.id===id&&m.completedAt);
   const chain=board.workspace.status!=='open'&&soc.alerts.find(a=>a.id===coreJourney.socId)?.closedAt?await read<{completed:boolean}>('/api/incident-chains'):null;
   if(!live)return;
   const emailInProgress=!network.state&&missions.states.some(m=>m.id==='003'&&!m.completedAt);
   setNext(coreNextStep(emailInProgress||!!network.state?.session.networkFixed.includes(firstPilot.caseId),done('003'),done(coreJourney.signalMissionId),!!soc.alerts.find((a:{id:string})=>a.id===coreJourney.socId)?.closedAt,board.workspace.status!=='open',!!chain?.completed));
  }).catch(e=>{if(live)setError(e instanceof Error?e.message:'تعذر التحميل.')});
  return()=>{live=false};
 },[user]);
 if(!next)return error?<div className="reading-width" role="alert"><p>{error}</p><button className="secondary-button" onClick={()=>location.reload()}>أعد المحاولة</button></div>:<LoadingState>جارٍ استعادة خطوتك التالية…</LoadingState>;
 const current=!started&&preference?startingActivity(preference):next;
 const brief=current.href.startsWith('/experience/nexacorp-first')?{skill:'تشخيص اتصال الشبكة',time:'5–10 دقائق'}:current.href.startsWith('/experience/nexacorp-email')?{skill:'تحليل رسالة مشبوهة',time:'8–12 دقيقة'}:current.href.startsWith('/campaigns/')?{skill:'ربط البريد بنشاط الحساب',time:'15–25 دقيقة'}:current.href.startsWith('/soc/')?{skill:'فحص تنبيه واتخاذ قرار استجابة',time:'15–25 دقيقة'}:current.href.startsWith('/investigations/')?{skill:'ربط الأدلة وتوثيق التحقيق',time:'10–20 دقيقة'}:null;
 if(compact)return <section className={'training-focus '+(visual?'atlas-recommendation':'')} aria-label="تدريبك التالي">{visual&&<img src={current.href.startsWith('/experience/nexacorp-first')?'/images/atlas-dns.webp':'/images/atlas-logs.webp'} width={120} height={90} alt=""/>}<div><span className="eyebrow">{started?'تابع من موضعك':'ابدأ هنا'}</span><h2>{current.title}</h2><p>{current.detail}</p>{brief&&<span className="training-time">{brief.time}</span>}</div><a className="primary-button" href={current.href}>{current.action}</a></section>;
 return <div className="dashboard-home pilot-home"><div className="page-heading"><div><span className="eyebrow">NEXACORP · تدريب أمني</span><h1>خطوتك التالية</h1><p>ابدأ بالموقف، وافتح المعرفة عندما تحتاجها، ثم أثبت قرارك بالأدلة.</p></div></div><LearningStartPreference preference={preference} onApply={apply} notice={notice} started={started}/><section className="continue-card" aria-label="الخطوة التالية"><span className="eyebrow">{started?'تابع نشاطك المحفوظ':preference?'بداية مقترحة حسب اختيارك':'رحلتك الأساسية'}</span><h2>{current.title}</h2><p>{current.detail}</p>{brief&&<ActivityBrief skill={brief.skill} time={brief.time} level="تدريب موجّه"/>}<div className="continue-bottom"><a className="primary-button" href={current.href}>{current.action}</a><span>{user?'خطواتك تُحفظ في حسابك أثناء التدريب':'جرّب كزائر · سجّل الدخول لحفظ تقدمك'}</span></div></section><JourneyShortcuts/><details className="core-journey-map"><summary>استكشف خطوات رحلتك</summary><ol><li><strong>شخّص الاتصال</strong><span>قارن إعدادات الجهاز واختبر النتيجة.</span></li><li><strong>افحص رسالة مشبوهة</strong><span>تحقّق من المرسل والوجهة قبل الحكم.</span></li><li><strong>اربط الأدلة</strong><span>تتبّع الرسالة ونشاط الحساب في First Signal.</span></li><li><strong>حقّق واستجب</strong><span>قيّم التنبيه ووثّق القرار الأمني.</span></li></ol><p>الدروس مرجع عند الحاجة، وليس عليك اختيار مسار من كامل المكتبة لتبدأ.</p><a href="/learn">مكتبة المعرفة</a></details>{!user&&<p className="pilot-footnote">تجربة الزائر مؤقتة داخل جلسة المتصفح. سجّل الدخول لحفظ تقدمك ومتابعة تحقيقات First Signal وSOC.</p>}</div>;
}
