import {database} from './storage';
import {applyMissionAction,freshSession,progressFor,validateMission,type MissionAction,type MissionSession} from './mission-engine';
import {allMissions,type Mission} from './missions';
import {lessons} from './curriculum';
import {skillAwardStatements} from './skill-storage';
type Row={missionId:string;startedAt:string;updatedAt:string;completedAt:string|null;score:number;stars:number;hintsUsed:number;attempts:number;sessionJson:string};
function sessionOf(row:Row):MissionSession{try{return {...freshSession(),...JSON.parse(row.sessionJson) as MissionSession}}catch{return freshSession()}}
function publicState(row:Row){const session=sessionOf(row),mission=validateMission(row.missionId);return {id:row.missionId,startedAt:row.startedAt,updatedAt:row.updatedAt,completedAt:row.completedAt,score:row.score,stars:row.stars,hintsUsed:row.hintsUsed,attempts:row.attempts,session,progress:progressFor(mission,session,!!row.completedAt)}}
export async function readMissions(userId:string){const r=await database().prepare('SELECT mission_id AS missionId,started_at AS startedAt,updated_at AS updatedAt,completed_at AS completedAt,score,stars,hints_used AS hintsUsed,attempts,session_json AS sessionJson FROM mission_progress WHERE user_id=? ORDER BY updated_at DESC').bind(userId).all<Row>();return r.results.filter(row=>allMissions.some(m=>m.id===row.missionId)).map(publicState)}
export async function readBossLocks(userId:string){
 const db=database();const [completedLessons,completedReading,completedMissions,skillRows]=await Promise.all([
  db.prepare("SELECT item_id AS id FROM progress WHERE user_id=? AND kind='quiz'").bind(userId).all<{id:string}>(),
  db.prepare('SELECT lesson_id AS id FROM activity WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<{id:string}>(),
  db.prepare('SELECT mission_id AS id FROM mission_progress WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<{id:string}>(),
  db.prepare('SELECT skill_id AS id,level FROM skill_progress WHERE user_id=?').bind(userId).all<{id:string;level:number}>()
 ]);
 const doneLessons=new Set([...completedLessons.results,...completedReading.results].map(r=>r.id));const doneMissions=new Set(completedMissions.results.map(r=>r.id));
 return allMissions.filter(m=>m.kind==='boss').map(m=>({id:m.id,reasons:[...(m.unlock?.lessons||[]).filter(id=>!doneLessons.has(id)).map(id=>'أكمل درس '+(lessons.find(l=>l.id===id)?.title||id)),...(m.unlock?.missions||[]).filter(id=>!doneMissions.has(id)).map(id=>'أكمل مهمة '+(allMissions.find(item=>item.id===id)?.title||id)),...(m.unlock?.skills||[]).filter(s=>(skillRows.results.find(r=>r.id===s.id)?.level||1)<s.level).map(s=>'ارفع مستوى مهارة '+s.id+' إلى '+s.level)]}));
}
async function getRow(userId:string,id:string){return database().prepare('SELECT mission_id AS missionId,started_at AS startedAt,updated_at AS updatedAt,completed_at AS completedAt,score,stars,hints_used AS hintsUsed,attempts,session_json AS sessionJson FROM mission_progress WHERE user_id=? AND mission_id=?').bind(userId,id).first<Row>()}
export async function writeMission(userId:string,action:MissionAction){
 const mission=validateMission(action.id),db=database(),now=new Date().toISOString();
 if(mission.kind==='boss'&&!(await getRow(userId,mission.id))){const lock=(await readBossLocks(userId)).find(l=>l.id===mission.id);if(lock?.reasons.length)throw Error('المهمة مقفلة: '+lock.reasons.join('، '))}
 await db.prepare('INSERT OR IGNORE INTO mission_progress(user_id,mission_id,started_at,updated_at,session_json) VALUES(?,?,?,?,?)').bind(userId,mission.id,now,now,JSON.stringify(freshSession())).run();
 const row=await getRow(userId,mission.id);if(!row)throw Error('تعذر بدء المهمة.');
 if(row.completedAt&&!sessionOf(row).replaying&&!['replay','start'].includes(action.action))return {state:publicState(row),message:'المهمة مكتملة. اضغط إعادة المهمة للمحاولة مجددًا.'};
 const applied=applyMissionAction(mission,sessionOf(row),action),won=applied.completed;
 const session=applied.session;
 if(won){session.replaying=false;session.lastResult={...won,xpGranted:!row.completedAt,hintsUsed:session.hintsUsed,mistakes:session.mistakes,...(mission.kind==='boss'?{report:{objectives:mission.objectives.map(o=>o.label),evidence:mission.evidence.filter(e=>session.inspected.includes(e.id)).map(e=>e.title),decisions:(mission.decisions||[]).filter(d=>session.decisions.includes(d.id)).map(d=>d.label),mistakes:session.mistakes,hintsUsed:session.hintsUsed,skillsDemonstrated:mission.skillRewards.map(r=>r.skill),skillsNeedingPractice:session.mistakes.length||session.hintsUsed?mission.requiredSkills:[]}}:{})};}
 const totalHints=row.hintsUsed+(action.action==='hint'&&session.hintsUsed>sessionOf(row).hintsUsed?1:0);
 const totalAttempts=row.attempts+(action.action==='solve'?1:0);
 if(won){
  await db.batch([
   db.prepare('UPDATE mission_progress SET updated_at=?,completed_at=COALESCE(completed_at,?),score=MAX(score,?),stars=MAX(stars,?),hints_used=?,attempts=?,session_json=? WHERE user_id=? AND mission_id=?').bind(now,now,won.score,won.stars,totalHints,totalAttempts,JSON.stringify(session),userId,mission.id),
   db.prepare('INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET score=MAX(progress.score,excluded.score),xp=MAX(progress.xp,excluded.xp)').bind(userId,(mission.kind==='boss'?'boss:':'mission:')+mission.id,mission.kind==='boss'?'boss':'mission',won.score,mission.xpReward,now),
   ...skillAwardStatements(db,userId,mission.kind==='boss'?'boss':'mission',mission.id,now)
  ]);
 }else await db.prepare('UPDATE mission_progress SET updated_at=?,hints_used=?,attempts=?,session_json=? WHERE user_id=? AND mission_id=?').bind(now,totalHints,totalAttempts,JSON.stringify(session),userId,mission.id).run();
 const updated=await getRow(userId,mission.id);if(!updated)throw Error('تعذر قراءة المهمة.');
 return {state:publicState(updated),message:applied.message};
}
