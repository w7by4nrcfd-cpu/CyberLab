'use client';
import ActivityBrief from '@/components/activity-brief';
import ProgressiveHints from '@/components/progressive-hints';
import PracticeCheck from '@/components/practice-check';
import {emailConceptChecks,emailIndependentCheck} from '@/lib/practice-checks';
import LoadingState from '@/components/loading-state';
import {useEffect,useRef,useState} from 'react';
import {CheckCircle2,Lightbulb,Mail,ShieldCheck} from 'lucide-react';
import {useProgress} from '@/app/shell';
import {applyMissionAction,freshSession,type MissionAction,type MissionSession} from '@/lib/mission-engine';
import {emailExperience,emailMission,emailEmployee,emailRecipient,emailAccount,emailMessage,emailEvidence,emailFields,emailInspectionFields,emailFieldLabels,emailKnowledge,emailClassifications,emailReasons,emailActions,emailDecisionAnswers,emailRecheck,emailSteps,recoverEmailStep,type EmailField,type EmailStep,type EmailDecision} from '@/lib/mission-first-email';

type State={id:string;completedAt:string|null;session:MissionSession;score:number;stars:number};
type Draft={step:EmailStep;field:EmailField|null;decision:EmailDecision;feedback:string};
const blankDecision=():EmailDecision=>({classification:'',reasons:[],action:''});
export default function EmailExperience(){
 const {user,loading:progressLoading,error:progressError,refresh}=useProgress();
 const [state,setState]=useState<State|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [step,setStep]=useState<EmailStep>('brief'),[field,setField]=useState<EmailField|null>(null),[decision,setDecision]=useState<EmailDecision>(blankDecision),[feedback,setFeedback]=useState('');
 const lock=useRef(false),heading=useRef<HTMLHeadingElement>(null),previousStep=useRef<EmailStep>('brief');
 // Only transient presentation choices live here. Signed-in evidence/completion
 // remain in mission_progress, and are restored before a step is opened.
 const draftKey='cyberlab-email-view:'+encodeURIComponent(user?.email||'guest');
 const guestKey='cyberlab-email-preview';
 useEffect(()=>{let live=true;setReady(false);setState(null);setError('');
  const query=new URLSearchParams(location.search),value=query.get('step');
  let draft:Partial<Draft>={};try{draft=JSON.parse(sessionStorage.getItem(draftKey)||'{}')}catch{}
  const requested=emailSteps.includes(value as EmailStep)?value as EmailStep:emailSteps.includes(draft.step as EmailStep)?draft.step!:'brief';
  const selected=query.has('field')?query.get('field'):draft.field;
  function restore(saved:State|null){if(!live)return;setState(saved);setStep(recoverEmailStep(requested,saved?.session||null,!!saved?.completedAt));setField(emailFields.includes(selected as EmailField)?selected as EmailField:null);
   const d=draft.decision;setDecision(d&&Array.isArray(d.reasons)?{classification:emailClassifications.some(c=>c.id===d.classification)?d.classification:'',reasons:d.reasons.filter(id=>emailReasons.some(r=>r.id===id)),action:emailActions.some(a=>a.id===d.action)?d.action:''}:blankDecision());setFeedback(typeof draft.feedback==='string'?draft.feedback:'');setReady(true)}
  if(!user){let saved:State|null=null;try{saved=JSON.parse(sessionStorage.getItem(guestKey)||'null')}catch{}restore(saved);return()=>{live=false}}
  fetch('/api/missions',{cache:'no-store'}).then(async r=>{const d=await r.json() as {states:State[];error?:string};if(!r.ok)throw Error(d.error||'تعذر استعادة التحقيق.');restore(d.states.find(s=>s.id===emailExperience.missionId)||null)}).catch(e=>{if(live){setError(e instanceof Error?e.message:'تعذر تحميل التحقيق.');setReady(true)}});
  return()=>{live=false};
 },[user,draftKey]);
 useEffect(()=>{if(!ready)return;const query=new URLSearchParams({step});if(field)query.set('field',field);history.replaceState(null,'',emailExperience.href+'?'+query);try{sessionStorage.setItem(draftKey,JSON.stringify({step,field,decision,feedback}))}catch{}
  if(previousStep.current!==step){heading.current?.focus();previousStep.current=step}
 },[ready,step,field,decision,feedback,draftKey]);
 async function act(action:Omit<MissionAction,'id'>,base=state):Promise<State|null>{
  if(lock.current)return null;lock.current=true;setBusy(true);setError('');
  try{let updated:State;
   if(user){const r=await fetch('/api/missions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:emailExperience.missionId,...action})});const d=await r.json() as {state:State;error?:string};if(!r.ok)throw Error(d.error||'تعذر حفظ الفحص.');updated=d.state;}
   else{const applied=applyMissionAction(emailMission,base?.session||freshSession(),{id:emailExperience.missionId,...action});updated={id:emailExperience.missionId,completedAt:applied.completed?new Date().toISOString():base?.completedAt||null,score:applied.completed?.score||base?.score||0,stars:applied.completed?.stars||base?.stars||0,session:applied.session};
    if(applied.completed){updated.session.replaying=false;updated.session.lastResult={...applied.completed,xpGranted:false,hintsUsed:updated.session.hintsUsed,mistakes:updated.session.mistakes};}
    try{sessionStorage.setItem(guestKey,JSON.stringify(updated))}catch{}}
   setState(updated);return updated;
  }catch(e){setError(e instanceof Error?e.message:'تعذر الاتصال.');return null}finally{lock.current=false;setBusy(false)}
 }
 const finished=!!state?.completedAt&&!state.session.replaying;
 const inspected=state?.session.inspected||[];
 const canDecide=emailMission.successConditions.evidence.every(id=>inspected.includes(id));
 function move(to:EmailStep){setFeedback('');setStep(to)}
 async function begin(){if(await act({action:'inspect',evidenceId:'message'})){setField('sender');move('explore')}}
 async function inspect(selected:EmailField){
  const evidenceId=selected==='link'?'link':selected==='headers'?'headers':'message';
  if(await act({action:'inspect',evidenceId})){setField(selected);setFeedback('')}
 }
 async function submit(){
  if(busy||!canDecide)return;
  let current=state;
  if(!current?.session.usedTools.includes('analyze'))current=await act({action:'tool',toolId:'analyze'},current);
  if(!current)return;
  const saved=await act({action:'solve',answers:emailDecisionAnswers(decision)},current);if(!saved)return;
  if(saved.completedAt&&!saved.session.replaying){move('result');if(user)await refresh()}
  else setFeedback(emailRecheck(decision));
 }
 async function replay(){if(await act({action:'replay'})){setDecision(blankDecision());setField(null);move('brief')}}
 const returnTo=emailExperience.href+'?step='+step+(field?'&field='+field:'');
 const lessonHref='/learn/'+emailExperience.lessonId+'?return_to='+encodeURIComponent(returnTo);
 const labHref='/labs/v2/'+emailExperience.labId+'?return_to='+encodeURIComponent(returnTo);
 if(!ready||user&&progressLoading)return <div className="pilot-frame"><LoadingState>جارٍ استعادة التحقيق…</LoadingState></div>;
 if(user&&error&&!state)return <div className="pilot-frame" role="alert"><h1>تعذر استعادة التحقيق</h1><p>{error}</p><button className="secondary-button" onClick={()=>location.reload()}>أعد المحاولة</button></div>;
 const change=(part:Partial<EmailDecision>)=>{setDecision(d=>({...d,...part}));setFeedback('')};
 const nextField=inspected.includes('headers')?'link':'headers';
 return <div className="pilot-frame email-experience"><header className="pilot-header"><a href="/" className="pilot-brand" dir="ltr">Cyber<span>Lab</span></a><span>بلاغ بريد · NexaCorp</span><a className="pilot-exit" href="/">العودة للرئيسية</a></header>
  <nav className="pilot-progress" aria-label="مراحل التحقيق">{[['brief','الرسالة'],['explore','الفحص'],['decide','القرار'],['result','النتيجة']].map(([id,label])=><span key={id} aria-current={step===id?'step':undefined}>{label}</span>)}</nav>
  {step==='brief'&&<section className="pilot-stage"><span className="pilot-kicker"><Mail size={18}/> بلاغ جديد من {emailEmployee.name}</span><h1 ref={heading} tabIndex={-1}>وصلت رسالة غير معتادة</h1><p className="pilot-lead">افحص المرسل، ثم الترويسة والرابط. صنّف الرسالة بدليلين واختر الإجراء المناسب.</p><ActivityBrief skill="تحليل رسالة مشبوهة" time="8–12 دقيقة"/><Message/><button className="primary-button" disabled={busy||!!progressError} onClick={()=>void begin()}>افحص الرسالة</button><a className="pilot-text-link" href={lessonHref}>راجع طريقة فحص الرسائل قبل البدء</a>{!user&&<p className="pilot-footnote">يمكنك التحقيق كزائر؛ هذه محاولة مؤقتة بلا نقاط أو حفظ في الحساب.</p>}</section>}
  {step==='explore'&&<section className="pilot-stage"><span className="pilot-kicker">فحص دون فتح روابط أو ملفات</span><h1 ref={heading} tabIndex={-1}>قارن المصدر والوجهة والطلب</h1>
   <ol className="email-evidence-progress" aria-label="ترتيب فحص الأدلة">{emailInspectionFields.map(id=><li key={id} aria-current={field===id?'step':undefined}><span>{emailFieldLabels[id]}</span><small>{inspected.includes(id==='sender'?'message':id)?'تمت المعاينة':'لم تُعاين بعد'}</small></li>)}</ol>
   <label className="email-inspect-select">الفحص التالي<select value={field||''} disabled={busy} onChange={e=>void inspect(e.target.value as EmailField)}><option value="" disabled>اختر ما تريد فحصه</option>{emailInspectionFields.map(id=><option key={id} value={id}>{emailFieldLabels[id]}</option>)}{field&&!emailInspectionFields.some(id=>id===field)&&<option value={field}>{emailFieldLabels[field]} · مرجع سابق</option>}</select></label>
   {field&&<div className="email-observation"><h2>{emailFieldLabels[field]}</h2>{field==='sender'?<><p>الاسم الذي يظهر في الرسالة: {emailMessage.displayName}</p><pre dir="ltr">{emailMessage.address}</pre><p>المستلمة: {emailEmployee.name} · الحساب <bdi>{emailAccount.username}</bdi></p></>:field==='domain'?<pre dir="ltr">{emailEvidence('headers').content.split('\n').slice(0,2).join('\n')}</pre>:field==='link'?<LinkArtifact/>:field==='headers'?<pre dir="ltr">{emailEvidence('headers').content}</pre>:<p>لا توجد بيانات مرفق في سجل هذه الرسالة. هذه معلومة غير متاحة، وليست دليلًا على الأمان.</p>}
    <div className="pilot-knowledge"><Lightbulb size={19}/><div><h2>{emailKnowledge[field].title}</h2><p>{emailKnowledge[field].text}</p><a href={lessonHref}>اقرأ الشرح الكامل</a></div></div>{emailConceptChecks[field]&&<PracticeCheck key={field} scenario={emailConceptChecks[field]}/>}</div>}
   <details className="pilot-secondary"><summary>راجع نص الرسالة</summary><Message/></details>
   <p className="pilot-footnote">{canDecide?'قارِن الأدلة مع طلب الرمز قبل اتخاذ القرار.':'الخطوة التالية: '+(nextField==='headers'?'افحص مصدر الإرسال في الترويسة.':'عاين وجهة الرابط دون فتحه.')}</p>
   {canDecide?<button className="primary-button" disabled={busy} onClick={()=>move('decide')}>ابنِ قرارك من الأدلة</button>:<button className="primary-button" disabled={busy} onClick={()=>void inspect(nextField)}>{nextField==='headers'?'افحص مصدر الإرسال':'عاين وجهة الرابط'}</button>}
   <details className="pilot-secondary"><summary>تمرين اختياري على رسالة أخرى</summary><p>مختبر البريد يحتوي رسائل أخرى، منها عينة لها بيانات مرفق. تفاصيلها تخص تلك العينة، ولا تضيف دليلًا لهذا البلاغ.</p><a className="pilot-text-link" href={labHref}>افتح مختبر البريد الكامل</a></details></section>}
  {step==='decide'&&!finished&&<section className="pilot-stage"><span className="pilot-kicker">قرار مبني على أكثر من ملاحظة</span><h1 ref={heading} tabIndex={-1}>ما الذي تستطيع إثباته؟</h1><p>صنّف الرسالة، وحدد أدلتك والإجراء المناسب. محاولة تصيّد لا تعني وحدها أن الحساب اختُرق.</p>
   <details className="pilot-secondary"><summary>راجع الأدلة التي ستبني عليها القرار</summary><Message/><pre dir="ltr">{emailEvidence('headers').content}</pre><LinkArtifact/></details>
   <ProgressiveHints hints={["افصل ما تدّعيه الرسالة عن البيانات المسجلة: عنوان المرسل، وجهة الرابط، والطلب الفعلي.","اقرأ نتائج التحقق ثم اربطها بوجهة الرابط والبيانات المطلوبة. اختلاف النطاق أو الاستعجال وحدهما لا يحسمان التصنيف.","هل الإجراء يمنع التعامل مع الطلب ويحفظ الرسالة للإبلاغ؟ فرّق بين إثبات محاولة التصيّد وإثبات أن الموظفة شاركت الرمز."]}/><fieldset className="pilot-choices"><legend>تصنيف الرسالة</legend>{emailClassifications.map(c=><label key={c.id} className={decision.classification===c.id?'chosen':''}><input type="radio" name="email-classification" checked={decision.classification===c.id} onChange={()=>change({classification:c.id})}/>{c.label}</label>)}</fieldset>
   <fieldset className="pilot-choices"><legend>الملاحظات التي تدعم قرارك</legend>{emailReasons.map(r=><label key={r.id}><input type="checkbox" disabled={!inspected.includes(r.evidenceId)} checked={decision.reasons.includes(r.id)} onChange={e=>change({reasons:e.target.checked?[...decision.reasons,r.id]:decision.reasons.filter(id=>id!==r.id)})}/>{r.label}</label>)}</fieldset>
   <label className="email-inspect-select">الإجراء المقترح<select value={decision.action} onChange={e=>change({action:e.target.value})}><option value="">اختر الإجراء</option>{emailActions.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
   {!feedback?<button className="primary-button" disabled={busy||!!progressError||!decision.classification||decision.reasons.length<2||!decision.action} onClick={()=>void submit()}>أرسل القرار وتحقق من الأدلة</button>:<div className="pilot-feedback" role="status"><strong>ما الذي يحتاج مراجعة؟</strong><p>{feedback}</p><button className="primary-button" onClick={()=>{setField('sender');move('explore')}}>عد للتحقيق وأعد الفحص</button></div>}
   <button className="email-secondary-link" disabled={busy} onClick={()=>move('explore')}>راجع الأدلة قبل الإرسال</button></section>}
  {step==='result'&&finished&&<section className="pilot-stage pilot-result"><CheckCircle2 size={30}/><span className="pilot-kicker">نتيجة بلاغ البريد</span><h1 ref={heading} tabIndex={-1}>الرسالة محاولة تصيّد</h1><p className="pilot-lead">اجتمعت أدلة المصدر والوجهة مع طلب رمز التحقق. لا يوجد في هذا البلاغ دليل على أن {emailEmployee.name} شاركت الرمز أو أن حسابها اختُرق.</p>
   <table className="email-result-evidence"><caption>كيف دعمت الأدلة قرارك؟</caption><thead><tr><th scope="col">الدليل المسجل</th><th scope="col">ما الذي يدعمه؟</th></tr></thead><tbody><tr><th scope="row">الترويسة: اختلاف Return-Path ونتيجة SPF fail</th><td>يستدعيان التحقق من مصدر الإرسال؛ لا يكفيان وحدهما لإثبات التصيّد.</td></tr><tr><th scope="row">وجهة الرابط: <bdi>login-check.example</bdi></th><td>نطاق مختلف عن المرسل الظاهر. قارنه بطلب الرسالة، لا بالنص الظاهر للرابط.</td></tr><tr><th scope="row">الطلب: إدخال رمز التحقق</th><td>طلب سر الحساب عبر هذه الوجهة، مع أدلة المصدر، يدعم الحكم بمحاولة تصيّد.</td></tr></tbody></table>
   <p className="email-result-action"><strong>قرارك في المحاكاة:</strong> حفظ الرسالة وعزلها وإبلاغ فريق الأمن. يوقف التعامل مع الطلب ويحتفظ بالدليل؛ لم يُرسل بريد حقيقي.</p>
   <PracticeCheck scenario={emailIndependentCheck}/><details className="pilot-secondary"><summary>راجع المصادر والنتيجة المحفوظة</summary><Message/><pre dir="ltr">{emailEvidence('headers').content}</pre><LinkArtifact/><p>{!user?'محاولة زائر: لم تُمنح XP أو Skill XP.':state.session.lastResult?.xpGranted?'حُفظ الإنجاز بالمكافأة الأصلية للمهمة 003.':'هذا الإنجاز محفوظ سابقًا؛ لا مكافأة ثانية بسبب الواجهة الجديدة.'}</p>{state.session.lastResult&&<p>النتيجة: {state.session.lastResult.score} من 100 · {state.session.lastResult.stars} من 3 نجوم</p>}</details>
   <a className="primary-button" href="/campaigns/first-signal">خطوتك التالية: اربط رسالة مشابهة بنشاط الحساب</a><p className="pilot-footnote">في First Signal ستفحص قضية أخرى لتعرف هل تبعتها جلسة غير مصرح بها، بدل افتراض اختراق الحساب من الرسالة وحدها.</p><details className="pilot-secondary"><summary>أعد التحقيق</summary><p>نفس الرسالة ونفس الأدلة، دون مكافأة إضافية للإنجاز السابق.</p><button className="secondary-button" disabled={busy} onClick={()=>void replay()}>إعادة التحقيق</button></details></section>}
  {error&&<p className="pilot-error" role="alert">{error}</p>}{progressError&&<p className="pilot-error" role="alert">تعذر تحميل تقدمك. انتظر استعادته قبل إرسال القرار.</p>}
  <footer className="pilot-bottom"><ShieldCheck size={17}/> محاكاة تعليمية: لا تُفتح روابط الرسالة ولا يُرسل بريد حقيقي. <a href="/learn">مكتبة المعرفة</a></footer>
 </div>;
}
function Message(){return <article className="email-message" aria-label="الرسالة الأصلية"><dl><div><dt>المرسل</dt><dd>{emailMessage.displayName} · <bdi dir="ltr">{emailMessage.address}</bdi></dd></div><div><dt>المستلمة</dt><dd>{emailEmployee.name} · <bdi dir="ltr">{emailRecipient.address}</bdi></dd></div><div><dt>الموضوع</dt><dd>{emailMessage.subject}</dd></div></dl><p>{emailMessage.body}</p></article>}

function LinkArtifact(){return <pre dir="rtl">{emailEvidence('link').content.split('\n').map((line,index)=>{const parts=line.split(/(https:\/\/[^\s]+)/);return <span className="email-artifact-line" key={index}>{parts.map((part,i)=>part.startsWith('https://')?<bdi dir="ltr" key={i}>{part}</bdi>:<span key={i}>{part}</span>)}</span>})}</pre>}
