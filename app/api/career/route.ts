import {reportServerError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readCareer} from '@/lib/career-storage';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لعرض مسارك المهني التدريبي.'},{status:401});try{return Response.json(await readCareer(user.userId),{headers:{'Cache-Control':'private, no-store'}})}catch(e){reportServerError('Career progression read failed',e);return Response.json({error:'تعذر تحديث المسار المهني. حاول مجددًا.'},{status:503})}}
