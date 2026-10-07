import Link from '@/components/native-link';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import type { labs } from '@/lib/curriculum';
import { tracks } from '@/lib/curriculum';
import { labTracks } from '@/lib/navigation';
import LabView from './view';
import Challenge from './challenge';

export default function LabLauncher({lab,trackId,started=false}:{lab:(typeof labs)[number];trackId?:string;started?:boolean}) {
  const source = trackId && labTracks[lab.id]?.includes(trackId) && tracks.some(t => t.id === trackId) ? trackId : undefined;
  const backHref = source ? `/tracks/${encodeURIComponent(source)}` : '/labs';
  const backLabel = source ? 'العودة إلى المسار' : 'العودة إلى المختبرات';
  if (started) return ['caesar','firewall','phishing'].includes(lab.id)
    ? <LabView lab={lab} backHref={backHref} backLabel={backLabel}/>
    : <Challenge id={lab.id} backHref={backHref} backLabel={backLabel}/>;
  const launchHref = `/labs/${encodeURIComponent(lab.id)}?${source ? `track=${encodeURIComponent(source)}&` : ''}start=1`;
  return <div className="reading-width"><Link className="back-link" href={backHref}><ArrowRight size={17}/>{backLabel}</Link>
    <div className="page-heading"><div><div className="eyebrow">{lab.tag} / SAFE CHALLENGE</div><h1>{lab.title}</h1><p>{lab.description}</p></div></div>
    <div className="safe-banner"><ShieldCheck size={20}/><p>مهمة تعليمية محلية على بيانات اصطناعية؛ لا اتصال بأجهزة أو خدمات حقيقية.</p></div>
    <section className="panel lab-panel"><h2>المهمة جاهزة</h2><p>المدة المتوقعة: {lab.minutes} دقائق. اختر إجابتك داخل المحاكاة ثم تحقق منها؛ تُحفظ النتيجة في حسابك عند تسجيل الدخول.</p>
      <a href={launchHref} className="primary-button">بدء التحدي <ArrowLeft size={18}/></a></section>
  </div>;
}
