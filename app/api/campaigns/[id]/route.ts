import {readJsonInput,reportServerError,isUserError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {campaignById} from '@/lib/campaigns';
import {readCampaign,recordCampaignFlag} from '@/lib/campaign-storage';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لمتابعة الحملة.'},{status:401});
 const {id}=await params;if(!campaignById(id))return Response.json({error:'الحملة غير موجودة.'},{status:404});
 try{return Response.json(await readCampaign(user.userId,id),{headers:{'Cache-Control':'private, no-store'}})}catch(e){reportServerError('Campaign read failed',e);return Response.json({error:'تعذر تحميل الحملة.'},{status:503})}
}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لحفظ القضية.'},{status:401});
 const {id}=await params;if(!campaignById(id))return Response.json({error:'الحملة غير موجودة.'},{status:404});
 const parsed=await readJsonInput(request,300,'campaign');if(parsed.error)return parsed.error;const payload=parsed.data as Record<string,unknown>;
 const flagId=payload&&typeof payload==='object'&&'flagId' in payload?(payload as {flagId:unknown}).flagId:null;
 if(typeof flagId!=='string'||flagId.length>80)return Response.json({error:'الإجراء غير صالح.'},{status:400});
 try{return Response.json(await recordCampaignFlag(user.userId,id,flagId),{headers:{'Cache-Control':'private, no-store'}})}catch(e){if(isUserError(e,/لم يُفتح|غير موجودة/))return Response.json({error:e.message},{status:400});reportServerError('Campaign flag save failed',e);return Response.json({error:'تعذر حفظ الملاحظة.'},{status:503})}
}
