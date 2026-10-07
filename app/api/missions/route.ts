import {readJsonInput,reportServerError,isUserError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readMissions,readBossLocks,writeMission} from '@/lib/mission-storage';
import type {MissionAction} from '@/lib/mission-engine';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لمتابعة المهمات.'},{status:401});try{const [states,locks]=await Promise.all([readMissions(user.userId),readBossLocks(user.userId)]);return Response.json({states,locks},{headers:{'Cache-Control':'private, no-store'}})}catch(e){reportServerError('Mission read failed',e);return Response.json({error:'تعذر تحميل المهمات.'},{status:503})}}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لحفظ مهمتك.'},{status:401});
 const parsed=await readJsonInput(request,4000,'mission');if(parsed.error)return parsed.error;const action=parsed.data as unknown as MissionAction;
 try{return Response.json(await writeMission(user.userId,action),{headers:{'Cache-Control':'private, no-store'}})}catch(e){if(isUserError(e,/غير|طويل|أدخل|مقفلة/))return Response.json({error:e.message},{status:400});reportServerError('Mission save failed',e);return Response.json({error:'تعذر حفظ المهمة. أعد المحاولة.'},{status:503})}
}
