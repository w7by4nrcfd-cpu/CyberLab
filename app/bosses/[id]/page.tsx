import {notFound} from 'next/navigation';
import {bossMissions} from '@/lib/boss-missions';
import BossWorkspace from './workspace';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readBossLocks,readMissions} from '@/lib/mission-storage';
import {lessons} from '@/lib/curriculum';
import {allMissions} from '@/lib/missions';
export default async function BossPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{campaign?:string}>}){
 const {id}=await params,boss=bossMissions.find(m=>m.id===id);if(!boss)notFound();
 const user=await getChatGPTUser();
 const [locks,states]=user?await Promise.all([readBossLocks(user.userId),readMissions(user.userId)]):[[],[]];
 const reasons=user?(locks.find(l=>l.id===id)?.reasons||[]):[
  ...(boss.unlock?.lessons||[]).map(key=>'أكمل درس '+(lessons.find(item=>item.id===key)?.title||key)),
  ...(boss.unlock?.missions||[]).map(key=>'أكمل مهمة '+(allMissions.find(item=>item.id===key)?.title||key)),
  ...(boss.unlock?.skills||[]).filter(skill=>skill.level>1).map(skill=>'ارفع مستوى مهارة '+skill.id+' إلى '+skill.level)
 ];
  if(reasons.length&&!states.some(s=>s.id===id)){
   const lesson=(boss.unlock?.lessons||[]).find(key=>reasons.includes('أكمل درس '+(lessons.find(item=>item.id===key)?.title||key)));
   const mission=(boss.unlock?.missions||[]).find(key=>reasons.includes('أكمل مهمة '+(allMissions.find(item=>item.id===key)?.title||key)));
   const nextHref=lesson?'/learn/'+lesson:mission?mission.startsWith('boss-')?'/bosses/'+mission:'/missions/'+mission:'/skills';
   const total=(boss.unlock?.lessons?.length||0)+(boss.unlock?.missions?.length||0)+(boss.unlock?.skills?.length||0);
   return <div className="reading-width guided-locked"><a href="/bosses">← جميع التحقيقات المتقدمة</a><section className="panel"><span className="eyebrow">مقفل حاليًا · تحقيق متقدم</span><h1>{boss.title}</h1><p>{boss.description}</p><p>{user?total-reasons.length+' من '+total+' متطلبات مكتملة':'سجّل الدخول لحفظ تقدّمك وفتح التحقيق بعد استيفاء المتطلبات.'}</p><h2>ما المتبقي لفتح التحقيق؟</h2><ul>{reasons.map(reason=><li key={reason}>{reason}</li>)}</ul><a className="primary-button" href={nextHref}>اذهب إلى المتطلب التالي ←</a><p>سيُفتح التحقيق تلقائيًا عندما تحقق الشروط المحفوظة في تقدمك.</p></section></div>;
  }
 return <BossWorkspace mission={boss} campaign={(await searchParams).campaign==='first-signal'}/>;
}
