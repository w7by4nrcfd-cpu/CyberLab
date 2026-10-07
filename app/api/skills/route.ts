import {reportServerError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readSkills} from '@/lib/skill-storage';
export async function GET(){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لعرض مهاراتك.'},{status:401});
 try{return Response.json({skills:await readSkills(user.userId)},{headers:{'Cache-Control':'private, no-store'}})}
 catch(e){reportServerError('Skills read failed',e);return Response.json({error:'تعذر تحميل المهارات. حاول مجددًا.'},{status:503})}
}
