'use client';
import LoadingState from '@/components/loading-state';
import {useEffect,useState} from 'react';
import {labs as basicLabs} from '@/lib/curriculum';
import type {InteractiveLab} from '@/lib/interactive-labs';
import {useProgress} from '@/app/shell';
import {clientJson} from '@/lib/client-json';
import {labLearning} from '@/lib/lab-learning';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
type Listed=InteractiveLab&{access?:{locked:boolean;met:number;total:number;reasons:string[]}|null;state:{completedAt:string|null;bestScore:number;attempts:number;hintsUsed:number;updatedAt:string}|null};
const kindLabels={terminal:'طرفية',logs:'سجلات',email:'بريد',network:'شبكات',http:'ويب'};
type Snapshot={account:string;labs:Listed[];loading:boolean;error:string};
export default function Labs(){
 const {user,items,learning}=useProgress(),account=user?.email||'guest';
 const [snapshot,setSnapshot]=useState<Snapshot>({account:'',labs:[],loading:true,error:''});
 useEffect(()=>{const controller=new AbortController();setSnapshot({account,labs:[],loading:true,error:''});
  clientJson<{labs:Listed[]}>('/api/interactive-labs',{signal:controller.signal},{message:'تعذر تحميل المختبرات. أعد المحاولة.'}).then(data=>{
   if(!Array.isArray(data.labs))throw Error('تعذر قراءة قائمة المختبرات.');
   if(!controller.signal.aborted)setSnapshot({account,labs:data.labs,loading:false,error:''});
  }).catch(e=>{if(!controller.signal.aborted)setSnapshot({account,labs:[],loading:false,error:e instanceof Error?e.message:'تعذر التحميل.'})});
  return()=>controller.abort();
 },[account]);
 const labs=snapshot.account===account?snapshot.labs:[],loading=snapshot.account!==account||snapshot.loading,error=snapshot.account===account?snapshot.error:'';
 const doneLesson=(id:string)=>items.some(i=>i.id===id)||learning.activity.some(a=>a.id===id&&a.completedAt);
 const active=labs.filter(l=>l.state&&!l.state.completedAt&&!l.access?.locked),completed=labs.filter(l=>l.state?.completedAt),available=labs.filter(l=>!l.state&&!l.access?.locked),locked=labs.filter(l=>l.access?.locked&&!l.state?.completedAt);
 const recommended=active[0]||available.find(l=>l.relatedLessons.some(doneLesson))||available.find(l=>l.id==='v2-email')||available[0];
 const other=[...active,...available].filter(l=>l.id!==recommended?.id);
 const card=(l:Listed)=><a href={'/labs/v2/'+l.id} key={l.id} className="training-card"><div className="training-card-meta"><span>{kindLabels[l.kind]}</span><span>· {l.difficulty}</span>{labLearning[l.id]&&<span>وقت تقريبي: {labLearning[l.id].time}</span>}</div><h3>{l.title}</h3><p>{l.description}</p>{l.access?.locked?<p>يُفتح بعد: {l.access.reasons.join('، ')}</p>:l.state?.completedAt?<span className="training-card-result">أفضل نتيجة: {l.state.bestScore} من 100</span>:<span className="training-card-result">{l.state?'قيد التقدم':'المكافأة: '+l.xpReward+' نقطة'}</span>}<span className="training-card-action">{l.access?.locked?'راجع المتطلبات':l.state?.completedAt?'أعد التدريب':l.state?'تابع المختبر':'ابدأ المختبر'}</span></a>;
 return <div className="training-page"><header className="training-heading"><span className="eyebrow">التدريب / المختبرات</span><h1>جرّب، وافهم النتيجة</h1><p>تدريب عملي على الشبكات والبريد والطرفية والويب.</p></header>
 {loading?<LoadingState>جارٍ تحميل المختبرات…</LoadingState>:error?<section className="panel" role="alert"><p>{error}</p><button className="secondary-button" onClick={()=>location.reload()}>إعادة المحاولة</button></section>:<>
 {recommended&&<section className="training-focus"><div><span className="eyebrow">{recommended.state?'تابع مختبرك':'تدريب مقترح'}</span><h2>{recommended.title}</h2><p>{recommended.description}</p><span className="training-time">{kindLabels[recommended.kind]} · {recommended.difficulty}{labLearning[recommended.id]&&' · وقت تقريبي: '+labLearning[recommended.id].time}</span></div><a className="primary-button" href={'/labs/v2/'+recommended.id}>{recommended.state?'تابع المختبر':'ابدأ المختبر'}</a></section>}
 <Tabs defaultValue="practice" dir="rtl"><TabsList className="training-filter" aria-label="عرض المختبرات"><TabsTrigger value="practice">تدرّب الآن</TabsTrigger><TabsTrigger value="results">نتائجك{completed.length?' · '+completed.length:''}</TabsTrigger></TabsList><TabsContent value="practice">{other.length?<div className="training-catalog">{other.map(card)}</div>:<p className="training-note">{recommended?'ابدأ التدريب المقترح أعلاه.':'أكملت المختبرات المتاحة. يمكنك مراجعة نتائجك.'}</p>}{locked.length>0&&<details className="training-reference"><summary>مختبرات تحتاج متطلبات سابقة · {locked.length}</summary><div className="training-catalog">{locked.map(card)}</div></details>}</TabsContent><TabsContent value="results">{completed.length?<div className="training-catalog">{completed.map(card)}</div>:<p className="training-note">{user?'ستظهر نتائجك بعد إكمال مختبر.':'سجّل الدخول لحفظ النتائج؛ يمكنك تجربة المختبرات الآن.'}</p>}</TabsContent></Tabs>
 </>}
 <details className="training-reference"><summary>تمارين قصيرة على الأساسيات</summary><div className="il-legacy-grid">{basicLabs.map(l=><a href={'/labs/'+l.id} key={l.id}>{l.title}</a>)}</div></details>
 <p className="training-note">محاكاة داخل الموقع فقط.{!user&&<> <a href="/signin-with-chatgpt?return_to=%2Flabs" target="_top">سجّل الدخول لحفظ تقدمك</a>.</>}</p></div>
}
