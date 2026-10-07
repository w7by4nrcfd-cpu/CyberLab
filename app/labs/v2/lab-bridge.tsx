import {labForAlert,labForLesson,labForMission} from '@/lib/interactive-labs';
export default function LabBridge({lessonId,missionId,alertId,returnTo:context}:{lessonId?:string;missionId?:string;alertId?:string;returnTo?:string|null}){
 const labs=lessonId?labForLesson(lessonId):missionId?labForMission(missionId):alertId?labForAlert(alertId):[];
 if(!labs.length)return null;
 const returnTo=context||(lessonId?'/learn/'+lessonId:missionId?(missionId.startsWith('boss-')?'/bosses/':'/missions/')+missionId:'/soc/alerts/'+alertId);
 return <section className="panel il-bridge"><span className="eyebrow">PRACTICE BRIDGE</span><h2>تدريب عملي مرتبط</h2><p>درّب مهارات التحقيق هنا، ثم عد لإكمال النشاط الحالي. تُحفظ محاولات المختبر في حسابك.</p><div>{labs.map(l=><a href={'/labs/v2/'+l.id+'?return_to='+encodeURIComponent(returnTo)} key={l.id}><strong>{l.title}</strong><span>{l.difficulty} · {l.objective}</span><b>ابدأ ←</b></a>)}</div></section>;
}
