import {readJsonInput,reportServerError,isUserError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {listDynamicIncidents,startDynamicIncident} from '@/lib/dynamic-storage';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول أولًا.'},{status:401,headers});try{return Response.json(await listDynamicIncidents(user.userId),{headers})}catch(e){reportServerError('Incident list failed',e);return Response.json({error:'تعذر تحميل الحوادث.'},{status:503,headers})}}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول أولًا.'},{status:401,headers});
 const parsed=await readJsonInput(request,300,'incident');if(parsed.error)return parsed.error;const input=parsed.data as {templateId:string;difficulty:string;mode:string};
 try{return Response.json(await startDynamicIncident(user.userId,input.templateId,input.difficulty as 'beginner'|'intermediate'|'advanced',input.mode as 'resume'|'new',2),{headers})}
 catch(e){if(isUserError(e,/غير صالح|الحد الأقصى/))return Response.json({error:e.message},{status:400,headers});reportServerError('Incident creation failed',e);return Response.json({error:'تعذر إنشاء الحادث. جرّب مرة أخرى.'},{status:503,headers})}
}
