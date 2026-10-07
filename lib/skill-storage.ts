import {database} from './storage';
import {lessons} from './curriculum';
import {allMissions} from './missions';
import {lessonSkillRewards,missionSkillRewards,skillCatalog,skillLevel,skillProgress} from './skills';
import {socAlertById} from './soc-alerts';
import {interactiveLabById} from './interactive-labs';

type SourceKind='lesson'|'mission'|'boss'|'soc'|'lab';
export function skillAwardStatements(db:ReturnType<typeof database>,userId:string,kind:SourceKind,id:string,at:string,existing?:Set<string>){
 const rewards=kind==='lesson'?lessonSkillRewards(id):kind==='soc'?socAlertById(id)?.skillRewards||[]:kind==='lab'?interactiveLabById(id)?.skillRewards||[]:missionSkillRewards(id);
 return rewards.filter(r=>{const key=kind+':'+id+':'+r.skill;if(existing?.has(key))return false;existing?.add(key);return true}).flatMap(r=>[
  db.prepare('INSERT OR IGNORE INTO skill_awards(user_id,source_kind,source_id,skill_id,xp,created_at) VALUES(?,?,?,?,?,?)').bind(userId,kind,id,r.skill,r.points,at),
  db.prepare('INSERT INTO skill_progress(user_id,skill_id,xp,level,progress,updated_at) SELECT user_id,skill_id,SUM(xp),CAST(SUM(xp)/200 AS INTEGER)+1,CAST((SUM(xp)%200)/2 AS INTEGER),MAX(created_at) FROM skill_awards WHERE user_id=? AND skill_id=? GROUP BY user_id,skill_id ON CONFLICT(user_id,skill_id) DO UPDATE SET xp=excluded.xp,level=excluded.level,progress=excluded.progress,updated_at=excluded.updated_at').bind(userId,r.skill)
 ]);
}
// Existing lesson and mission completions remain the source of truth. Reconciliation is
// additive and idempotent, including for accounts created before the skill table.
export async function reconcileSkills(userId:string){
 const db=database();
 const [quizzes,reading,missionRows,existingRows]=await Promise.all([
  db.prepare("SELECT item_id AS id,completed_at AS at FROM progress WHERE user_id=? AND kind='quiz'").bind(userId).all<{id:string;at:string}>(),
  db.prepare('SELECT lesson_id AS id,completed_at AS at FROM activity WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<{id:string;at:string}>(),
  db.prepare('SELECT mission_id AS id,completed_at AS at FROM mission_progress WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<{id:string;at:string}>(),
  db.prepare('SELECT source_kind AS kind,source_id AS id,skill_id AS skillId FROM skill_awards WHERE user_id=?').bind(userId).all<{kind:SourceKind;id:string;skillId:string}>()
 ]);
 const existing=new Set(existingRows.results.map(r=>r.kind+':'+r.id+':'+r.skillId));
 const completed=new Map<string,string>();
 for(const row of [...quizzes.results,...reading.results])if(!completed.has(row.id)||row.at<completed.get(row.id)!)completed.set(row.id,row.at);
 const statements=[...completed].flatMap(([id,at])=>skillAwardStatements(db,userId,'lesson',id,at,existing));
 for(const row of missionRows.results)statements.push(...skillAwardStatements(db,userId,row.id.startsWith('boss-')?'boss':'mission',row.id,row.at,existing));
 for(let i=0;i<statements.length;i+=50)await db.batch(statements.slice(i,i+50));
}
export async function readSkills(userId:string){
 await reconcileSkills(userId);
 const [result,totals]=await Promise.all([
  database().prepare('SELECT source_kind AS kind,source_id AS id,skill_id AS skillId,xp,created_at AS at FROM skill_awards WHERE user_id=? ORDER BY created_at DESC').bind(userId).all<{kind:SourceKind;id:string;skillId:string;xp:number;at:string}>(),
  database().prepare('SELECT skill_id AS id,xp,level,progress,updated_at AS updatedAt FROM skill_progress WHERE user_id=?').bind(userId).all<{id:string;xp:number;level:number;progress:number;updatedAt:string}>()
 ]);
 return skillCatalog.map(skill=>{
  const awards=result.results.filter(a=>a.skillId===skill.id);
  const persisted=totals.results.find(s=>s.id===skill.id),xp=persisted?.xp||0;
  return {...skill,xp,level:persisted?.level||skillLevel(xp),progress:persisted?.progress||skillProgress(xp),lastUpdated:persisted?.updatedAt||null,
   contributions:awards.map(a=>({kind:a.kind,id:a.id,title:a.kind==='lesson'?lessons.find(l=>l.id===a.id)?.title||a.id:a.kind==='soc'?socAlertById(a.id)?.title||a.id:a.kind==='lab'?interactiveLabById(a.id)?.title||a.id:allMissions.find(m=>m.id===a.id)?.title||a.id,xp:a.xp,at:a.at}))};
 });
}
