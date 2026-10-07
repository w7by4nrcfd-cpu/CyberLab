import {readJsonInput,reportServerError,isUserError} from '@/lib/request-validation';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { gradeQuiz, gradeLab } from '@/lib/grading';
import { saveProgress, savePassedQuiz, saveAttempt } from '@/lib/storage';
export async function POST(request: Request) {
    const parsed=await readJsonInput(request,4096,'submit');
    if(parsed.error)return parsed.error;
    const body=parsed.data as {kind:string;id:string;answers:unknown;input:unknown};
    let result;
    try {
        if (body.kind === 'quiz')
            result = { ...gradeQuiz(body.id, body.answers), xp: 100 };
        else if (body.kind === 'lab')
            result = { ...gradeLab(body.id, body.input), xp: 75 };
        else
            throw Error('نوع النشاط غير صالح.');
    }
    catch (e) {
        return Response.json({ error: isUserError(e,/[\u0600-\u06ff]/) ? e.message : 'مدخلات غير صالحة.' }, { status: 400 });
    }
    const user = await getChatGPTUser();
    if (!user)
        return Response.json({ ...result, saved: false, guest: true });
    if (result.passed) {
        try {
            if(body.kind==='quiz')await savePassedQuiz(user.userId,body.id,'score' in result ? result.score as number : 0,result.xp);
            else await saveProgress(user.userId,body.id,'lab',1,result.xp);
        }
        catch (e) {
            reportServerError('Progress save failed',e);
            return Response.json({ error: 'تم التصحيح، لكن تعذر الحفظ. أعد الإرسال؛ لن تتكرر النقاط.' }, { status: 503 });
        }
    }
    if(body.kind==='quiz' && 'score' in result)try{await saveAttempt(user.userId,body.id,result.score,result.total,body.answers)}catch(e){reportServerError('Attempt save failed',e)}
    return Response.json({ ...result, saved: result.passed, guest: false });
}
