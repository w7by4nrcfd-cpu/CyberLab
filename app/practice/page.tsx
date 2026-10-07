import Link from '@/components/native-link';
import CoreJourneyStart from '@/app/experience/core-start';
const destinations=[
 {href:'/labs/v2/v2-network',title:'شخّص انقطاع الخدمة',description:'افحص إعداد الجهاز، ثم النقل ومسار الرد.',output:'إصلاح مع إعادة اختبار وقرار مسار مبرر',time:'30–50 دقيقة'},
 {href:'/labs/v2/v2-logs',title:'اربط أحداث حادث',description:'تتبّع الدخول وسلسلة العمليات والاتصالات.',output:'تسلسل زمني وأدلة لكل استنتاج',time:'20–35 دقيقة'},
 {href:'/bosses/boss-002',title:'استجب لحادث تصيّد',description:'اربط الرسالة بنشاط المستخدم والجلسة.',output:'قرار احتواء يحفظ الأدلة · متطلبات فتح',time:'تحقيق متقدم'}
];
export default function Practice(){return <div className="training-page">
 <header className="training-heading"><span className="eyebrow">التدريب</span><h1>افحص، استنتج، ثم تحقق</h1></header>
 <CoreJourneyStart compact/>
 <section aria-labelledby="training-choice"><h2 id="training-choice">اختر مشكلة تتدرب على حلها</h2><div className="practical-cases">{destinations.map(d=><Link href={d.href} key={d.href}><span>{d.time}</span><h3>{d.title}</h3><p>{d.description}</p><div><small>مخرج التدريب</small><strong>{d.output}</strong></div><b>افتح التدريب</b></Link>)}</div></section>
 <nav className="practical-catalog" aria-label="جميع التدريبات"><Link href="/labs">جميع المختبرات</Link><Link href="/missions">جميع المهمات</Link><Link href="/bosses">التحقيقات المتقدمة</Link><Link href="/operations">العمليات والقضايا</Link></nav>
 <p className="training-note">المختبرات محاكاة آمنة. <Link href="/learn">افتح درسًا عند الحاجة</Link>.</p>
 </div>}
