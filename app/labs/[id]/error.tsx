'use client';
import Link from '@/components/native-link';
export default function Error({reset}:{error:Error;reset:()=>void}) { return <div className="reading-width panel" role="alert"><h1>تعذر فتح التحدي</h1><p>حدث خطأ أثناء تحميل المهمة. أعد المحاولة أو اختر مختبرًا آخر.</p><div className="button-row"><button className="primary-button" onClick={reset}>إعادة المحاولة</button><Link className="secondary-button" href="/labs">كل المختبرات</Link></div></div>; }
