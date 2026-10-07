'use client';
import Link from '@/components/native-link';
export default function Error({reset}:{error:Error;reset:()=>void}) { return <div className="reading-width panel" role="alert"><h1>تعذر تحميل الدرس</h1><p>أعد المحاولة أو ارجع إلى قائمة الدروس.</p><div className="button-row"><button className="primary-button" onClick={reset}>إعادة المحاولة</button><Link href="/learn" className="secondary-button">مسارات التعلم</Link></div></div>; }
