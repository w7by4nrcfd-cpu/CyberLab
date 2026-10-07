import {reportServerError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readAdaptiveLearning} from '@/lib/adaptive-storage';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لعرض تدريباتك المقترحة.'},{status:401});try{return Response.json(await readAdaptiveLearning(user.userId),{headers:{'Cache-Control':'private, no-store'}})}catch(e){reportServerError('Adaptive Learning read failed',e);return Response.json({error:'تعذر تحديث التوصيات الآن. حاول مجددًا.'},{status:503})}}
