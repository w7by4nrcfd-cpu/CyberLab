type Options={timeoutMs?:number;message?:string;writing?:boolean};
// One request only. Retrying a write without its acknowledgement is unsafe.
export async function clientJson<T>(url:string,init:RequestInit={},options:Options={}):Promise<T>{
 const controller=new AbortController(),abort=()=>controller.abort();
 if(init.signal?.aborted)controller.abort();
 init.signal?.addEventListener('abort',abort,{once:true});
 let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;controller.abort()},options.timeoutMs??15000);
 const fallback=options.message||'تعذر الاتصال. تحقق من الشبكة وأعد المحاولة.';
 try{
  const response=await fetch(url,{...init,cache:'no-store',signal:controller.signal});
  if(response.status===401)throw Error('انتهت الجلسة أو لم تُسجّل الدخول. سجّل الدخول مجددًا لاستعادة تقدمك.');
  if(response.status===429)throw Error('وصلت طلبات كثيرة في وقت قصير. انتظر قليلًا ثم حاول مجددًا.');
  const data:unknown=await response.json().catch(()=>{throw Error(fallback)});
  if(!response.ok){const message=response.status===400&&data&&typeof data==='object'&&'error' in data&&typeof data.error==='string'&&data.error.length<=200?data.error:fallback;throw Error(message)}
  return data as T;
 }catch(e){
  if(timedOut)throw Error(options.writing?'تأخر رد الحفظ؛ قد تكون العملية تمت. أعد تحميل تقدمك قبل تكرارها.':'استغرق تحميل التقدم وقتًا طويلًا. تحقق من الاتصال ثم أعد المحاولة.');
  if(controller.signal.aborted)throw e;
  if(e instanceof TypeError)throw Error(fallback);
  throw e;
 }finally{clearTimeout(timer);init.signal?.removeEventListener('abort',abort)}
}
