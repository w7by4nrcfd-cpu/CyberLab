import type {PublicLesson} from './curriculum';

export const atlasStations=[
 {id:'network',title:'أساسيات الشبكات',image:'/images/atlas-network.webp',description:'افهم العنوان والبوابة وحل الأسماء.'},
 {id:'linux',title:'طرفية Linux',image:'/images/atlas-terminal.webp',description:'اقرأ الملفات والعمليات والصلاحيات.'},
 {id:'soc',title:'تحليل السجلات',image:'/images/atlas-logs.webp',description:'اربط الأحداث قبل إصدار الحكم.'}
] as const;

// A view of existing learning records. It does not unlock or award anything.
export function atlasProgress(lessons:PublicLesson[],done:Set<string>,activity:{id:string;lastAt?:string;completedAt:string|null}[]){
 const stations=atlasStations.map(station=>{
  const group=lessons.filter(lesson=>lesson.track===station.id),completed=group.filter(lesson=>done.has(lesson.id)).length;
  const ongoing=activity.filter(a=>!a.completedAt&&!done.has(a.id)&&group.some(l=>l.id===a.id)).sort((a,b)=>(b.lastAt||'').localeCompare(a.lastAt||''))[0];
  return {...station,total:group.length,completed,ongoing:ongoing?.id,ongoingAt:ongoing?.lastAt||'',next:ongoing?.id||group.find(l=>!done.has(l.id))?.id};
 });
 const active=stations.filter(s=>s.ongoing).sort((a,b)=>b.ongoingAt.localeCompare(a.ongoingAt))[0]?.id||stations.find(s=>s.completed>0&&s.completed<s.total)?.id||stations.find(s=>s.completed<s.total)?.id;
 return stations.map(station=>({...station,active:station.id===active,state:station.total>0&&station.completed===station.total?'مكتمل':station.id===active?'اتجاهك الحالي':station.completed?'قيد التقدم':'متاح للاستكشاف'}));
}
