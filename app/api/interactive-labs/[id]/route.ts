import {readJsonInput,reportServerError,isUserError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {interactiveLabById} from '@/lib/interactive-labs';
import {publicLabData} from '@/lib/interactive-lab-engine';
import {readInteractiveLab,updateInteractiveLab,interactiveLabAccess} from '@/lib/interactive-lab-storage';
import type {LabAction} from '@/lib/interactive-lab-engine';
type Params={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Params){const {id}=await params,lab=interactiveLabById(id);if(!lab)return Response.json({error:'المختبر غير موجود.'},{status:404});const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لحفظ خطوات المختبر.'},{status:401});try{return Response.json({...publicLabData(lab),state:await readInteractiveLab(user.userId,id),access:await interactiveLabAccess(user.userId,id)},{headers:{'Cache-Control':'no-store'}})}catch(e){reportServerError('Lab read failed',e);return Response.json({error:'تعذر استعادة خطوات المختبر.'},{status:503})}}
export async function POST(request:Request,{params}:Params){const {id}=await params;if(!interactiveLabById(id))return Response.json({error:'المختبر غير موجود.'},{status:404});const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لحفظ خطوات المختبر.'},{status:401});const parsed=await readJsonInput(request,4096,'lab');if(parsed.error)return parsed.error;const body=parsed.data as unknown as LabAction;

 try{return Response.json(await updateInteractiveLab(user.userId,id,body),{headers:{'Cache-Control':'no-store'}})}catch(e){if(isUserError(e,/[\u0600-\u06ff]/))return Response.json({error:e.message},{status:400});reportServerError('Lab update failed',e);return Response.json({error:'تعذر حفظ الخطوة. أعد المحاولة دون فقدان المدخلات.'},{status:503})}}
