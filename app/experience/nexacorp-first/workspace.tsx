'use client';
import ActivityBrief from '@/components/activity-brief';
import ProgressiveHints from '@/components/progressive-hints';
import PracticeCheck from '@/components/practice-check';
import {networkConceptCheck,networkIndependentCheck} from '@/lib/practice-checks';
import LoadingState from '@/components/loading-state';
import {useEffect,useRef,useState} from 'react';
import {CheckCircle2,Lightbulb,Network,ShieldCheck} from 'lucide-react';
import {useProgress} from '@/app/shell';
import {applyLabAction,newLabSession,type LabAction,type LabSession} from '@/lib/interactive-lab-engine';
import {firstPilot,firstPilotCase,firstPilotLab,firstPilotSegment,pilotGuestKey,pilotSteps,type PilotStep} from '@/lib/mission-first-pilot';

const choices=[
 {id:'local',label:'إعداد عنوان الجهاز لا يوافق شبكة التدريب'},
 {id:'dhcp',label:'خدمة DHCP متوقفة لجميع الأجهزة'},
 {id:'route',label:'لا يوجد مسار بعد البوابة'},
 {id:'security',label:'الانقطاع يثبت حدوث اختراق ويجب عزل الجهاز'}
] as const;
const candidateAddresses=[
 {value:'192.168.51.21',label:'192.168.51.21'},
 {value:firstPilotCase.fix.value,label:firstPilotCase.fix.value},
 {value:'192.168.50.1',label:'192.168.50.1'}
];
function lessonHref(id:string,step:PilotStep){return '/learn/'+id+'?return_to='+encodeURIComponent(firstPilot.href+'?step='+step)}
function labHref(step:PilotStep){return '/labs/v2/'+firstPilot.labId+'?return_to='+encodeURIComponent(firstPilot.href+'?step='+step)}
function recoverStep(requested:PilotStep|null,session:LabSession|null){
 if(session?.networkFixed.includes(firstPilotCase.id))return 'result';
 if(!requested)requested=session?.networkTestedBefore?'try':session?.networkInspected?'inspect':session?'explore':'brief';
 if(!session)return requested==='brief'?'brief':'explore';
 if(!session.networkInspected&&['inspect','try','decide','result'].includes(requested))return 'explore';
 if(!session.networkTestedBefore&&['try','decide','result'].includes(requested))return 'inspect';
 if(requested==='result')return 'decide';
 return requested;
}
export default function FirstExperience(){
 const stageRef=useRef<HTMLDivElement>(null),previousStep=useRef<PilotStep>('brief');
 const {user,loading:progressLoading,error:progressError}=useProgress();
 const [session,setSession]=useState<LabSession|null>(null),[step,setStep]=useState<PilotStep>('brief'),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[hypothesis,setHypothesis]=useState(''),[confirmed,setConfirmed]=useState(false),[candidate,setCandidate]=useState(''),[feedback,setFeedback]=useState(''),[card,setCard]=useState<'ip'|'dhcp'|'dns'|null>(null);
 const viewKey='cyberlab-network-view:'+encodeURIComponent(user?.email||'guest');
 useEffect(()=>{let live=true;setReady(false);const query=new URLSearchParams(window.location.search).get('step');let draft:string|null=null;try{draft=sessionStorage.getItem(viewKey)}catch{}const requested=pilotSteps.includes(query as PilotStep)?query as PilotStep:pilotSteps.includes(draft as PilotStep)?draft as PilotStep:null;
  if(!user){let saved:LabSession|null=null;try{const raw=sessionStorage.getItem(pilotGuestKey);saved=raw?JSON.parse(raw) as LabSession:null}catch{}
   if(live){setSession(saved);setStep(recoverStep(requested,saved));setReady(true)}return()=>{live=false}}
  fetch('/api/interactive-labs/'+firstPilot.labId,{cache:'no-store'}).then(async r=>{const d=await r.json() as {state:{session:LabSession}|null;error?:string};if(!r.ok)throw Error(d.error||'تعذر استعادة التدريب.');if(live){setSession(d.state?.session||null);setStep(recoverStep(requested,d.state?.session||null));setReady(true)}}).catch(e=>{if(live){setError(e instanceof Error?e.message:'تعذر التحميل.');setReady(true)}});return()=>{live=false};
 },[user,viewKey]);
 useEffect(()=>{if(!ready)return;const url=new URL(window.location.href);url.searchParams.set('step',step);window.history.replaceState(null,'',url.pathname+url.search);try{sessionStorage.setItem(viewKey,step)}catch{}},[step,ready,viewKey]);
 useEffect(()=>{if(ready&&previousStep.current!==step){const heading=stageRef.current?.querySelector('h1');heading?.setAttribute('tabindex','-1');heading?.focus();previousStep.current=step}},[ready,step]);
 const next=(to:PilotStep)=>{setFeedback('');setStep(to)};
 async function run(action:LabAction,base?:LabSession){if(busy)return null;setBusy(true);setError('');try{
   let updated:LabSession;
   if(user){let current=base||session;if(!current){const start=await fetch('/api/interactive-labs/'+firstPilot.labId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start'})});const initial=await start.json() as {state:{session:LabSession};error?:string};if(!start.ok)throw Error(initial.error||'تعذر بدء التدريب.');current=initial.state.session;setSession(current)}
    if(action.action==='start')updated=current;
    else{const response=await fetch('/api/interactive-labs/'+firstPilot.labId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)});const data=await response.json() as {state:{session:LabSession};error?:string};if(!response.ok)throw Error(data.error||'تعذر حفظ الفحص.');updated=data.state.session}}
   else{updated=action.action==='start'?base||session||newLabSession():applyLabAction(firstPilotLab,base||session||newLabSession(),action).session;
    try{sessionStorage.setItem(pilotGuestKey,JSON.stringify(updated))}catch{}}
   setSession(updated);return updated;
  }catch(e){setError(e instanceof Error?e.message:'تعذر إكمال الفحص.');return null}finally{setBusy(false)}}
 const fixed=!!session?.networkFixed.includes(firstPilotCase.id),initial=firstPilotCase.initial;
 async function begin(){if(await run({action:'start'}))next('explore')}
 async function inspect(){if(await run({action:'inspect',key:firstPilotCase.id})){setCard('ip');next('inspect')}}
 async function test(){if(await run({action:'test',key:firstPilotCase.id}))next('try')}
 function decide(){if(!hypothesis)return;if(hypothesis==='local'){setConfirmed(true);setFeedback('صحيح: مع القناع /24، عنوان الجهاز خارج الشبكة المعتمدة التي تنتمي إليها البوابة. غيّر إعدادًا واحدًا ثم أعد الاختبار؛ اختيار الفرضية وحده لا يثبت نجاح الإصلاح.');return}
  const contradiction=hypothesis==='dhcp'?'«DHCP مفعّل» يصف إعداد الجهاز، ولا يثبت نجاح التأجير أو توقف الخادم. البلاغ يخص جهازًا واحدًا؛ قارن عنوانه بالشبكة، ثم افحص جهازًا سليمًا قبل تعميم العطل.':hypothesis==='route'?'لم نختبر وجهة بعيدة بعد؛ فشل الوصول إلى البوابة لا يكفي لتشخيص المسار بعدها. ابدأ بتوافق عنوان الجهاز والقناع والبوابة.':'انقطاع الاتصال وحده لا يثبت اختراقًا. ابحث عن دليل على نشاط غير مصرح به قبل توصية العزل.';
  setFeedback(contradiction);setCard(hypothesis==='dhcp'?'dhcp':null)}
 async function applyFix(){if(candidate!==firstPilotCase.fix.value){setFeedback(candidate===initial.gateway?'هذا العنوان مستخدم للبوابة؛ منحه للجهاز يسبب تعارضًا. اختر عنوان جهاز داخل الشبكة المعتمدة، لا عنوان البوابة نفسها.':'مع /24، العنوان المختار ينتمي إلى 192.168.51.0، بينما الشبكة المعتمدة 192.168.50.0. قارِن أول ثلاثة أجزاء ثم أعد الاختيار.');return}
  const configured=await run({action:'configure',key:firstPilotCase.id,field:firstPilotCase.fix.field,value:candidate});if(!configured)return;
  const result=await run({action:'test',key:firstPilotCase.id},configured);if(result?.networkFixed.includes(firstPilotCase.id)){setFeedback('');next('result')}
 }
 if(!ready||user&&progressLoading)return <div className="pilot-frame"><LoadingState>جارٍ استعادة موضعك في البلاغ…</LoadingState></div>;
 if(error&&!session&&user)return <div className="pilot-frame" role="alert"><h1>تعذر استعادة البلاغ</h1><p>{error}</p><button className="secondary-button" onClick={()=>location.reload()}>أعد المحاولة</button></div>;
 const phase=step==='brief'?0:step==='decide'?2:step==='result'?3:1;
 const phases=[{label:'البلاغ',to:'brief'},{label:'الفحص',to:'explore'},{label:'القرار',to:'decide'},{label:'النتيجة',to:'result'}] as const;
 return <div className="pilot-frame first-experience" ref={stageRef}><header className="pilot-header"><a href="/" className="pilot-brand" dir="ltr">Cyber<span>Lab</span></a><span>بلاغ تدريبي · NexaCorp</span><a className="pilot-exit" href="/">العودة للرئيسية</a></header>
  <nav className="pilot-progress learning-progress" aria-label="مراحل البلاغ">{phases.map((item,i)=><button key={item.to} type="button" aria-current={i===phase?'step':undefined} className={i<phase?'completed':''} disabled={busy||i>=phase||fixed} onClick={()=>next(item.to)}><b aria-hidden="true">{i<phase?<CheckCircle2 size={16}/>:i+1}</b>{item.label}<small>{i===phase?'الحالية':i<phase?'مكتملة':'لاحقًا'}</small></button>)}</nav>
  {step==='brief'&&<section className="pilot-stage"><span className="pilot-kicker">نوبة أولى · شبكة تدريب معزولة</span><h1>بلاغ جديد من المالية</h1><p className="pilot-lead">جهاز المالية لا يصل إلى البوابة. مهمتك: تحديد الإعداد غير المتوافق مع الشبكة، ثم اختبار إصلاح واحد.</p><ActivityBrief skill="تشخيص اتصال الشبكة" time="5–10 دقائق"/><div className="pilot-fact"><Network size={23}/><div><strong>{firstPilotCase.host}</strong><p>جهاز في شبكة المالية التدريبية. كل الفحوص هنا محاكاة آمنة.</p></div></div><button className="primary-button" disabled={busy||!!progressError} onClick={()=>void begin()}>ابدأ الفحص</button><a className="pilot-text-link" href={lessonHref(firstPilot.knowledge.ip.lessonId,'brief')}>راجع عنوان IP والقناع قبل البدء</a>{!user&&<p className="pilot-footnote">يمكنك التجربة كزائر. سجّل الدخول إن أردت حفظ خطوات المختبر في حسابك.</p>}</section>}
  {step==='explore'&&<section className="pilot-stage"><span className="pilot-kicker">1 · لاحظ قبل أن تحكم</span><h1>ماذا تعرف من البلاغ؟</h1><p className="pilot-lead">هذه المعلومات الأولية فقط. لا تفترض سبب المشكلة من كلمة «انقطاع».</p><div className="pilot-facts"><div><small>الجهاز</small><strong dir="ltr">{firstPilotCase.host}</strong></div><div><small>عنوانه الحالي</small><strong dir="ltr">{initial.ip}</strong></div><div><small>البوابة</small><strong dir="ltr">{initial.gateway}</strong></div><div><small>الملاحظة في البلاغ</small><strong>لا يصل إلى البوابة</strong></div></div><p className="pilot-question">ما الذي ستقارنه أولًا لتعرف إن كان السبب في الجهاز أم خارجه؟</p><button className="primary-button" disabled={busy} onClick={()=>void inspect()}>افحص إعداد الجهاز</button></section>}
  {step==='inspect'&&<section className="pilot-stage"><span className="pilot-kicker">2 · قارن الأدلة</span><h1>عنوان الجهاز والشبكة</h1><div className="pilot-facts"><div><small>عنوان الجهاز</small><strong dir="ltr">{initial.ip}</strong></div><div><small>البوابة</small><strong dir="ltr">{initial.gateway}</strong></div><div><small>قناع الجهاز</small><strong dir="ltr">255.255.255.0 (/24)</strong></div><div><small>شبكة المختبر المعتمدة</small><strong dir="ltr">{firstPilotSegment.cidr}</strong></div><div><small>حالة DHCP</small><strong>{initial.dhcp==='on'?'مفعّل':'متوقف'}</strong></div></div><div className="pilot-knowledge"><Lightbulb size={19}/><div><h2>عنوان IP وشبكته</h2><p>قناع هذا التدريب /24، أي 255.255.255.0: أول ثلاثة أجزاء تحدد الشبكة، والأخير يحدد الجهاز داخلها. هذه المقارنة خاصة بـ/24؛ لا تعممها على الأقنعة الأخرى. هل عنوان الجهاز والبوابة ضمن الشبكة المعتمدة؟</p><a href={lessonHref(firstPilot.knowledge.ip.lessonId,'inspect')}>اقرأ الشرح الكامل ←</a></div></div><PracticeCheck scenario={networkConceptCheck}/><button className="primary-button" disabled={busy} onClick={()=>void test()}>اختبر الوصول إلى البوابة</button></section>}
  {step==='try'&&<section className="pilot-stage"><span className="pilot-kicker">3 · اختبر فرضيتك</span><h1>الاختبار لم يصل إلى البوابة</h1><div className="pilot-output" role="status"><span>اختبار البوابة · <bdi>{initial.gateway}</bdi></span><strong>فشل الاتصال في المحاكاة</strong></div><p>اختبرت عنوان البوابة مباشرة، لا اسم موقع. قارِن الآن IP والقناع والبوابة: ما الإعداد الذي لا يوافق الشبكة المعتمدة؟</p><details className="pilot-secondary"><summary>ما دور DNS في هذا الفحص؟</summary><div className="pilot-knowledge"><Lightbulb size={19}/><div><h2>DNS عند الحاجة</h2><p>DNS يحوّل اسمًا إلى عنوان IP. الاختبار هنا لم يستخدم اسمًا، لذلك لا يحتاج حلّ اسم. فشل Ping وحده لا يحدد السبب؛ قارنه بالإعدادات، فقد يُحجب الرد حتى مع وجود اتصال.</p><a href={lessonHref(firstPilot.knowledge.dns.lessonId,'try')}>اقرأ الشرح الكامل ←</a></div></div></details><button className="primary-button" onClick={()=>next('decide')}>فسّر ما لاحظته</button></section>}
  {step==='decide'&&<section className="pilot-stage"><span className="pilot-kicker">4 · قرار المحلل</span><h1>أين يبدأ الخلل؟</h1><p className="pilot-lead">اختر تفسيرًا يستند إلى نتيجة الفحص. يمكنك تصحيح قرارك بعد مراجعة الدليل.</p><details className="pilot-secondary evidence-review"><summary>راجع أدلة الفحص قبل القرار</summary><dl className="evidence-grid"><div><dt>عنوان الجهاز</dt><dd><bdi>{initial.ip}</bdi></dd></div><div><dt>البوابة</dt><dd><bdi>{initial.gateway}</bdi></dd></div><div><dt>الشبكة المعتمدة</dt><dd><bdi>{firstPilotSegment.cidr}</bdi></dd></div><div><dt>نتيجة الاختبار</dt><dd>لم يصل إلى البوابة</dd></div></dl><a href={lessonHref(firstPilot.knowledge.ip.lessonId,'decide')}>راجع مفهوم عنوان IP وشبكته</a></details><ProgressiveHints hints={["ما عنوان الجهاز، وما شبكة المختبر وقناعها؟ سجّل القيم قبل اختيار السبب.","عند /24، قارِن أول ثلاثة أجزاء من عنوان الجهاز والبوابة بالشبكة المعتمدة. هل فشل الوصول يوافق ما وجدت؟","عند اختيار الإصلاح، استبعد العنوان الموجود في شبكة أخرى والعنوان المستخدم للبوابة. في العمل الفعلي تحقّق أيضًا من أن عنوان الجهاز متاح."]}/><fieldset className="pilot-choices"><legend>تفسيرك للبلاغ</legend>{choices.map(choice=><label key={choice.id} className={hypothesis===choice.id?'chosen':''}><input type="radio" name="pilot-claim" checked={hypothesis===choice.id} onChange={()=>{setHypothesis(choice.id);setConfirmed(false);setFeedback('');setCard(null)}}/>{choice.label}</label>)}</fieldset>
   {!confirmed?<button className="primary-button" disabled={!hypothesis} onClick={decide}>تحقق من فرضيتك</button>:<div className="pilot-apply"><label>أي عنوان تختبره للجهاز؟<select value={candidate} onChange={e=>{setCandidate(e.target.value);setFeedback('')}}><option value="">اختر عنوانًا بعد المقارنة</option>{candidateAddresses.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label><button className="primary-button" disabled={!candidate||busy} onClick={()=>void applyFix()}>طبّق داخل المحاكاة وأعد الاختبار</button></div>}
   {feedback&&<div className="pilot-feedback" role="status"><strong>تفسير الدليل</strong><p>{feedback}</p>{!confirmed&&<button type="button" onClick={()=>next('inspect')}>أعد فحص الأدلة</button>}</div>}
   {card==='dhcp'&&<div className="pilot-knowledge"><Lightbulb size={19}/><div><h2>ما هو DHCP؟</h2><p>يوزع إعدادات الاتصال تلقائيًا. ظهور «مفعّل» يخبرك بحالة الإعداد على هذا الجهاز؛ تحتاج مقارنة العنوان الفعلي بالشبكة قبل الحكم على الخدمة.</p><a href={lessonHref(firstPilot.knowledge.dhcp.lessonId,'decide')}>اقرأ الشرح الكامل ←</a></div></div>}
   <details className="pilot-secondary"><summary>هل تريد تدريبًا إضافيًا؟</summary><a className="pilot-text-link" href={labHref('decide')}>افتح مختبر الشبكة الكامل</a></details></section>}
  {fixed&&<section className="pilot-stage pilot-result"><CheckCircle2 size={30}/><span className="pilot-kicker">نتيجة البلاغ</span><h1>عاد الجهاز إلى شبكة التدريب</h1><p className="pilot-lead">نجح فحص البوابة بعد تغيير عنوان الجهاز. هذا يثبت نتيجة الفحص في المحاكاة، وليس سلامة الإنترنت أو كل خدمات الشبكة.</p>
   <table className="network-result-compare"><caption>ما الذي تغيّر؟</caption><thead><tr><th scope="col">المعلومة</th><th scope="col">قبل الإصلاح</th><th scope="col">بعد الإصلاح</th></tr></thead><tbody><tr><th scope="row">عنوان الجهاز</th><td><bdi>{initial.ip}</bdi></td><td><bdi>{firstPilotCase.fix.value}</bdi></td></tr><tr><th scope="row">البوابة</th><td><bdi>{initial.gateway}</bdi></td><td><bdi>{initial.gateway}</bdi></td></tr><tr><th scope="row">فحص البوابة</th><td>فشل</td><td>نجح</td></tr></tbody></table>
   <p className="network-result-reason"><strong>لماذا نجح التعديل؟</strong> مع القناع /24، العنوان الجديد والبوابة في الشبكة نفسها. غيّرت عنوان الجهاز فقط وأعدت الفحص؛ لم تغيّر DNS ولم تفترض اختراقًا بلا دليل.</p>
   <PracticeCheck scenario={networkIndependentCheck}/>
   <p className="pilot-footnote">{user?'حُفظ إصلاح هذا الجهاز ضمن مختبر الشبكة، وليس إكمال المختبر كله.':'هذه تجربة زائر مؤقتة داخل جلسة المتصفح.'} هذا البلاغ لا يمنح نقاطًا إضافية.</p>
   <a className="primary-button" href="/experience/nexacorp-email">خطوتك التالية: افحص رسالة مشبوهة</a>
   <p className="pilot-footnote">في النشاط التالي ستقارن المرسل ووجهة الرابط قبل اتخاذ القرار.{!user&&' يمكنك التجربة كزائر؛ يلزم الدخول لحفظ الإنجاز في حسابك.'}</p>
  </section>}
  {error&&<p className="pilot-error" role="alert">{error}</p>}
  <footer className="pilot-bottom"><ShieldCheck size={17}/> كل الفحوص والإصلاحات محاكاة داخل CyberLab. <a href="/learn">مكتبة المعرفة</a><a href="/operations/nexacorp">عن NexaCorp</a></footer>
 </div>
}
