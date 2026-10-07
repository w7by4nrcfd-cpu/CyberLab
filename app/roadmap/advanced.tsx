'use client';
import {useEffect,useState} from 'react';
import {useProgress} from '../shell';
import {bossMissions} from '@/lib/boss-missions';
import {lessons} from '@/lib/curriculum';
import {allMissions} from '@/lib/missions';
export default function AdvancedStage({bossId='boss-002'}:{bossId?:string}){
 const {user}=useProgress(),[data,setData]=useState<{locks:{id:string;reasons:string[]}[];states:{id:string;completedAt:string|null}[]}|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(!user)return;let live=true;fetch('/api/missions',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('تعذر حساب متطلبات التحقيق.');return r.json() as Promise<{locks:{id:string;reasons:string[]}[];states:{id:string;completedAt:string|null}[]}>}).then(result=>{if(live)setData(result)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[user]);
 const boss=bossMissions.find(m=>m.id===bossId)||bossMissions[1],requirementCount=(boss.unlock?.lessons?.length||0)+(boss.unlock?.missions?.length||0)+(boss.unlock?.skills?.length||0);
 const reasons=user?data?.locks.find(l=>l.id===boss.id)?.reasons: [
  ...(boss.unlock?.lessons||[]).map(id=>'أكمل درس '+(lessons.find(l=>l.id===id)?.title||id)),
  ...(boss.unlock?.missions||[]).map(id=>'أكمل مهمة '+(allMissions.find(m=>m.id===id)?.title||id))
 ];
 const completed=!!data?.states.find(s=>s.id===boss.id)?.completedAt,locked=!completed&&!!reasons?.length;
 return <section className="panel" aria-label="التحقيقات المتقدمة"><span className="eyebrow">{error?'تعذر التحقق':!reasons?'جارٍ حساب المتطلبات':completed?'مكتمل':locked?'مقفل':'متاح'}</span><h2>{boss.title}</h2><p>اجمع مهاراتك في مهمة أكبر. يظهر التحقيق حتى قبل فتحه، مع متطلباته الحقيقية.</p>{error?<p role="alert">{error}</p>:reasons&&<><p>{completed?requirementCount:requirementCount-reasons.length} من {requirementCount} متطلبات مكتملة لهذا التحقيق</p>{locked&&<p>المتبقي: {reasons.join('، ')}</p>}<a href={'/bosses/'+boss.id}>{locked?'عرض متطلبات الفتح':'افتح التحقيق'} ←</a></>}</section>;
}
