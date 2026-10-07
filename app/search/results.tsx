'use client';
import {useEffect,useState} from 'react';
import Link from '@/components/native-link';
import {ArrowLeft} from 'lucide-react';
import {useProgress} from '@/app/shell';
import {scopeLabels,scopeEnglish,scopeForHref} from '@/lib/content-scope';
import type {SearchResult} from '@/lib/site-search';
import {bossMissions} from '@/lib/boss-missions';
import {lessons} from '@/lib/curriculum';
import {allMissions} from '@/lib/missions';
import {interactiveLabs} from '@/lib/interactive-labs';

type State={id:string;completedAt:string|null};
type Lab={id:string;access?:{locked:boolean;reasons:string[]}|null;state:{completedAt:string|null;attempts:number}|null};
export default function SearchResults({results}:{results:SearchResult[]}){
 const {user,items,learning,loading}=useProgress();
 const [type,setType]=useState('all'),[level,setLevel]=useState('all'),[status,setStatus]=useState('all');
 const [missions,setMissions]=useState<State[]>([]),[locks,setLocks]=useState<{id:string;reasons:string[]}[]>([]),[labs,setLabs]=useState<Lab[]>([]),[fetchState,setFetchState]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{if(!user){setFetchState('ready');return}let live=true;
  Promise.all([fetch('/api/missions').then(r=>{if(!r.ok)throw Error();return r.json()}),fetch('/api/interactive-labs').then(r=>{if(!r.ok)throw Error();return r.json()})])
   .then(([m,l])=>{if(live){setMissions((m as {states:State[]}).states);setLocks((m as {locks:{id:string;reasons:string[]}[]}).locks||[]);setLabs((l as {labs:Lab[]}).labs);setFetchState('ready')}})
   .catch(()=>{if(live)setFetchState('error')});return()=>{live=false};
 },[user]);
 const guestReasons=(id:string)=>{const boss=bossMissions.find(m=>m.id===id);return [
  ...(boss?.unlock?.lessons||[]).map(key=>'أكمل درس '+(lessons.find(l=>l.id===key)?.title||key)),
  ...(boss?.unlock?.missions||[]).map(key=>'أكمل مهمة '+(allMissions.find(m=>m.id===key)?.title||key)),
  ...(boss?.unlock?.skills||[]).filter(skill=>skill.level>1).map(skill=>'ارفع مستوى مهارة '+skill.id+' إلى '+skill.level)
 ]};
 const lockReasons=(id:string)=>user?locks.find(l=>l.id===id)?.reasons||[]:guestReasons(id);
 const labLockReasons=(id:string)=>user?labs.find(l=>l.id===id)?.access?.reasons||[]:(()=>{const unlock=interactiveLabs.find(l=>l.id===id)?.unlock;return [...(unlock?.lessons||[]).map(key=>'أكمل '+(lessons.find(l=>l.id===key)?.title||key)),...(unlock?.labs||[]).map(key=>'أكمل '+(interactiveLabs.find(l=>l.id===key)?.title||key))]})();
 const tracked=(r:SearchResult):'active'|'available'|'completed'|'locked'|null=>{
  const [section,sub,id]=r.href.split('/');void section;
  if(sub==='learn'){
   if(items.some(i=>i.id===id)||learning.activity.some(a=>a.id===id&&a.completedAt))return 'completed';
   return learning.activity.some(a=>a.id===id)?'active':'available';
  }
  if(sub==='missions'||sub==='bosses'){const s=missions.find(m=>m.id===id);return s?.completedAt?'completed':s?'active':sub==='bosses'&&lockReasons(id).length?'locked':'available'}
  if(sub==='labs'&&id==='v2'){const lab=labs.find(l=>l.id===r.href.split('/')[3]);return lab?.state?.completedAt?'completed':labLockReasons(r.href.split('/')[3]).length?'locked':lab?.state?'active':'available'}
  return null;
 };
 const filtered=results.filter(r=>(type==='all'||r.kind===type)&&(level==='all'||r.level===level)&&(status==='all'||tracked(r)===status));
 const labels={active:'قيد التقدم',available:'متاح',completed:'مكتمل',locked:'مقفل'};
 const types=[...new Set(results.map(r=>r.kind))],levels=[...new Set(results.map(r=>r.level).filter((value):value is string=>!!value))];
 const pending=status!=='all'&&(loading||fetchState==='loading');
 const showStatus=!loading&&fetchState==='ready';
 return <><div className="site-search-filters" aria-label="تصفية نتائج البحث"><label>النوع<select value={type} onChange={e=>setType(e.target.value)}><option value="all">كل الأنواع</option>{types.map(t=><option key={t}>{t}</option>)}</select></label><label>المستوى<select value={level} onChange={e=>setLevel(e.target.value)}><option value="all">كل المستويات</option>{levels.map(l=><option key={l}>{l}</option>)}</select></label><label>الحالة<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">كل الحالات</option><option value="available">متاح</option><option value="active">قيد التقدم</option><option value="completed">مكتمل</option><option value="locked">مقفل</option></select></label></div>
 {status!=='all'&&<p className="muted">تنطبق الحالة على الدروس والمختبرات التفاعلية والمهمات والتحقيقات المتقدمة.</p>}
 {pending?<p role="status">جارٍ تحميل حالات تقدمك…</p>:status!=='all'&&fetchState==='error'?<p role="alert">تعذر تحميل حالات تقدمك. أعد تحميل الصفحة للتصفية حسب الحالة.</p>:<><h2>{filtered.length?`${filtered.length} نتيجة`:'لا توجد نتائج لهذه الفلاتر'}</h2><div className="site-search-results">{filtered.map(r=>{const reason=r.href.startsWith('/bosses/')?lockReasons(r.href.split('/')[2]):r.href.startsWith('/labs/v2/')?labLockReasons(r.href.split('/')[3]):[];return <Link href={r.href} key={r.href}><span>{r.section} / {r.kind}{r.level?' · '+r.level:''}{showStatus&&tracked(r)?' · '+labels[tracked(r)!]:''}</span><h3>{r.title}</h3><p className="scope-badge">{scopeLabels[r.scope||scopeForHref(r.href)]} · <bdi dir="ltr">{scopeEnglish[r.scope||scopeForHref(r.href)]}</bdi></p><p>{r.description}</p>{showStatus&&tracked(r)==='locked'&&<p className="search-relation">المتبقي للفتح: {reason.join('، ')}. افتح النشاط لرؤية المتطلبات.</p>}{r.relatedTo&&<p className="search-relation">مرتبط بدرس: {r.relatedTo}</p>}<ArrowLeft size={18}/></Link>})}</div></>}
 </>;
}
