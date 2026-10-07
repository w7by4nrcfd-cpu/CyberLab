import {reportServerError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readSocQueue} from '@/lib/soc-storage';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لفتح SOC Console.'},{status:401});try{return Response.json(await readSocQueue(user.userId),{headers:{'Cache-Control':'private, no-store'}})}catch(e){reportServerError('SOC queue failed',e);return Response.json({error:'تعذر تحميل التنبيهات.'},{status:503})}}
