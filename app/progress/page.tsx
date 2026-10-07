'use client';
import Link from '@/components/native-link';
import {useProgress} from '../shell';
import {learningMetrics} from '@/lib/metrics';
import {skillTitles,completedLessonText} from '@/lib/progression';
import {useProgression,ProgressionState,LevelProgressPath,NextGoal,AchievementPreview} from '../progression/view';
import LearningEvidence from './evidence';
export default function ProgressPage(){
 const api=useProgression(),progress=useProgress(),{items,learning}=progress,m=learningMetrics(items,learning);
 return <div className="progression-hub"><header className="page-heading"><div><h1>رحلتك في CyberLab</h1><p>إنجازاتك المحفوظة، أدلة تعلمك، وخطوتك التالية في مكان واحد.</p></div></header>
 {!api.data?<ProgressionState api={api}/>:<>
  {progress.error?<section className="empty-state" role="alert"><p>تعذر استعادة سجل التعلم. لا يمكن عرض ملخص موثوق الآن.</p><button className="secondary-button" onClick={()=>void progress.refresh()}>أعد تحميل السجل</button></section>:!progress.loading&&<LearningEvidence items={items} learning={learning} data={api.data}/>}
  <div className="progression-main"><NextGoal data={api.data}/><LevelProgressPath xp={api.data.xp}/></div>
  <AchievementPreview data={api.data}/>
  <details className="progression-details progression-panel"><summary>جميع المهارات وأدلة الإتقان</summary><p>نقاط المهارة تسجل الممارسة، والإتقان يقدّر جودة الأداء. أقل من مصدرين يعني أن التقييم أولي.</p><div className="progression-skill-grid">{api.data.mastery.map(s=><div key={s.id}><h3>{skillTitles[s.id]||s.id}</h3><strong>{s.mastery===null?'لم يُقيّم بعد':s.samples<2?'تقييم أولي':s.mastery+'% إتقان تقديري'}</strong><small>{s.xp} نقطة مهارة · {s.samples} مصادر تقييم</small>{s.samples<2&&<small>تحتاج أدلة إضافية لتقييم موثوق</small>}</div>)}</div><Link href="/skills">تفاصيل المهارات والإتقان ←</Link></details>
  <details className="progression-details progression-panel"><summary>الجاهزية المهنية</summary><p>الرتبة تعكس تقدمك العام؛ الجاهزية المهنية تعتمد على المهارات ومتطلبات التدريب.</p><h3>{api.data.career.title}</h3><p>{api.data.career.next?`${api.data.career.readiness}% من جاهزية المرحلة التالية · ${api.data.career.next}`:'استوفيت المراحل التدريبية الحالية.'}</p><Link href="/career">راجع المتطلبات المهنية ←</Link><span> · </span><Link href="/profile#ranks">محطات الرتب ←</Link></details>
  {!progress.error&&!progress.loading&&<details className="progression-details progression-panel"><summary>سجل التعلم والمراجع المحفوظة</summary><p>{completedLessonText(m.done.size)} · {Math.floor(m.totalSeconds/60)} دقيقة قراءة مسجلة، وليست مقياسًا للفهم.</p><div className="progression-links"><Link href="/history">سجل النشاط</Link><Link href="/roadmap">خارطة المعرفة</Link><Link href="/profile">ملفي الشخصي</Link></div></details>}
 </>}</div>;
}
