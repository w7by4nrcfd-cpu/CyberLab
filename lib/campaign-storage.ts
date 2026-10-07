import {database} from './storage';
import {readMissions,readBossLocks} from './mission-storage';
import {readSkills} from './skill-storage';
import {campaignById,campaignMissionPath,type Campaign} from './campaigns';
import {allMissions} from './missions';

export async function readCampaign(userId:string,id:string){
 const campaign=campaignById(id);if(!campaign)throw Error('حملة غير موجودة.');
 const [states,flags,locks]=await Promise.all([
  readMissions(userId),
  database().prepare('SELECT flag_id AS id FROM campaign_flags WHERE user_id=? AND campaign_id=?').bind(userId,id).all<{id:string}>(),
  readBossLocks(userId)
 ]);
 const completed=new Set(states.filter(s=>!!s.completedAt).map(s=>s.id));
 const knownFlags=new Set(flags.results.map(f=>f.id));
 let previousComplete=true;
 const chapters=campaign.chapters.map(chapter=>{
  const done=chapter.missionIds.filter(mid=>completed.has(mid));
  const unlocked=previousComplete;
  const complete=done.length===chapter.missionIds.length;
  const objectives=chapter.missionIds.map(mid=>{
   const mission=allMissions.find(m=>m.id===mid)!;
   const reasons=locks.find(l=>l.id===mid)?.reasons||[];
   return {id:mid,title:mission.title,kind:mission.kind||'mission',url:campaignMissionPath(mid)+'?campaign='+campaign.id,completed:completed.has(mid),started:states.some(s=>s.id===mid),reasons};
  });
  previousComplete=complete;
  return {...chapter,unlocked,complete,completedCount:done.length,objectives,briefed:knownFlags.has('brief:'+chapter.id),debriefed:knownFlags.has('debrief:'+chapter.id)};
 });
 const current=chapters.find(c=>!c.complete)||chapters.at(-1)!;
 const total=chapters.reduce((sum,c)=>sum+c.objectives.length,0),done=chapters.reduce((sum,c)=>sum+c.completedCount,0);
 const unlockedChapters=new Set(chapters.filter(c=>c.unlocked).map(c=>c.id));
 const timeline=campaign.events.filter(e=>unlockedChapters.has(e.chapterId)&&(!e.afterMission||completed.has(e.afterMission)));
 const evidence=campaign.evidence.filter(e=>unlockedChapters.has(e.chapterId)&&completed.has(e.sourceMission)).map(e=>({...e,read:knownFlags.has('evidence:'+e.id)}));
 const active=chapters.find(c=>c.unlocked&&!c.complete)?.objectives.find(o=>!o.completed)||null;
 let summary=null;
 if(done===total){
  const skills=(await readSkills(userId)).filter(s=>s.xp>0).sort((a,b)=>b.xp-a.xp);
  const relevant=new Set(campaign.chapters.flatMap(c=>c.missionIds).flatMap(mid=>allMissions.find(m=>m.id===mid)?.skillRewards.map(r=>r.skill)||[]));
  const weaker=(await import('./skill-catalog')).skillCatalog.filter(s=>relevant.has(s.id)).sort((a,b)=>(skills.find(x=>x.id===a.id)?.xp||0)-(skills.find(x=>x.id===b.id)?.xp||0)).slice(0,2);
  summary={casesSolved:done,bossMissionsCompleted:chapters.flatMap(c=>c.objectives).filter(o=>o.kind==='boss'&&o.completed).length,evidenceDiscovered:evidence.length,skillsDemonstrated:skills.filter(s=>relevant.has(s.id)).map(s=>s.name),strongestSkills:skills.slice(0,3).map(s=>({name:s.name,level:s.level,xp:s.xp})),skillsNeedingPractice:weaker.map(s=>s.name)};
 }
 return {campaign:{id:campaign.id,title:campaign.title,description:campaign.description,company:campaign.company,prerequisites:campaign.prerequisites,people:campaign.people},chapters,currentChapterId:current.id,completedChapters:chapters.filter(c=>c.complete).length,completed:done===total,progress:Math.round(done/total*100),timeline,evidence,activeObjective:active,latestEvent:timeline.at(-1)||null,summary};
}

export async function recordCampaignFlag(userId:string,id:string,flagId:string){
 const campaign=campaignById(id);if(!campaign)throw Error('حملة غير موجودة.');
 const state=await readCampaign(userId,id);
 const allowed=state.chapters.some(c=>c.unlocked&&(
  flagId==='brief:'+c.id||c.complete&&flagId==='debrief:'+c.id
 ))||state.evidence.some(e=>flagId==='evidence:'+e.id);
 if(!allowed)throw Error('هذا الجزء من الحملة لم يُفتح بعد.');
 await database().prepare('INSERT OR IGNORE INTO campaign_flags(user_id,campaign_id,flag_id,created_at) VALUES(?,?,?,?)').bind(userId,id,flagId,new Date().toISOString()).run();
 return readCampaign(userId,id);
}
