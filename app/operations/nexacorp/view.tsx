'use client';
import {useEffect,useRef} from 'react';
import OperationsDesk from '@/components/operations-desk';
import {Activity,GitBranch,Network} from 'lucide-react';
import {nexaCorp,companyEntityAnchor,type EntityRef} from '@/lib/nexacorp';
function EntityLink({refId,label}:{refId:EntityRef;label:string}){return <a href={companyEntityAnchor(refId)}>{label}</a>}
export default function CompanyOverview(){
 const reference=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  let frame=0;
  const reveal=()=>{let id='';try{id=decodeURIComponent(window.location.hash.slice(1))}catch{return}
   const target=id?document.getElementById(id):null;
   if(!target||!reference.current?.contains(target))return;
   reference.current.open=true;
   cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
  };
  reveal();window.addEventListener('hashchange',reveal);
  return()=>{window.removeEventListener('hashchange',reveal);cancelAnimationFrame(frame)};
 },[]);
 return <div className="training-page nexa-page">
 <header className="training-heading"><span className="eyebrow">العمليات / NexaCorp</span><h1>حقق في حادث تدريبي</h1><p>اجمع الأدلة، فسّر ما حدث، وحدد الاستجابة.</p></header>
 <OperationsDesk/>
 <section aria-labelledby="operation-choice"><h2 id="operation-choice">تدريبات أخرى</h2><div className="training-types"><a className="training-type" href="/soc"><Activity size={25}/><div><h3>تنبيهات SOC</h3><p>افحص تنبيهًا، ووثّق قرارك بالأدلة.</p></div></a><a className="training-type" href="/incidents"><GitBranch size={25}/><div><h3>حوادث متغيرة</h3><p>تدرّب على الربط بين أدلة تتغير في كل قضية.</p></div></a></div></section>
 <details className="training-reference" ref={reference} id="company-reference"><summary>مرجع الشركة · الموظفون والأجهزة والشبكة</summary><div>
  <section className="nexa-section" aria-labelledby="nexa-departments"><div className="nexa-heading"><h2 id="nexa-departments">الأقسام</h2><p>تعمل هذه الفرق في سياق الشركة نفسه.</p></div><div className="nexa-departments">{nexaCorp.departments.map(d=><article id={'department-'+d.id} key={d.id}><strong>{d.name}</strong><p>{d.purpose}</p></article>)}</div></section>
  <section className="nexa-section" aria-labelledby="nexa-network"><div className="nexa-heading"><h2 id="nexa-network"><Network size={21}/> الشبكة والأجهزة</h2><p>عناوين الأجهزة في سجلات الشركة مرتبطة بأجهزتها المحددة. لكل مختبر معزول شبكة مستقلة.</p></div><div className="nexa-segments">{nexaCorp.segments.map(s=><article id={'segment-'+s.id} key={s.id}><span>{s.scope==='company'?'سجلات الشركة':'محاكاة معزولة'}</span><strong>{s.name}</strong><code dir="ltr">{s.cidr}</code><small>{s.description}</small></article>)}</div><div className="nexa-relations">{nexaCorp.employees.map(e=>{
   const email=nexaCorp.emailIdentities.find(a=>a.id===e.emailId);
   return <article id={'employee-'+e.id} key={e.id} className="nexa-relation">
    <div className="nexa-relation-person"><span>موظف · {nexaCorp.departments.find(d=>d.id===e.departmentId)?.name}</span><strong>{e.name}</strong><small>{e.role}</small></div>
    <span className="nexa-connector" aria-hidden="true">←</span>
    <div className="nexa-relation-account"><span>الحساب</span><strong id={'account-'+e.accountId} dir="ltr">{e.accountId}</strong>{email&&<div className="nexa-email"><span>{email.verifiedInContent?'البريد':'بريد تعريفي'}</span><small id={'email-'+e.emailId} dir="ltr">{email.address}</small></div>}</div>
    <span className="nexa-connector" aria-hidden="true">←</span>
    <div className="nexa-relation-device"><span>الجهاز المرتبط</span>{e.deviceIds.length?e.deviceIds.map(id=>{const device=nexaCorp.devices.find(d=>d.id===id);return <span className="nexa-device-ref" id={'device-'+id} key={id}><strong dir="ltr">{id}</strong>{device?.ip&&<small dir="ltr">{device.ip}</small>}{device?.segmentId&&<EntityLink refId={{kind:'segment',id:device.segmentId}} label={nexaCorp.segments.find(x=>x.id===device.segmentId)?.name||'الشبكة'}/>}</span>}):<small>لم يُحدد جهاز لهذا الموظف في الأنشطة الحالية.</small>}</div>
   </article>})}</div><div className="nexa-device-list"><h3>الأجهزة والخوادم الأخرى</h3><div>{nexaCorp.devices.filter(d=>!nexaCorp.employees.some(e=>e.deviceIds.includes(d.id))).map(d=><article id={'device-'+d.id} key={d.id}><strong dir="ltr">{d.id}</strong><span>{d.description}</span>{d.segmentId&&<EntityLink refId={{kind:'segment',id:d.segmentId}} label={nexaCorp.segments.find(s=>s.id===d.segmentId)?.name||d.segmentId}/>}</article>)}</div></div></section>
  <section className="nexa-section" aria-labelledby="nexa-services"><div className="nexa-heading"><h2 id="nexa-services">الخدمات والأصول المهمة</h2><p>تربط الخدمات الأجهزة التي تظهر في التحقيقات القائمة.</p></div><div className="nexa-service-grid">{nexaCorp.services.map(s=><article id={'service-'+s.id} key={s.id}><strong>{s.name}</strong><p>{s.description}</p><div>{s.deviceIds.map(id=><EntityLink key={id} refId={{kind:'device',id}} label={id}/>)}</div></article>)}</div><div className="nexa-assets">{nexaCorp.importantAssets.map(a=><p id={'asset-'+a.id} key={a.id}><strong>{a.name}:</strong> {a.description}</p>)}</div><div className="nexa-accounts"><h3>حسابات الخدمة والإدارة</h3>{nexaCorp.accounts.filter(a=>!a.employeeId).map(a=><p id={'account-'+a.id} key={a.id}><strong dir="ltr">{a.username}</strong> · {a.purpose}</p>)}</div></section>

 <p className="training-note">الشبكات المعزولة منفصلة عن عناوين أجهزة الشركة. عنوان مصدر التنبيه ليس بالضرورة عنوان الجهاز.</p>
 </div></details>
 <p className="training-note">جميع الأحداث والبيانات تدريبية. <a href="/practice">عد إلى التدريب الأساسي</a>.</p>
 </div>
}
