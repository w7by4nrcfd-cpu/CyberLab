import {readJsonInput,reportServerError,isUserError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {investigationBoardById} from '@/lib/investigation-board';
import {readInvestigation,writeInvestigation,type BoardAction} from '@/lib/investigation-storage';

type Context={params:Promise<{id:string}>};
const noStore={'Cache-Control':'private, no-store'};
export async function GET(_request:Request,{params}:Context){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لعرض التحقيق.'},{status:401});
 const {id}=await params;if(!investigationBoardById(id)&&!/^dynamic-(phishing|endpoint|network-auth)-[0-9a-f]{8}$/.test(id))return Response.json({error:'التحقيق غير موجود.'},{status:404});
 try{return Response.json(await readInvestigation(user.userId,id),{headers:noStore})}catch(e){if(isUserError(e,/التحقيق غير موجود/))return Response.json({error:'التحقيق غير موجود.'},{status:404,headers:noStore});if(isUserError(e,/لم يُفتح|أكمل تحقيق/))return Response.json({error:e.message},{status:403,headers:noStore});reportServerError('Investigation read failed',e);return Response.json({error:'تعذر تحميل التحقيق.'},{status:503})}
}
export async function POST(request:Request,{params}:Context){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لحفظ التحقيق.'},{status:401});
 const {id}=await params;if(!investigationBoardById(id)&&!/^dynamic-(phishing|endpoint|network-auth)-[0-9a-f]{8}$/.test(id))return Response.json({error:'التحقيق غير موجود.'},{status:404});
 const parsed=await readJsonInput(request,4500,'board');if(parsed.error)return parsed.error;const input=parsed.data as Record<string,unknown>;
 try{return Response.json(await writeInvestigation(user.userId,id,input as BoardAction),{headers:noStore})}
 catch(e){if(isUserError(e,/التحقيق غير موجود/))return Response.json({error:'التحقيق غير موجود.'},{status:404,headers:noStore});if(isUserError(e,/لم يُفتح|أكمل تحقيق/))return Response.json({error:e.message},{status:403,headers:noStore});if(isUserError(e,/غير|راجع|اجمع|اختر|اربط|اشرح|افتح|مفتوح|حُفظ|أكمل/))return Response.json({error:e.message},{status:400});reportServerError('Investigation save failed',e);return Response.json({error:'تعذر حفظ التحقيق.'},{status:503})}
}
