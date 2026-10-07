import Link from '@/components/native-link';
import {skillTitles} from '@/lib/progression';
import type {ProgressionData} from '@/lib/progression';
import {progressEvidence} from '@/lib/progress-evidence';
import type {Item,Learning} from '../shell';
import {lessons} from '@/lib/curriculum';

const lessonIds=new Set(lessons.map(l=>l.id));
export default function LearningEvidence({items,learning,data}:{items:Item[];learning:Learning;data:ProgressionData}){
 const e=progressEvidence(items,learning,data,lessonIds);
 const active=e.read+e.assessed+e.labs+e.missions>0||data.mastery.some(s=>s.samples>0||s.xp>0);
 const groups=[
  {title:'مهارات أظهرت فيها أداءً جيدًا',skills:e.strong,empty:'لم تتوفر أدلة كافية بعد. الإكمال وحده لا يثبت الإتقان.'},
  {title:'مهارات تحتاج تدريبًا إضافيًا',skills:e.review,empty:'لا توجد مهارات مصنفة «قيد التطوير» حاليًا؛ هذا لا يعني إتقان كل المهارات.'},
  {title:'بدأت ممارستها وتحتاج أدلة أكثر',skills:e.emerging,empty:'لا توجد مهارات بدأ تقييمها بأدلة قليلة حاليًا.'},
 ];
 return <section className="progression-panel learning-evidence" aria-labelledby="learning-evidence-title">
  <span className="eyebrow">أثر تعلمك</span><h2 id="learning-evidence-title">ماذا أنجزت، وماذا يحتاج مراجعة؟</h2>
  <p>القراءة تبني المعرفة، والتقييم والتدريب يقدمان أدلة على الأداء. نقاط الخبرة ليست نسبة إتقان.</p>
  {!active&&<p className="evidence-empty">هذه نقطة البداية. أكمل الخطوة المقترحة أدناه لتظهر إنجازاتك المحفوظة هنا.</p>}
  <dl className="evidence-stats">
   <div><dt>دروس بدأت قراءتها</dt><dd>{e.read}<small>لها وقت قراءة مسجل، ولو لم تكملها</small></dd></div>
   <div><dt>تقييمات دروس مكتملة</dt><dd>{e.assessed}<small>دروس لها نتيجة إكمال محفوظة</small></dd></div>
   <div><dt>مختبرات مكتملة</dt><dd>{e.labs}<small>مختبرات فريدة، دون تكرار الإعادة</small></dd></div>
   <div><dt>مهام مكتملة</dt><dd>{e.missions}<small>مهام وقضايا ختامية محفوظة</small></dd></div>
  </dl>
  <small>قد يظهر الدرس في القراءة والتقييم معًا؛ لا نجمعهما كإنجازين. تمارين الفهم الاختيارية لا تُحفظ ولا تدخل هذه الأرقام.</small>
  <div className="evidence-skills">{groups.map((g,index)=><article key={g.title}>
   <h3>{g.title} <span>({g.skills.length})</span></h3>
   {g.skills.length?<ul>{g.skills.slice(0,3).map(s=><li key={s.id}><strong>{skillTitles[s.id]||s.id}</strong><small>{index===2?'تقييم أولي · تحتاج مصادر إضافية':`${s.mastery}% إتقان تقديري`} · {s.samples} مصادر تقييم</small></li>)}</ul>:<p>{g.empty}</p>}
   {g.skills.length>3&&<small>و{g.skills.length-3} مهارات أخرى في التفاصيل.</small>}
  </article>)}</div>
  <p className="progression-muted">الإتقان تقدير من أدلة التدريب المتاحة، وليس شهادة جاهزية مهنية. راجع نتيجة التدريب وتعليل القرار لتحسين الأداء.</p>
  <div className="progression-links"><Link href="/skills">تفاصيل المهارات وأدلة الأداء ←</Link><Link href="/history">سجل نشاطك المحفوظ ←</Link></div>
 </section>;
}
