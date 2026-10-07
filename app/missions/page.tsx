'use client';
import {useEffect,useState} from 'react';
import {missions,type Mission} from '@/lib/missions';
import {useProgress} from '@/app/shell';
import {groupByDisplayState} from '@/lib/display-state';
import {clientJson} from '@/lib/client-json';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import LoadingState from '@/components/loading-state';
type State={id:string;completedAt:string|null;score:number;stars:number;progress:number;session:{replaying:boolean}};
type Snapshot={account:string;states:State[];loading:boolean;error:string};
export default function MissionCenter(){
 const {user}=useProgress(),account=user?.email||'guest';
 const [snapshot,setSnapshot]=useState<Snapshot>({account:'',states:[],loading:true,error:''});
 useEffect(()=>{const controller=new AbortController();setSnapshot({account,states:[],loading:!!user,error:''});
  if(user)clientJson<{states:State[]}>('/api/missions',{signal:controller.signal},{message:'تعذر تحميل المهمات. أعد المحاولة.'}).then(data=>{
   if(!Array.isArray(data.states))throw Error('تعذر قراءة المهمات المحفوظة.');
   if(!controller.signal.aborted)setSnapshot({account,states:data.states,loading:false,error:''});
  }).catch(e=>{if(!controller.signal.aborted)setSnapshot({account,states:[],loading:false,error:e instanceof Error?e.message:'تعذر التحميل.'})});
  return()=>controller.abort();
 },[account]);
 const states=snapshot.account===account?snapshot.states:[],loading=!!user&&(snapshot.account!==account||snapshot.loading),error=snapshot.account===account?snapshot.error:'';
 const {active,completed,available}=groupByDisplayState(missions,states),recommended=active[0]||available[0],other=[...active,...available].filter(m=>m.id!==recommended?.id);
 const href=(m:Mission)=>user?'/missions/'+m.id:'/signin-with-chatgpt?return_to='+encodeURIComponent('/missions/'+m.id);
 const card=(m:Mission)=>{const s=states.find(x=>x.id===m.id);return <a href={href(m)} target={user?undefined:'_top'} className="training-card" key={m.id}><div className="training-card-meta">{m.difficulty}</div><h3>{m.title}</h3><p>{m.description}</p><span className="training-card-result">{s?.completedAt?'أفضل نتيجة: '+s.stars+' من 3 نجوم':s?'التقدم: '+s.progress+'%':'المكافأة: '+m.xpReward+' نقطة'}</span><span className="training-card-action">{!user?'سجّل الدخول للبدء':s?.completedAt?'أعد المهمة':s?'تابع المهمة':'ابدأ المهمة'}</span></a>};
 return <div className="training-page"><header className="training-heading"><span className="eyebrow">التدريب / المهمات</span><h1>حلّ موقفًا بالأدلة</h1><p>افحص المشكلة، اختبر السبب، ثم قدّم تشخيصك.</p></header>
 {loading?<LoadingState>جارٍ تحميل مهماتك…</LoadingState>:error?<section className="panel" role="alert"><p>{error}</p><button className="secondary-button" onClick={()=>location.reload()}>إعادة المحاولة</button></section>:<>
 {recommended&&<section className="training-focus"><div><span className="eyebrow">{active.length?'تابع مهمتك':'ابدأ بمهمة'}</span><h2>{recommended.title}</h2><p>{recommended.description}</p><span className="training-time">{recommended.difficulty}</span></div><a className="primary-button" href={href(recommended)} target={user?undefined:'_top'}>{user?active.length?'تابع المهمة':'ابدأ المهمة':'سجّل الدخول للبدء'}</a></section>}
 <Tabs defaultValue="practice" dir="rtl"><TabsList className="training-filter" aria-label="عرض المهمات"><TabsTrigger value="practice">تدرّب الآن</TabsTrigger><TabsTrigger value="results">نتائجك{completed.length?' · '+completed.length:''}</TabsTrigger></TabsList><TabsContent value="practice">{other.length?<div className="training-catalog">{other.map(card)}</div>:<p className="training-note">{recommended?'ابدأ المهمة المقترحة أعلاه.':'أكملت المهمات الحالية. راجع نتائجك أو انتقل إلى التحقيقات المتقدمة.'}</p>}</TabsContent><TabsContent value="results">{completed.length?<div className="training-catalog">{completed.map(card)}</div>:<p className="training-note">{user?'لم تُكمل مهمة بعد.':'النتائج تُحفظ بعد تسجيل الدخول وإكمال المهمة.'}</p>}</TabsContent></Tabs>
 </>}
 <p className="training-note"><a href="/bosses">التحقيقات المتقدمة</a> · محاكاة داخل الموقع، بلا اتصال بأجهزة حقيقية.</p></div>;
}
