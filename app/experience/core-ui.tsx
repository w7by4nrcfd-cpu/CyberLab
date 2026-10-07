'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import LoadingState from '@/components/loading-state';
import {Lightbulb,ShieldCheck} from 'lucide-react';
import {useProgress} from '@/app/shell';

export function useSavedCase<T>(url:string){
 const {user}=useProgress(),[data,setData]=useState<T|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),lock=useRef(false);
 useEffect(()=>{let live=true;setReady(false);setData(null);setError('');if(!user){setReady(true);return()=>{live=false}}
  fetch(url,{cache:'no-store'}).then(async r=>{const d=await r.json() as T&{error?:string};if(!r.ok)throw Error(d.error||'تعذر استعادة القضية.');if(live)setData(d)}).catch(e=>{if(live)setError(e instanceof Error?e.message:'تعذر التحميل.')}).finally(()=>{if(live)setReady(true)});return()=>{live=false};
 },[url,user]);
 async function reload(){try{const r=await fetch(url,{cache:'no-store'}),d=await r.json() as T&{error?:string};if(!r.ok)throw Error(d.error||'تعذر استعادة القضية.');setData(d);setError('');return d as T}catch(e){setError(e instanceof Error?e.message:'تعذر التحميل.');return null}}
 async function post(input:Record<string,unknown>){if(lock.current)return null;lock.current=true;setBusy(true);setError('');try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),d=await r.json() as T&{error?:string};if(!r.ok)throw Error(d.error||'تعذر حفظ الخطوة.');setData(d);return d as T}catch(e){setError(e instanceof Error?e.message:'تعذر الحفظ.');return null}finally{lock.current=false;setBusy(false)}}
 return {data,ready,error,busy,post,reload,user};
}
// Drafts are device-local UI choices; all evidence, decisions and completion
// come from the existing authenticated APIs before opening a later stage.
export function useCoreDraft<T>(id:string,initial:T){
 const {user}=useProgress(),key='cyberlab-core-draft:'+id+':'+encodeURIComponent(user?.email||'guest');
 const [draft,setDraft]=useState(initial),[restored,setRestored]=useState(false);
 useEffect(()=>{setRestored(false);let saved=initial;try{const raw=sessionStorage.getItem(key);if(raw)saved={...initial,...JSON.parse(raw)}}catch{}setDraft(saved);setRestored(true)},[key]);
 useEffect(()=>{if(restored)try{sessionStorage.setItem(key,JSON.stringify(draft))}catch{}},[key,draft,restored]);
 return [draft,setDraft] as const;
}
export function useCoreStep<S extends string>(base:string,steps:readonly S[],ready:boolean,recover:(step:S)=>S){
 const [step,setStep]=useState<S>(steps[0]),[initialized,setInitialized]=useState(false);
 useEffect(()=>{if(!ready)return;const query=new URLSearchParams(location.search).get('step');setStep(recover(steps.includes(query as S)?query as S:steps[0]));setInitialized(true)},[base,ready]);
 useEffect(()=>{if(!initialized)return;const corrected=recover(step);if(corrected!==step){setStep(corrected);return}const url=new URL(location.href);url.searchParams.set('step',step);history.replaceState(null,'',url.pathname+url.search)},[step,initialized,recover]);
 return [step,setStep] as const;
}
export function CoreFrame({children,error,title}:{children:ReactNode;error?:string;title:string}){return <div className="pilot-frame core-experience"><header className="pilot-header"><a href="/" className="pilot-brand" dir="ltr">Cyber<span>Lab</span></a><span>{title} · NexaCorp</span><a className="pilot-exit" href="/">لوحة التحكم</a></header>{children}{error&&<p className="pilot-error" role="alert">{error}</p>}<footer className="pilot-bottom"><ShieldCheck size={17}/> محاكاة تعليمية؛ لا تنفيذ على أنظمة خارجية. <a href="/learn">مكتبة المعرفة</a></footer></div>}
export function Knowledge({title,text,lessonId,returnTo}:{title:string;text:string;lessonId:string;returnTo:string}){return <details className="pilot-secondary core-knowledge"><summary>{title}</summary><div className="pilot-knowledge"><Lightbulb size={19}/><div><p>{text}</p><a href={'/learn/'+lessonId+'?return_to='+encodeURIComponent(returnTo)}>اقرأ الشرح الكامل</a></div></div></details>}
export function CaseAccess({ready,user,href,error}:{ready:boolean;user:unknown;href:string;error:string}){return <section className="pilot-stage">{!ready?<LoadingState>جارٍ استعادة القضية…</LoadingState>:!user?<><h1>ابدأ تحقيقًا محفوظًا</h1><p>تُحفظ الأدلة والقرارات في حسابك. إن كانت تجربة البريد السابقة كزائر، أكملها بعد الدخول لحفظ إنجازها قبل القضية المتقدمة.</p><a className="primary-button" target="_top" href={'/signin-with-chatgpt?return_to='+encodeURIComponent(href)}>تسجيل الدخول والعودة للقضية</a></>:<><h1>تعذر استعادة القضية</h1><p role="alert">{error}</p><button className="secondary-button" onClick={()=>location.reload()}>أعد المحاولة</button></>}</section>}
