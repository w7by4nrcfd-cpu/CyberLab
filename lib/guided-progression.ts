import {lessons,tracks,type Lesson} from './curriculum';
import {isCyberLesson,contentScope,cyberDirections,directionLessons,type CyberDirection} from './content-scope';

// Reading suggestions only. Actual mission/lab unlock rules are unchanged.
export const foundationTracks=['security','network','linux','windows','it','web','crypto'] as const;
export function guidedLesson(done:Set<string>,activity:{id:string;completedAt:string|null}[]=[]){
 const byId=new Map(lessons.filter(l=>isCyberLesson(l.id)).map(lesson=>[lesson.id,lesson]));
 const ongoing=activity.find(a=>!a.completedAt&&!done.has(a.id)&&byId.has(a.id));
 if(ongoing)return {lesson:byId.get(ongoing.id)!,continuing:true};
 const core=foundationTracks.flatMap(track=>lessons.filter(lesson=>lesson.track===track&&isCyberLesson(lesson.id)));
 return {lesson:core.find(lesson=>!done.has(lesson.id))||lessons.find(lesson=>isCyberLesson(lesson.id)&&!done.has(lesson.id))||core[0],continuing:false};
}
export function foundationStage(done:Set<string>,trackId:string){
 const all=lessons.filter(l=>l.track===trackId&&isCyberLesson(l.id)),completed=all.filter(l=>done.has(l.id)).length;
 return {id:trackId,title:trackId==='it'?'معرفة النظام للدفاع والتحقيق':tracks.find(t=>t.id===trackId)?.name||trackId,completed,total:all.length,
  next:all.find(l=>!done.has(l.id)) as Lesson|undefined,
  state:completed===all.length?'مكتمل':completed?'قيد التقدم':'متاح'};
}
export function cyberStage(done:Set<string>,lessonId:string){
 const id:CyberDirection=contentScope[lessonId]?.direction||'foundations',all=directionLessons(id),completed=all.filter(l=>done.has(l.id)).length;
 return {id,title:cyberDirections.find(d=>d.id===id)!.title,completed,total:all.length};
}
