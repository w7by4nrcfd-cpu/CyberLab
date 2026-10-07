import {Clock3,Target,Signal} from 'lucide-react';

export default function ActivityBrief({skill,time,level='مناسب للمبتدئين'}:{skill:string;time:string;level?:string}){
 return <dl className="activity-brief" aria-label="قبل أن تبدأ">
  <div><Target size={18} aria-hidden="true"/><dt>المهارة المستهدفة</dt><dd>{skill}</dd></div>
  <div><Clock3 size={18} aria-hidden="true"/><dt>الوقت التقديري</dt><dd><bdi dir="ltr">{time}</bdi></dd></div>
  <div><Signal size={18} aria-hidden="true"/><dt>المستوى</dt><dd>{level}</dd></div>
 </dl>;
}
