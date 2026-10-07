'use client';
import {useState} from 'react';
import Link from '@/components/native-link';
import {useProgress} from '@/app/shell';
import {completedIds} from '@/lib/metrics';
import {lessons,type PublicLesson} from '@/lib/curriculum';
import {isCyberLesson} from '@/lib/content-scope';
import {interactiveLabs} from '@/lib/interactive-labs';
import {missions as missionsCatalog} from '@/lib/missions';
import {bossMissions} from '@/lib/boss-missions';

export function LessonOrientation({lesson,returnTo}:{lesson:PublicLesson;returnTo?:string|null}){
 const {items,learning,loading,error}=useProgress(),done=completedIds(items,learning);
 const specificGoal=lesson.objectives?.some(goal=>goal!==`اربط ${lesson.title} بمثال من العمل واشرح أثره.`);
 const prerequisites=(lesson.prerequisites||[]).filter(id=>!isCyberLesson(lesson.id)||isCyberLesson(id)).map(id=>lessons.find(l=>l.id===id)).filter((l):l is PublicLesson=>!!l);
 if(!lesson.objectives||(!specificGoal&&!prerequisites.length))return null;
 return <div className="curriculum-orientation">{specificGoal&&<p className="lesson-goal">{lesson.objectives.join('، ')}</p>}{!!prerequisites.length&&<details className="lesson-prerequisites"><summary>أساسيات للمراجعة عند الحاجة</summary><div className="curriculum-prereqs">{prerequisites.map(l=><Link key={l.id} href={'/learn/'+l.id+(returnTo?'?return_to='+encodeURIComponent(returnTo):'')}>{loading||error?'◦':done.has(l.id)?'✓':''} {l.title}</Link>)}</div></details>}</div>;
}

export function LessonInvestigation({lesson}:{lesson:PublicLesson}){
 const [chosen,setChosen]=useState<number|null>(null),scenario=lesson.interaction;
 if(!scenario)return null;
 const label={network:'مخطط شبكة',terminal:'مخرجات طرفية محاكية',email:'رسالة بريد محاكية',log:'سجل محاكاة',scenario:'قرار في موقف عملي'}[scenario.kind];
 return <section className="panel curriculum-investigation"><span className="eyebrow">GUIDED PRACTICE / {label}</span><h2>افحص الدليل ثم قرر</h2><pre dir="auto">{scenario.artifact}</pre><p>{scenario.prompt}</p><div className="curriculum-choices">{scenario.choices.map((option,index)=><button key={index} type="button" className="secondary-button" aria-pressed={chosen===index} onClick={()=>setChosen(index)}>{option.label}</button>)}</div>{chosen!==null&&<p role="status" className={'feedback '+(scenario.choices[chosen].right?'success':'wrong')}>{scenario.choices[chosen].feedback}</p>}<small>تدريب موجه بلا نقاط؛ الاختبار والمختبر يقيسان التطبيق بعد ذلك.</small></section>;
}

export function LessonPracticeRoute({lesson,returnTo}:{lesson:PublicLesson;returnTo?:string|null}){
 if(!lesson.objectives||returnTo)return null;
 if(lesson.id==='network-5')return <section className="curriculum-practice-route"><h2>طبّق على جهاز لا يصل إلى البوابة</h2><p>قارن العنوان بالشبكة، واختبر تعديلًا واحدًا ثم راجع النتيجة.</p><Link className="primary-button" href="/experience/nexacorp-first">افتح البلاغ الموجّه</Link></section>;
 if(lesson.id==='security-8')return <section className="curriculum-practice-route"><h2>طبّق على رسالة مشبوهة</h2><p>افحص المرسل والترويسة والرابط، ثم اختر قرارًا تدعمه الأدلة.</p><Link className="primary-button" href="/experience/nexacorp-email">افتح بلاغ البريد</Link></section>;
 const links=[
  ...(lesson.relatedLabs||[]).map(id=>({href:'/labs/v2/'+id+'?return_to='+encodeURIComponent('/learn/'+lesson.id),label:'مختبر · '+(interactiveLabs.find(l=>l.id===id)?.title||id)})),
  ...(lesson.relatedMissions||[]).map(id=>({href:'/missions/'+id,label:'مهمة · '+(missionsCatalog.find(m=>m.id===id)?.title||id)})),
  ...(lesson.relatedBossMissions||[]).map(id=>({href:'/bosses/'+id,label:'تحقيق · '+(bossMissions.find(m=>m.id===id)?.title||id)})),
  ...(lesson.relatedAlerts||[]).map(id=>({href:'/soc/alerts/'+id,label:'تنبيه SOC · '+id}))
 ];
 if(!links.length&&lesson.track==='soc')links.push({href:'/soc',label:'تنبيهات SOC'});
 if(!links.length)return null;
 return <section className="curriculum-practice-route"><h2>تدريب مرتبط بالدرس</h2><div className="curriculum-links">{links.slice(0,2).map(l=><Link key={l.href} href={l.href}>{l.label}</Link>)}</div>{links.length>2&&<details className="lesson-prerequisites"><summary>تدريبات إضافية</summary><div className="curriculum-links">{links.slice(2).map(l=><Link key={l.href} href={l.href}>{l.label}</Link>)}</div></details>}</section>;
}
export function LessonIndependent({lesson}:{lesson:PublicLesson}){
 if(!lesson.independent)return null;
 return <section className="panel curriculum-investigation"><span className="eyebrow">INDEPENDENT DECISION / حالة جديدة</span><h2>استنتج من الدليل</h2><pre dir="auto">{lesson.independent.artifact}</pre><p>{lesson.independent.prompt}</p><small>اختر قرارك في السؤال الأول أدناه؛ تظهر أسباب الإجابات بعد التصحيح.</small></section>;
}
