import {reportServerError} from '@/lib/request-validation';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { readProgress } from '@/lib/storage';
export async function GET() {
    const user = await getChatGPTUser();
    if (!user)
        return Response.json({ error: 'سجّل الدخول لحفظ تقدمك.' }, { status: 401 });
    try {
        return Response.json({ items: await readProgress(user.userId) }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (e) {
        reportServerError('Progress read failed',e);
        return Response.json({ error: 'تعذر تحميل التقدم. حاول مجددًا.' }, { status: 503 });
    }
}
