import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readProgression} from '@/lib/progression-storage';
import {reportServerError} from '@/lib/request-validation';
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لعرض تقدمك المحفوظ.'},{status:401});
 if(new URL(request.url).search)return Response.json({error:'يُقرأ تقدم الحساب المسجل فقط.'},{status:400});
 try{return Response.json(await readProgression(user.userId),{headers:{'Cache-Control':'private, no-store'}})}catch(e){reportServerError('Progression read failed',e);return Response.json({error:'تعذر استعادة التقدم والإنجازات. حاول مجددًا.'},{status:503})}
}
