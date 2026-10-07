import type {Item,Learning} from '@/app/shell';
import type {ProgressionData} from './progression';

// Presentation only: never awards XP or creates a second completion record.
export function progressEvidence(items:Item[],learning:Learning,data:ProgressionData,lessonIds:ReadonlySet<string>){
 // Quiz completion also marks activity.completedAt, so use recorded reading time,
 // not that flag, as evidence that the learner actually opened/read a lesson.
 const read=new Set(learning.activity.filter(a=>a.seconds>0&&lessonIds.has(a.id)).map(a=>a.id));
 const assessed=new Set(items.filter(i=>i.kind==='quiz'&&lessonIds.has(i.id)).map(i=>i.id));
 const count=(id:string)=>data.achievements.find(a=>a.id===id)?.value||0;
 const established=data.mastery.filter(s=>s.samples>=2&&s.mastery!==null);
 const strong=established.filter(s=>s.band==='Proficient'||s.band==='Strong');
 const review=established.filter(s=>s.band==='Developing').sort((a,b)=>a.mastery!-b.mastery!);
 const emerging=data.mastery.filter(s=>s.samples<2&&(s.samples>0||s.xp>0));
 return {read:read.size,assessed:assessed.size,labs:count('labs'),missions:count('first-mission'),strong,review,emerging};
}
