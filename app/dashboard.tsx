'use client';
import LoadingState from '@/components/loading-state';
import JourneyShortcuts from '@/components/journey-shortcuts';
import {useState} from 'react';
import Link from '@/components/native-link';
import { ArrowLeft, Code2, Network, Shield, FlaskConical, BookOpen, Activity, TrendingUp, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useProgress } from './shell';
import { tracks, type PublicLesson } from '@/lib/curriculum';
import AdaptiveOverview from './adaptive/overview';
import {CareerCard} from './career/view';
import {RankSummary} from './rank/experience';
import {guidedLesson,cyberStage} from '@/lib/guided-progression';
import {contentScope,isCyberLesson} from '@/lib/content-scope';
import {isCoreBeginner} from '@/lib/mission-first-core';
import CoreJourneyStart from '@/app/experience/core-start';
import LearningAtlas from '@/components/learning-atlas';
import LearningDesk from '@/components/learning-desk';
const icons = [Code2, Network, Shield];
export function TrackCards({ lessons }: {
    lessons: PublicLesson[];
}) { const { items, learning } = useProgress(); return <div className="track-grid">{tracks.map((t, i) => { const done = lessons.filter(l => l.track === t.id && (items.some(p => p.id === l.id) || learning.activity.some(a => a.id === l.id && a.completedAt))).length; const total = lessons.filter(l => l.track === t.id).length; const Icon = icons[i % icons.length]; return <a href={'/tracks/' + t.id} className={'track-card ' + t.color} key={t.id}><div className="between"><span className="course-icon"><Icon size={25}/></span><span className="micro" dir="ltr">{String(i+1).padStart(2,"0")} / PATH</span></div><span className="eyebrow">{t.label}</span><h3>{t.name}</h3><p>{t.description}</p><div className="track-bottom"><div className="between"><span>{total} درسًا · متدرج</span><b>{done} من {total}</b></div><Progress value={total ? done / total * 100 : 0} aria-label={'التقدم في ' + t.name}/><div className="between link-line"><span>{done ? 'تابع المسار' : 'ابدأ المسار'}</span><ArrowLeft size={18}/></div></div></a>; })}</div>; }
export default function Dashboard({ lessons }: { lessons: PublicLesson[] }) {
 const {items,learning,user,loading,error}=useProgress();
 const [coreKnownAdvanced,setCoreKnownAdvanced]=useState(false),[progressOpen,setProgressOpen]=useState(false),[careerOpen,setCareerOpen]=useState(false);
 if(user&&(loading||error))return error?<div className="reading-width" role="alert"><p>تعذر تحميل تقدمك. أعد المحاولة من أعلى الصفحة.</p></div>:<LoadingState>جارٍ تحميل تقدمك المحفوظ…</LoadingState>;
 if(!coreKnownAdvanced&&isCoreBeginner(items.filter(item=>!contentScope[item.id]||isCyberLesson(item.id)),learning.activity.filter(a=>isCyberLesson(a.id))))return <div className="atlas-home"><LearningAtlas lessons={lessons}/><CoreJourneyStart compact visual onAdvanced={()=>setCoreKnownAdvanced(true)}/><LearningDesk lessons={lessons}/></div>;
 const completed=(id:string)=>items.some(i=>i.id===id)||learning.activity.some(a=>a.id===id&&a.completedAt);
 const done=lessons.filter(l=>completed(l.id)).length;
 const xp=items.reduce((sum,item)=>sum+item.xp,0);
 const doneIds=new Set(lessons.filter(l=>completed(l.id)).map(l=>l.id));
 const {lesson:next,continuing}=guidedLesson(doneIds,learning.activity);
 const currentStage=cyberStage(doneIds,next.id),knowledgeComplete=lessons.filter(l=>isCyberLesson(l.id)).every(l=>doneIds.has(l.id));
 const destinations=[
  {href:'/operations',title:'العمليات',description:'الحملة القصصية وSOC Console.',icon:Activity,action:'افتح العمليات'},
  {href:'/roadmap',title:'خارطة التعلم',description:'اعرف موقعك في المسارات ومتطلبات المرحلة التالية.',icon:BookOpen,action:'افتح الخارطة'}
 ];
 return <div className="dashboard-home atlas-home"><LearningAtlas lessons={lessons}/>
 <section className="continue-card" aria-label="الخطوة التالية"><span className="eyebrow">خطوتك التالية · {knowledgeComplete?'طبّق معرفتك':continuing?'تابع ما بدأت':currentStage?.title||'تابع تعلّمك'}</span><h2>{knowledgeComplete?'أكملت المراجع السيبرانية الحالية':next.title}</h2><p>{knowledgeComplete?'تابع التدريب المتاح أو راجع تقييمًا لتحسين فهمك؛ إنجازاتك محفوظة.':continuing?'أكمل الدرس الذي بدأت به. ':''}{!knowledgeComplete&&next.intro}</p><div className="continue-bottom"><Link className="primary-button" href={knowledgeComplete?'/practice':'/learn/'+next.id}>{knowledgeComplete?'اختر التدريب التالي':continuing?'تابع الدرس':done?'ابدأ الدرس التالي':'ابدأ أول درس'} <ArrowLeft size={18}/></Link><span>{knowledgeComplete?'التقدم المحفوظ يبقى كما هو':next.minutes+' دقائق · تُمنح نقاط الاجتياز مرة واحدة'}</span></div></section>
 <div className="guided-summary"><span>مرحلتك الحالية: <strong>{currentStage?.title||'المسارات الأساسية مكتملة'}</strong>{currentStage?` · ${currentStage.completed} من ${currentStage.total} درسًا`:''}</span><Link href="/roadmap">أين أنا في خارطة التعلم؟ ←</Link></div>
 <LearningDesk lessons={lessons}/><JourneyShortcuts/><p className="dashboard-progress-note">أنجزت {done} من {lessons.length} درسًا · <a href="/progress">راجع تفاصيل تقدمك</a></p><details className="guided-disclosure"><summary>خارطة التعلم والعمليات المتقدمة</summary><section className="dashboard-directions" aria-label="أقسام CyberLab"><div className="dashboard-direction-grid">{destinations.map(d=>{const Icon=d.icon;return <Link href={d.href} key={d.href} className="dashboard-direction"><Icon size={23}/><strong>{d.title}</strong><p>{d.description}</p><span>{d.action} <ArrowLeft size={16}/></span></Link>})}</div></section></details>
 {user&&<details className="guided-disclosure" onToggle={e=>{if(e.target===e.currentTarget){setProgressOpen(e.currentTarget.open);if(!e.currentTarget.open)setCareerOpen(false)}}}><summary>التدريب الموصى به وسجل التقدم</summary>{progressOpen&&<><AdaptiveOverview/><RankSummary xp={xp}/><details className="guided-disclosure" open={careerOpen} onToggle={e=>{if(e.target===e.currentTarget)setCareerOpen(e.currentTarget.open)}}><summary>المراحل المهنية المحفوظة سابقًا</summary>{careerOpen&&<CareerCard/>}</details></>}</details>}
 {!user&&<div className="guest-note"><Trophy size={22}/><p>يمكنك استكشاف الدروس والمختبرات الآن. سجّل الدخول حتى تُحفظ إنجازاتك عبر الأجهزة.</p><a href="/signin-with-chatgpt?return_to=/" target="_top">حفظ رحلتي <ArrowLeft size={16}/></a></div>}
 </div>;
}
