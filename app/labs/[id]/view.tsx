'use client';
import { useState } from 'react';
import Link from '@/components/native-link';
import { ArrowRight, ShieldCheck, Play, LockKeyhole, Mail, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { caesar } from '@/lib/simulations';
import { useProgress } from '@/app/shell';
type Lab = {
    id: string;
    title: string;
    tag: string;
    description: string;
    minutes: number;
    color: string;
};
export default function LabView({ lab, backHref='/labs', backLabel='المختبرات' }: {
    lab: Lab;
    backHref?: string;
    backLabel?: string;
}) {
    const [text, setText] = useState('HELLO');
    const [shift, setShift] = useState(3);
    const [answer, setAnswer] = useState('');
    const [ports, setPorts] = useState<number[]>([]);
    const [ran, setRan] = useState(false);
    const [action, setAction] = useState('');
    const [clue, setClue] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{
        passed: boolean;
        message: string;
        guest: boolean;
    } | null>(null);
    const [error, setError] = useState('');
    const { refresh } = useProgress();
    async function submit() { setBusy(true); setError(''); setResult(null); try {
        const r = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'lab', id: lab.id, input: lab.id === 'caesar' ? { answer } : lab.id === 'firewall' ? { ports } : { action, clue } }) });
        const d = await r.json() as {
            passed: boolean;
            message: string;
            guest: boolean;
            error?: string;
        };
        if (!r.ok)
            throw Error(d.error);
        setResult(d);
        await refresh();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'تعذر الحفظ.');
    }
    finally {
        setBusy(false);
    } }
    return <div className="reading-width"><Link className="back-link" href={backHref}><ArrowRight size={17}/>{backLabel}</Link><div className="page-heading"><div><div className="eyebrow">{lab.tag} / LAB</div><h1>{lab.title}</h1><p>{lab.description}</p></div></div><div className="safe-banner"><ShieldCheck size={20}/><span>محاكاة محلية · لا اتصالات بأنظمة حقيقية · +75 XP عند الإنجاز</span></div>
 {lab.id === 'caesar' && <><section className="panel lab-panel"><h2><LockKeyhole /> جرّب إزاحة الحروف</h2><p>تتحرك الحروف الإنجليزية بعدد خطوات المفتاح. تعود Z إلى A؛ وتبقى المسافات والأرقام والعربية كما هي.</p><label htmlFor="plain">نص التجربة (حروف إنجليزية)</label><input id="plain" value={text} maxLength={100} onChange={e => setText(e.target.value)} dir="ltr"/><div className="between"><label id="shift-label">مفتاح الإزاحة</label><b className="key-value">{shift}</b></div><Slider aria-labelledby="shift-label" value={[shift]} onValueChange={v => setShift(v[0])} min={0} max={25} step={1} dir="ltr"/><div className="cipher-result"><span>النص المشفر</span><output dir="ltr">{caesar(text, shift) || '—'}</output></div><p className="muted">هذا تشفير تاريخي ضعيف للتوضيح فقط؛ لا تستخدمه لحماية أسرار.</p></section><section className="panel challenge"><span className="eyebrow">التحدي</span><h2>ما الرسالة الأصلية؟</h2><p>النص <b dir="ltr">KHOOR</b> شُفّر بإزاحة 3. يمكنك إدخاله أعلاه وتجربة الإزاحة 23 لعكس العملية، ثم كتابة النص الأصلي.</p><label htmlFor="answer">إجابتك</label><input id="answer" value={answer} onChange={e => { setAnswer(e.target.value); setResult(null); }} maxLength={100} placeholder="اكتب النص الأصلي" dir="ltr"/></section></>}
 {lab.id === 'firewall' && <section className="panel lab-panel"><span className="eyebrow">مهمتك: السماح بالويب المشفر فقط</span><h2>اصنع سياسة السماح</h2><p>يمنع هذا الجدار كل المنافذ افتراضيًا. فعّل ما تحتاج إليه للسماح بـ HTTPS، مع بقاء HTTP وTelnet محجوبين.</p><div className="port-options">{[{ port: 443, name: 'HTTPS', desc: 'اتصال ويب مشفر' }, { port: 80, name: 'HTTP', desc: 'اتصال ويب غير مشفر' }, { port: 23, name: 'Telnet', desc: 'دخول طرفي غير مشفر' }].map(p => <label key={p.port} className="answer-option"><Checkbox checked={ports.includes(p.port)} onCheckedChange={v => { setPorts(a => v ? [...a, p.port] : a.filter(x => x !== p.port)); setRan(false); setResult(null); }}/><b dir="ltr">{p.name} · {p.port}</b><span>{p.desc}</span></label>)}</div><button className="secondary-button" onClick={() => setRan(true)}><Play size={17}/>تشغيل الحزم الوهمية</button>{ran && <div className="packet-results" aria-live="polite">{[443, 80, 23].map(p => <div key={p} className="between"><code dir="ltr">192.0.2.10 → TCP {p}</code><span className={ports.includes(p) ? 'success' : 'wrong'}>{ports.includes(p) ? 'مسموح' : 'محجوب'}</span></div>)}</div>}<p className="muted">العناوين توضيحية فقط. لا ينشئ هذا المختبر اتصال شبكة.</p></section>}
 {lab.id === 'phishing' && <><section className="mail-example"><div className="between"><span><Mail size={20}/> رسالة وهمية للتدريب</span><span className="tiny-badge">INBOX / 01</span></div><p dir="ltr">From: support@account-check.example</p><h2>عاجل: سيتم إيقاف حسابك خلال ساعة!</h2><p>مرحبًا، نحن فريق الدعم. لحماية حسابك، أرسل لنا رمز التحقق الذي وصلك الآن. لا تتأخر حتى لا تفقد ملفاتك.</p><div className="mail-stamp">نموذج تدريبي · لا روابط قابلة للفتح</div></section><section className="panel"><h3>١. ما الإشارة الحاسمة على الخطر؟</h3><RadioGroup value={clue} onValueChange={v => { setClue(v); setResult(null); }} dir="rtl">{[['code', 'طلب إرسال رمز التحقق'], ['greeting', 'تبدأ الرسالة بكلمة مرحبًا'], ['short', 'الرسالة قصيرة']].map(([v, l]) => <label className="answer-option" key={v}><RadioGroupItem value={v}/>{l}</label>)}</RadioGroup><h3 className="space-top">٢. ماذا تفعل؟</h3><RadioGroup value={action} onValueChange={v => { setAction(v); setResult(null); }} dir="rtl">{[['reply', 'أرسل الرمز بسرعة'], ['verify', 'أفتح التطبيق الرسمي وأتحقق بقناة مستقلة'], ['forward', 'أطلب من صديق إرسال رمزه للتجربة']].map(([v, l]) => <label className="answer-option" key={v}><RadioGroupItem value={v}/>{l}</label>)}</RadioGroup></section></>}
 {error && <p className="error" role="alert">{error}</p>}<button className="primary-button" disabled={busy || (lab.id === 'caesar' && !answer.trim()) || (lab.id === 'phishing' && (!action || !clue)) || (lab.id === 'firewall' && !ran)} onClick={() => void submit()}>{busy ? 'جارٍ التحقق…' : 'تحقق من الحل واحفظ الإنجاز'}<ArrowLeft size={18}/></button>{result && <section className={'result-panel ' + (result.passed ? 'success-result' : '')} aria-live="polite">{result.passed ? <CheckCircle2 /> : <XCircle />}<h2>{result.passed ? 'أنجزت التحدي!' : 'حاول مرة أخرى'}</h2><p>{result.message}</p><p>{result.guest ? 'المحاولة تجريبية. سجّل الدخول ثم أعد الحل لحفظ الإنجاز.' : result.passed ? 'حُفظ الإنجاز. تُحتسب 75 نقطة مرة واحدة لهذا المختبر.' : 'غيّر اختياراتك ثم أعد المحاولة.'}</p>{result.guest && <a className="secondary-button" href={'/signin-with-chatgpt?return_to=' + encodeURIComponent('/labs/' + lab.id)} target="_top">تسجيل الدخول</a>}<Link className="secondary-button" href={backHref}>{backLabel} ←</Link></section>}</div>;
}
