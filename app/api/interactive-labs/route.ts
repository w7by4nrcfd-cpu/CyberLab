import {reportServerError} from '@/lib/request-validation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {interactiveLabs} from '@/lib/interactive-labs';
import {listInteractiveLabs,interactiveLabAccess} from '@/lib/interactive-lab-storage';
export async function GET(){const user=await getChatGPTUser();try{return Response.json({labs:user?await listInteractiveLabs(user.userId):await Promise.all(interactiveLabs.map(async l=>({...l,state:null,access:await interactiveLabAccess(null,l.id)}))),guest:!user},{headers:{'Cache-Control':'no-store'}})}catch(e){reportServerError('Labs list failed',e);return Response.json({error:'تعذر تحميل المختبرات. حاول مجددًا.'},{status:503})}}
