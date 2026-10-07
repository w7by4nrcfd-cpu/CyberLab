/* eslint-disable @next/next/no-img-element */
import {CheckCircle2} from 'lucide-react';
import type {PublicLesson} from '@/lib/curriculum';
import {atlasProgress} from '@/lib/learning-atlas';
import {completedIds} from '@/lib/metrics';
import {useProgress} from '@/app/shell';

export default function LearningAtlas({lessons,heading=true}:{lessons:PublicLesson[];heading?:boolean}){
 const {items,learning,loading,error}=useProgress();
 const stations=atlasProgress(lessons,completedIds(items,learning),learning.activity);
 return <section className="learning-atlas" aria-label="اتجاهات تعلمك">
  {heading&&<header className="atlas-heading"><span className="eyebrow">CYBERLAB · تعلّم بالممارسة</span><h1>ابنِ مهارتك، خطوة بخطوة</h1><p>من فهم الشبكة والنظام إلى تحليل الحوادث.</p></header>}
  <ol className="atlas-stations" aria-busy={loading}>{stations.map(station=><li key={station.id} className={!loading&&station.active?'is-current':''}>
   <a href={'/tracks/'+station.id} className="atlas-station-link" aria-label={station.title+' · '+(loading?'جار تحميل التقدم':station.state+' · '+station.completed+' من '+station.total+' درسًا')}>
    <img src={station.image} alt="" width={400} height={300} fetchPriority={station.active?'high':'auto'}/>
    <span className="atlas-status" aria-hidden="true">{station.state==='مكتمل'?<CheckCircle2 size={28}/>:<span/>}</span>
    <h2>{station.title}</h2><span className="atlas-state">{loading?'جار تحميل التقدم':station.state}</span><span className="atlas-count">{loading?'—':station.completed+' من '+station.total+' درسًا'}</span>
   </a>
  </li>)}</ol>
  {error&&<p role="status" className="atlas-caption">تعذر تحديث التقدم. {error}</p>}
  <p className="atlas-caption">إنجاز الدروس هنا مستقل عن نتائج المختبرات. يمكنك فتح أي اتجاه حسب المهمة التي تعمل عليها.</p>
 </section>;
}
