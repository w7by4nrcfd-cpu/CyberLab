'use client';
import {Map} from 'lucide-react';
import {publicLessons} from '@/lib/curriculum';
import {useProgress} from '../shell';
import {completedIds} from '@/lib/metrics';
import CyberLibrary from '../learn/cyber-library';
import AdvancedStage from './advanced';
import LearningAtlas from '@/components/learning-atlas';
export default function Roadmap(){
 const {items,learning,loading,error,user}=useProgress(),done=completedIds(items,learning);
 if(user&&(loading||error))return <div className="reading-width" role={error?'alert':'status'}>{error?'تعذر تحميل تقدم الخارطة. أعد تحميل الصفحة.':'جارٍ استعادة تقدمك المحفوظ…'}</div>;
 return <div className="reading-width guided-map"><header className="page-heading"><div><span className="eyebrow">خارطة الأمن السيبراني</span><h1>أين أنا؟ وإلى أين يمكنني التقدم؟</h1><p>تبدأ بالقضايا داخل NexaCorp. افتح اتجاهًا لرؤية معرفته؛ ليست هذه أربعة مسارات يجب إنهاؤها بالترتيب.</p></div><Map size={32}/></header>
 <section className="panel guided-focus"><div><span className="eyebrow">القضية الحالية أولًا</span><h2>من الملاحظة إلى القرار الأمني</h2><p>تتعرف إلى الشبكة والبريد، ثم تربط الأدلة وتستجيب لتنبيه. المعرفة المساندة تظهر عندما تحتاجها.</p></div><a className="primary-button" href="/">تابع رحلتك العملية</a></section>
 <LearningAtlas lessons={publicLessons()} heading={false}/><CyberLibrary lessons={publicLessons()} done={done}/>
 <details className="guided-disclosure"><summary>التطبيق ومتطلبات التحقيق المتقدم</summary><p>المختبرات والمهمات وSOC تستخدم متطلباتها الحالية. عرض اتجاه معرفي هنا لا يفتح نشاطًا مقفلًا.</p><AdvancedStage bossId="boss-002"/><a href="/practice">استكشف التدريب المتاح</a> · <a href="/operations">عمليات NexaCorp</a></details>
 <p className="scope-context">إنجازات المعرفة الإضافية لا تدخل عدادات هذه الخارطة؛ تبقى في سجلك وفي <a href="/learn#additional-knowledge">المكتبة الإضافية</a>.</p>
 </div>;
}
