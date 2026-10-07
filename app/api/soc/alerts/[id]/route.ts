import {readJsonInput,reportServerError,isUserError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {socAlertById} from '@/lib/soc-alerts';
import {readSocAlert,writeSocAction,addSocNote} from '@/lib/soc-storage';
import type {SocAction} from '@/lib/soc-engine';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لعرض التحقيق.'},{status:401});
 const {id}=await params;if(!socAlertById(id))return Response.json({error:'التنبيه غير موجود.'},{status:404});
 try{return Response.json(await readSocAlert(user.userId,id),{headers:{'Cache-Control':'private, no-store'}})}catch(e){reportServerError('SOC alert read failed',e);return Response.json({error:'تعذر تحميل التحقيق.'},{status:503})}
}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لحفظ التحقيق.'},{status:401});
 const {id}=await params;if(!socAlertById(id))return Response.json({error:'التنبيه غير موجود.'},{status:404});
 const parsed=await readJsonInput(request,4500,'soc');if(parsed.error)return parsed.error;const data=parsed.data as Record<string,unknown>;
 try{
  if(data.action==='note')return Response.json({notes:await addSocNote(user.userId,'alert',id,data.content)},{headers:{'Cache-Control':'private, no-store'}});
  if(!['start','triage','inspect','collect','tool','decide','respond','document','close','reopen','defensive','assess','response-test','verify','report'].includes(String(data.action)))return Response.json({error:'الإجراء غير صالح.'},{status:400});
  return Response.json(await writeSocAction(user.userId,{...data,id} as SocAction),{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){if(isUserError(e,/غير|افحص|اكتب|أكمل|أولًا|مغلق|مفتوح|يجب|افتح|أعد|استخدم|اختر|اجمع|راجع|اربط|حدد|استند/))return Response.json({error:e.message},{status:400});reportServerError('SOC alert write failed',e);return Response.json({error:'تعذر حفظ التحقيق.'},{status:503})}
}
