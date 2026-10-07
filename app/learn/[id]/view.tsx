'use client';
import { useState } from 'react';
import Practice from '../practice';
import TechnicalText from '@/components/technical-text';
import Link from '@/components/native-link';
import { ArrowRight, ArrowLeft, CheckCircle2, Lightbulb, Clock, Terminal, RotateCcw } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useProgress } from '@/app/shell';
import { tracks, type PublicLesson } from '@/lib/curriculum';
import {scopeForLesson,scopeLabels} from '@/lib/content-scope';
import AdvancedQuiz from '../advanced-quiz';
import LessonTools from '../lesson-tools';
import CopyExample from '@/components/copy-example';
import LessonDiagram from '../diagram';
import LabBridge from '@/app/labs/v2/lab-bridge';
import {LessonOrientation,LessonInvestigation,LessonPracticeRoute,LessonIndependent} from '../curriculum-context';
type Result = {
    score: number;
    total: number;
    passed: boolean;
    guest: boolean;
    feedback: {
        correct: boolean;
        answer: number;
        explanation: string;
    }[];
};
export default function LessonView({ lesson, next, returnTo }: {
    lesson: PublicLesson;
    next?: string;
    returnTo?:string|null;
}) {
    const [answers, setAnswers] = useState<number[]>([-1, -1, -1]);
    const [result, setResult] = useState<Result | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('lesson');
    const { refresh, user, loading, error: progressError } = useProgress();
    async function submit() { setBusy(true); setError(''); try {
        const r = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'quiz', id: lesson.id, answers }) });
        const d = await r.json() as Result & {
            error?: string;
        };
        if (!r.ok)
            throw Error(d.error);
        setResult(d);
        if (user) await refresh();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'تعذر التصحيح. حاول مجددًا.');
    }
    finally {
        setBusy(false);
    } }
    const assessmentReturn=!!returnTo?.startsWith('/labs/v2/');
    return <div className="reading-width">{returnTo&&<div className="pilot-return"><span>{assessmentReturn?'فتحت المرجع من تقييم NexaCorp. موضع الاختبار محفوظ ويمكنك العودة دون إكمال الدرس.':'فتحت هذا المرجع من بلاغ NexaCorp. يمكنك العودة إلى موضع الفحص دون إكمال الاختبار.'}</span></div>}<Link className="back-link" href={returnTo||'/tracks/'+lesson.track}><ArrowRight size={17}/>{returnTo?assessmentReturn?'العودة إلى التقييم':'العودة إلى البلاغ':'العودة إلى المسار'}</Link><div className="page-heading"><div><div className="eyebrow">{tracks.find(t => t.id === lesson.track)?.name} · المستوى {lesson.level || 1} · {lesson.module || "الأساسيات"}</div><h1>{lesson.title}</h1>{lesson.intro!==lesson.sections[0]?.text&&<p><TechnicalText text={lesson.intro}/></p>}{!!lesson.terms?.length&&<p className="lesson-term">{lesson.terms.map(t=><span key={t.en}><span dir="ltr">{t.en}</span>{' · '}{t.ar}{' '}</span>)}</p>}</div></div><div className="lesson-badges"><span>{scopeLabels[scopeForLesson(lesson.id)]}</span><span><Clock size={16}/>{lesson.minutes} دقائق</span><span>{lesson.project ? "مشروع تطبيقي" : "تعلّم متدرج"}</span><span>{lesson.independent ? "+100 XP · قرار الحالة + سؤال آخر" : "+100 XP · اجتياز سؤالين من ٣"}</span></div>{!user&&<div className="safe-banner" role="status"><p>أنت في وضع الزائر: يمكنك تجربة الاختبار، لكن النتيجة والنقاط لن تُحفظ. <a href={'/signin-with-chatgpt?return_to='+encodeURIComponent('/learn/'+lesson.id+(returnTo?'?return_to='+encodeURIComponent(returnTo):''))} target="_top">سجّل الدخول قبل إكماله ←</a></p></div>}{user&&progressError&&<p role="alert" className="error">تعذر تحميل تقدمك؛ تحقق من الاتصال قبل إكمال الاختبار.</p>}<Tabs value={tab} onValueChange={setTab} dir="rtl"><TabsList className="lesson-tabs"><TabsTrigger value="lesson">الدرس والمثال</TabsTrigger><TabsTrigger value="quiz">اختبر فهمك</TabsTrigger></TabsList><TabsContent value="lesson"><article className="lesson-content"><LessonOrientation lesson={lesson} returnTo={returnTo}/>{lesson.sections.map((s, i) => <section key={s.title}><span className="section-number">0{i + 1}</span><h2><TechnicalText text={s.title}/></h2><p><TechnicalText text={s.text}/></p></section>)}<LessonDiagram id={lesson.id}/>{lesson.code&&<div className="code-window"><div><Terminal size={16}/> {lesson.track === 'python' ? 'Python 3 · مثال للقراءة' : 'مثال توضيحي'}</div><pre dir="ltr" tabIndex={0} role="region" aria-label="الكود التوضيحي"><code>{lesson.code}</code></pre><CopyExample key={lesson.id} id={lesson.id} text={lesson.code}/><div className="output-label">النتيجة المتوقعة</div><pre tabIndex={0} role="region" aria-label="النتيجة المتوقعة للكود" dir={lesson.track === 'python' ? 'ltr' : 'auto'} className="code-output">{lesson.output}</pre></div>}<LessonInvestigation lesson={lesson}/>{!lesson.practice && !lesson.interaction && <div className="exercise"><Lightbulb size={23}/><div><strong>توقف وجرّب التفكير</strong><p><TechnicalText text={lesson.exercise}/></p></div></div>}{lesson.practice && <Practice key={lesson.id} practice={lesson.practice}/>}{returnTo&&<Link className="primary-button" href={returnTo}>{assessmentReturn?'عد إلى التقييم وطبّق ما تعلمت':'عد إلى القضية وطبّق ما تعلمت'}</Link>}<button className={returnTo?'secondary-button':'primary-button'} onClick={() => setTab('quiz')}>{returnTo?'اختبر فهمك اختياريًا':'جاهز؟ اختبر فهمك'} <ArrowLeft size={18}/></button><LessonTools key={(user?.email||'guest')+':'+lesson.id} lesson={lesson} next={next} returnTo={returnTo}/>{!lesson.objectives&&<LabBridge lessonId={lesson.id} returnTo={returnTo}/>}<LessonPracticeRoute lesson={lesson} returnTo={returnTo}/> </article></TabsContent><TabsContent value="quiz"><LessonIndependent lesson={lesson}/>{lesson.terms || lesson.independent ? <AdvancedQuiz lesson={lesson} next={next} returnTo={returnTo}/> : <form onSubmit={e => { e.preventDefault(); void submit(); }} className="quiz"><p className="muted">اختر إجابة واحدة لكل سؤال. يمكنك إعادة الاختبار دون خسارة نقاطك.</p>{lesson.questions.map((q, i) => <section className="question" key={q.prompt}><h3><span>{i + 1}.</span> {q.prompt}</h3><RadioGroup value={String(answers[i])} onValueChange={v => setAnswers(a => a.map((x, j) => j === i ? Number(v) : x))} disabled={!!result || busy} dir="rtl" aria-label={q.prompt}>{q.options.map((o, j) => <label className={'answer-option ' + (result && j === result.feedback[i].answer ? 'correct' : '')} key={j} htmlFor={`q${i}-${j}`}><RadioGroupItem id={`q${i}-${j}`} value={String(j)}/><span>{o}</span></label>)}</RadioGroup>{result && <p className={'feedback ' + (result.feedback[i].correct ? 'success' : 'wrong')}>{result.feedback[i].correct ? 'إجابة صحيحة. ' : 'تحتاج مراجعة. '}{result.feedback[i].explanation}</p>}</section>)}{error && <p className="error" role="alert">{error}</p>}{!result ? <button disabled={busy || answers.includes(-1) || (!!user && (loading || !!progressError))} className="primary-button" type="submit">{busy ? 'جارٍ التصحيح والحفظ…' : 'تصحيح إجاباتي'}</button> : <div className="result-panel" aria-live="polite"><CheckCircle2 /><h2>{result.passed ? result.guest ? 'اجتزت الاختبار التجريبي' : 'أحسنت، اجتزت الدرس!' : 'خطوة أخرى وستتقنها'}</h2><p>النتيجة: {result.score} من {result.total}</p><p>{result.guest ? 'هذه محاولة تجريبية غير محفوظة. سجّل الدخول ثم أعد الإرسال لحفظ تقدمك.' : result.passed ? 'حُفظ تقدمك. لكل درس 100 نقطة مرة واحدة.' : 'راجع الشرح ثم أعد المحاولة. لا تُخصم أي نقاط.'}</p><div className="button-row"><button className="secondary-button" type="button" onClick={() => { setResult(null); setAnswers([-1, -1, -1]); }}><RotateCcw size={16}/>إعادة الاختبار</button>{returnTo?<Link className="primary-button" href={returnTo}>عد إلى النشاط وطبّق ما تعلمت</Link>:result.passed && !result.guest && next && <Link className="primary-button" href={'/learn/' + next}>الدرس التالي<ArrowLeft size={17}/></Link>}{result.guest && <a className={returnTo?'secondary-button':'primary-button'} href={'/signin-with-chatgpt?return_to=' + encodeURIComponent('/learn/' + lesson.id+(returnTo?'?return_to='+encodeURIComponent(returnTo):''))} target="_top">تسجيل الدخول</a>}</div></div>}</form>}</TabsContent></Tabs></div>;
}
