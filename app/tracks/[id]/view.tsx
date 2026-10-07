'use client';
import {useEffect} from 'react';
import Link from '@/components/native-link';
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { labs, lessons, tracks } from '@/lib/curriculum';
import { labHref, labTracks, lessonHref } from '@/lib/navigation';
import { completedIds } from '@/lib/metrics';
import { useProgress } from '@/app/shell';
import {isCyberLesson,cyberTrackLabels,scopeForLesson,scopeLabels} from '@/lib/content-scope';
import {modulePlans} from '@/lib/curriculum-expansion';
import {interactiveLabs} from '@/lib/interactive-labs';

export default function TrackDetail({track}:{track:(typeof tracks)[number]}) {
  const {items,learning,loading,error,user} = useProgress();
  useEffect(()=>{if(loading||error)return;const target=window.location.hash.slice(1);if(!/^module-\d+-\d+$/.test(target))return;const frame=requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({block:'start'}));return()=>cancelAnimationFrame(frame)},[loading,error]);
  if (loading || error) return <div className="reading-width"><Link className="back-link" href="/learn"><ArrowRight size={17}/>جميع المسارات</Link><h1>{track.name}</h1><p role={error ? 'alert' : 'status'}>{error ? 'تعذر تحميل تقدمك. أعد تحميل الصفحة أو حاول لاحقًا.' : 'جارٍ تحميل تقدمك المحفوظ…'}</p></div>;
  const done = completedIds(items,learning);
  const all = lessons.filter(l => l.track === track.id);
  const main=all.filter(l=>isCyberLesson(l.id)),extra=all.filter(l=>!isCyberLesson(l.id));
  const count = all.filter(l => done.has(l.id)).length;
  const challenges = labs.filter(l => labTracks[l.id]?.includes(track.id));
  const next = main.find(l => !done.has(l.id)) ?? main[0];
  const mainCompleted = main.length > 0 && main.every(l => done.has(l.id));
  const started = all.some(l => learning.activity.some(a => a.id === l.id));
  const trackIds = new Set(all.map(l => l.id));
  const minutes = Math.floor(learning.activity.filter(a => trackIds.has(a.id)).reduce((sum,a) => sum + a.seconds, 0) / 60);
  const xp = items.filter(i => i.kind === 'quiz' && trackIds.has(i.id)).reduce((sum,i) => sum + i.xp, 0);
  const percent = all.length ? Math.round(count / all.length * 100) : 0;
  const currentLevel = next ? count === all.length ? Math.max(...all.map(l => l.level || 1)) : next.level || 1 : null;
  return <div className="reading-width"><Link className="back-link" href="/learn"><ArrowRight size={17}/>جميع المسارات</Link>
    <div className="page-heading"><div><div className="eyebrow">{track.label} / TRACK</div><h1>{cyberTrackLabels[track.id]||track.name}</h1><p>معرفة تخدم الفحص والحماية والتحقيق؛ افتحها عند الحاجة داخل القضية.</p></div></div>
    {!user && <div className="safe-banner" role="status"><p>أنت تتصفح كزائر. يمكنك تجربة الدروس، لكن تقدمك ونقاطك لن يُحفظا بعد إغلاق الموقع. <a href={'/signin-with-chatgpt?return_to='+encodeURIComponent('/tracks/'+track.id)} target="_top">سجّل الدخول لحفظ تقدمك ←</a></p></div>}
    <section className="panel track-summary"><strong>{main.filter(l=>done.has(l.id)).length} من {main.length} مرجعًا سيبرانيًا مكتملًا</strong><Progress value={main.length?main.filter(l=>done.has(l.id)).length/main.length*100:0} aria-label={'تقدم '+track.name}/>{next && <a className="primary-button" href={lessonHref(next.id)}>{mainCompleted ? 'راجع المرجع الأول' : count || started ? 'تابع التعلم' : 'ابدأ أول مرجع'} <ArrowLeft size={18}/></a>}
      <details className="track-progress-details"><summary>تقدمي في المنهج الأصلي كاملًا</summary><p>{track.name} · يشمل المعرفة الإضافية. إنجازاتك السابقة محفوظة.</p><div className="track-progress-grid"><div><span>الدروس المكتملة</span><strong>{count} من {all.length}</strong></div><div><span>نسبة الإنجاز</span><strong>{percent}%</strong></div><div><span>المستوى الحالي</span><strong>{currentLevel ? `المستوى ${currentLevel}` : '—'}</strong></div><div><span>وقت التعلم المسجل</span><strong>{minutes} دقيقة</strong></div><div><span>نقاط المسار</span><strong>{xp} XP</strong></div></div><p>{count === all.length ? 'أكملت جميع دروس هذا المسار.' : next ? <>الدرس التالي: <a href={lessonHref(next.id)}>{next.title} ←</a></> : 'لا توجد دروس في هذا المسار بعد.'}</p></details>
    </section>
    {[...new Set(all.map(l => l.level || 1))].map(level => { const originalGroup=all.filter(l=>(l.level||1)===level),group=main.filter(l=>(l.level||1)===level);if(!group.length)return null; const modules = [...new Set(originalGroup.map(l => l.module || 'الأساسيات'))]; const plan=modulePlans[track.id]?.[level-1]; return <section className="level-block" key={level}><div className="level-heading"><h2>المستوى {level}</h2><span>{group.filter(l => done.has(l.id)).length} من {group.length} درسًا</span></div>{modules.map((module,moduleIndex) => group.some(l=>(l.module||'الأساسيات')===module)&&<div id={'module-'+level+'-'+moduleIndex} key={module}><h3 className="module-heading">{module}</h3>{plan&&<div className="panel curriculum-module"><p><strong>هدف الوحدة:</strong> {plan.goal}</p><p><strong>لماذا الآن؟</strong> {plan.why}</p><p><strong>التطبيق:</strong> {plan.practice}</p><p><strong>التقييم:</strong> {plan.assessment}</p>{!!plan.prerequisites.filter(isCyberLesson).length&&<p><strong>راجع قبل البدء:</strong> {plan.prerequisites.filter(isCyberLesson).map(id=><a href={lessonHref(id)} key={id}>{lessons.find(l=>l.id===id)?.title||id} ↗ </a>)}</p>}{!!plan.relatedLabs.length&&<p><strong>مختبر الوحدة:</strong> {plan.relatedLabs.map(id=><a key={id} href={'/labs/v2/'+id}>{interactiveLabs.find(l=>l.id===id)?.title||id} ← </a>)}</p>}</div>}<div className="lesson-list">{group.filter(l => (l.module || 'الأساسيات') === module).map(l => <a key={l.id} className="lesson-row" href={lessonHref(l.id)}><span className="lesson-number">{done.has(l.id) ? <CheckCircle2 size={20}/> : '◦'}</span><div><h3>{l.title}</h3><p>{scopeLabels[scopeForLesson(l.id)]} · {l.interaction?l.objectives?.[0]:l.intro}</p></div><span className="lesson-meta">{l.minutes} دقائق</span><ArrowLeft size={18}/></a>)}</div></div>)}</section>})}
    {extra.length>0&&<details className="guided-disclosure scope-additional"><summary>المعرفة الإضافية في المنهج الأصلي</summary><p>خارج الرحلة السيبرانية الأساسية. تبقى الدروس وإنجازاتها متاحة هنا.</p><div className="lesson-list">{extra.map(l=><a className="lesson-row" href={lessonHref(l.id)} key={l.id}><span className="lesson-number">{done.has(l.id)?<CheckCircle2 size={19}/>:l.level||1}</span><div><h3>{l.title}</h3><p>{scopeLabels[scopeForLesson(l.id)]}</p></div></a>)}</div></details>}
    {challenges.length > 0 && <section className="track-challenges"><h2>تحديات عملية آمنة</h2><p>اختر مهمة، جرّب الحل، ثم ارجع إلى هذا المسار.</p><div className="lesson-list">{challenges.map(l => <a key={l.id} className="lesson-row" href={labHref(l.id,track.id)}><FlaskConical size={22}/><div><h3>{l.title}</h3><p>{l.description}</p></div><span className="lesson-meta">{items.some(i => i.kind === 'lab' && i.id === l.id) ? 'مكتمل' : 'ابدأ التحدي'}</span><ArrowLeft size={18}/></a>)}</div></section>}
  </div>;
}
