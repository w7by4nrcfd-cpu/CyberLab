'use client';
import {Bookmark,CheckCircle2} from 'lucide-react';
import {cyberDirections,cyberUnits,contentScope,isCyberLesson,scopeForLesson,scopeLabels} from '@/lib/content-scope';
import type {PublicLesson} from '@/lib/curriculum';

// A view of the existing lesson IDs, not a new curriculum or progress source.
export default function CyberLibrary({lessons,done,bookmarks=[],expanded=false}:{lessons:PublicLesson[];done:Set<string>;bookmarks?:string[];expanded?:boolean}){
 return <div className="scope-directions">{cyberDirections.map(direction=>{
  const all=lessons.filter(l=>isCyberLesson(l.id)&&contentScope[l.id].direction===direction.id);if(!all.length)return null;
  return <details className="scope-direction" key={direction.id} open={expanded}>
   <summary><div><h2>{direction.title}</h2><span dir="ltr">{direction.en}</span></div><span className="scope-disclosure">عرض المعرفة المرتبطة</span></summary>
   <p className="scope-context">{direction.description}</p>{direction.id==='offensive'&&<p className="scope-context"><a href="/practice/offensive">طبّق المعرفة في أساسيات التقييم الهجومي</a></p>}<p className="scope-context">مكتبتك: {all.length} مرجعًا متاحًا · أنجزت {all.filter(l=>done.has(l.id)).length} منها</p>
   {cyberUnits[direction.id].map(unit=>{const group=all.filter(l=>contentScope[l.id].unit===unit.id);if(!group.length)return null;return <details className="scope-unit" key={unit.id} open={expanded}><summary><h3>{unit.title}</h3><span>{group.filter(l=>done.has(l.id)).length} من {group.length}</span></summary><p>{unit.context}</p>
    <div className="lesson-list">{group.map(l=><a href={'/learn/'+l.id} className="lesson-row" key={l.id}><span className="lesson-number">{done.has(l.id)?<CheckCircle2 size={19}/>:l.level||1}</span><div><h3>{l.title}{bookmarks.includes(l.id)&&<Bookmark size={14}/>}</h3><p>{scopeLabels[scopeForLesson(l.id)]} · المستوى {l.level||1}</p></div><span className="lesson-meta">{l.minutes} دقائق</span></a>)}</div>
   </details>})}
  </details>;
 })}</div>;
}
