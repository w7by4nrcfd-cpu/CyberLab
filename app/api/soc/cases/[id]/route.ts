import {readJsonInput,reportServerError,isUserError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {socCaseById} from '@/lib/soc-alerts';
import {addSocNote,readSocCase,closeSocCase} from '@/lib/soc-storage';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لعرض القضية.'},{status:401});
 const {id}=await params;if(!socCaseById(id))return Response.json({error:'القضية غير موجودة.'},{status:404});
 try{return Response.json(await readSocCase(user.userId,id),{headers:{'Cache-Control':'private, no-store'}})}catch(e){if(isUserError(e,/غير موجودة/))return Response.json({error:e.message},{status:404});reportServerError('SOC case read failed',e);return Response.json({error:'تعذر تحميل القضية.'},{status:503})}
}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لحفظ القضية.'},{status:401});
 const {id}=await params;if(!socCaseById(id))return Response.json({error:'القضية غير موجودة.'},{status:404});
 const parsed=await readJsonInput(request,4500,'case');if(parsed.error)return parsed.error;const data=parsed.data as Record<string,unknown>;
 try{
  if(data.action==='note')return Response.json({notes:await addSocNote(user.userId,'case',id,data.content)},{headers:{'Cache-Control':'private, no-store'}});
  if(data.action==='close')return Response.json(await closeSocCase(user.userId,id,data.conclusion),{headers:{'Cache-Control':'private, no-store'}});
  return Response.json({error:'الإجراء غير صالح.'},{status:400});
 }catch(e){if(isUserError(e,/غير موجودة|اكتب|مغلقة/))return Response.json({error:e.message},{status:400});reportServerError('SOC case write failed',e);return Response.json({error:'تعذر حفظ القضية.'},{status:503})}
}
