'use client';
import Link from '@/components/native-link';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { lessons, tracks } from '@/lib/curriculum';
import {isCyberLesson,cyberTrackLabels} from '@/lib/content-scope';
import { trackHref } from '@/lib/navigation';
import { completedIds } from '@/lib/metrics';
import { useProgress } from '@/app/shell';
import type { paths } from '@/lib/paths';

export default function PathDetail({path}:{path:(typeof paths)[number]}) {
  const {items,learning,loading,error,user} = useProgress();
  if (loading || error) return <div className="reading-width"><Link className="back-link" href="/roadmap"><ArrowRight size={17}/>خارطة التعلم</Link><h1>{path.name}</h1><p role={error ? 'alert' : 'status'}>{error ? 'تعذر تحميل تقدمك. أعد تحميل الصفحة أو حاول لاحقًا.' : 'جارٍ تحميل تقدمك المحفوظ…'}</p></div>;
  const done = completedIds(items,learning);
  const entries = path.tracks.map(id => ({track:tracks.find(t => t.id === id)!, all:lessons.filter(l => l.track === id&&isCyberLesson(l.id))}));
  const total = entries.reduce((n,e) => n + e.all.length,0);
  const count = entries.reduce((n,e) => n + e.all.filter(l => done.has(l.id)).length,0);
  return <div className="reading-width"><Link className="back-link" href="/roadmap"><ArrowRight size={17}/>خارطة التعلم</Link>
    <div className="page-heading"><div><div className="eyebrow">LEARNING PATH</div><h1>{path.name}</h1><p>معرفة سيبرانية من الرحلة المحفوظة. القضايا داخل NexaCorp هي تجربة البداية.</p></div></div>
    {!user && <div className="safe-banner" role="status"><p>أنت تتصفح كزائر. لن يُحفظ تقدم الرحلة حتى تسجّل الدخول. <a href={'/signin-with-chatgpt?return_to='+encodeURIComponent('/paths/'+path.id)} target="_top">سجّل الدخول لحفظ تقدمك ←</a></p></div>}
    <section className="panel"><strong>{count} من {total} مرجعًا سيبرانيًا · {Math.round(count / total * 100)}%</strong><Progress value={count / total * 100} aria-label={'تقدم '+path.name}/></section>
    <p className="scope-context">تقدم المعرفة الإضافية محفوظ في <Link href="/learn#additional-knowledge">مكتبة المراجع الإضافية</Link>، ولا يدخل عداد هذه الرحلة السيبرانية.</p><div className="lesson-list">{entries.map(({track,all},i) => <a href={trackHref(track.id)} className="lesson-row" key={track.id}><span className="lesson-number">{all.every(l => done.has(l.id)) ? <CheckCircle2 size={20}/> : String(i+1).padStart(2,'0')}</span><div><h2>{cyberTrackLabels[track.id]||track.name}</h2><p>مراجع تخدم الفحص والحماية والتحقيق</p><small>{all.filter(l => done.has(l.id)).length} من {all.length} درسًا</small></div><ArrowLeft size={20}/></a>)}</div>
  </div>;
}
