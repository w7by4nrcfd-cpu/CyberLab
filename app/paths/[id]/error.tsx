'use client';
import Link from '@/components/native-link';
export default function Error({reset}:{error:Error;reset:()=>void}) { return <div className="reading-width panel" role="alert"><h1>تعذر تحميل الرحلة</h1><div className="button-row"><button className="primary-button" onClick={reset}>إعادة المحاولة</button><Link className="secondary-button" href="/roadmap">العودة إلى الخارطة</Link></div></div>; }
