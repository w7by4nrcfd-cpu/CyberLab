import {labLearning,labLearningSteps,type LabLearningScope} from '@/lib/lab-learning';
import type {LabSession} from '@/lib/interactive-lab-engine';

export default function LabLearningGuide({id,session,scope,returnTo}:{id:string;session:LabSession;scope:LabLearningScope;returnTo:string}){
 const meta=labLearning[id],steps=labLearningSteps(id,session,scope);
 const current=steps.findIndex(step=>!step.done);
 if(!meta||current<0)return null;
 const lessonHref='/learn/'+meta.reference.id+'?return_to='+encodeURIComponent('/labs/v2/'+id+(returnTo?'?return_to='+encodeURIComponent(returnTo):''));
 return <section className="lab-learning-guide" aria-label="مسار المختبر">
  <div className="lab-learning-next"><span className="eyebrow">خطوتك الآن · {current+1} من {steps.length}</span><h2>{steps[current].title}</h2><p>{steps[current].instruction}</p></div>
  <details className="lab-learning-reference"><summary>مراحل الفحص · {steps.filter(step=>step.done).length} من {steps.length} نُفّذت</summary><ol>{steps.map((step,i)=><li key={step.title} aria-current={i===current?'step':undefined}><span>{step.title}</span><small>{step.done?'نُفّذت':i===current?'الحالية':'لاحقًا'}</small></li>)}</ol></details>
  <details className="lab-learning-reference"><summary>تحتاج مراجعة المفهوم؟</summary><a href={lessonHref}>{meta.reference.title}</a><p>يمكنك العودة إلى المختبر؛ الفحوص المحفوظة في حسابك لا تحتاج إكمال الدرس لاستعادتها.</p></details>
 </section>;
}
