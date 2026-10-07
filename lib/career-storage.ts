import {database} from './storage';
import {readAdaptiveLearning} from './adaptive-storage';
import {careerTracks,evaluateCareer,type CareerInput} from './career';

type IdRow={id:string};
type SocRow={id:string;score:number};
type PromotionRow={stageId:string;achievedAt:string;requirementsJson:string};
export async function readCareer(userId:string,now=new Date()){
 const db=database(),track=careerTracks[0];
 const [adaptive,reading,quizzes,labs,missions,soc,history]=await Promise.all([
  readAdaptiveLearning(userId,now),
  db.prepare('SELECT lesson_id AS id FROM activity WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<IdRow>(),
  db.prepare("SELECT item_id AS id FROM progress WHERE user_id=? AND kind='quiz'").bind(userId).all<IdRow>(),
  db.prepare('SELECT lab_id AS id FROM interactive_lab_progress WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<IdRow>(),
  db.prepare('SELECT mission_id AS id FROM mission_progress WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<IdRow>(),
  db.prepare('SELECT alert_id AS id,best_score AS score FROM soc_investigations WHERE user_id=? AND closed_at IS NOT NULL').bind(userId).all<SocRow>(),
  db.prepare('SELECT stage_id AS stageId,achieved_at AS achievedAt,requirements_json AS requirementsJson FROM career_promotions WHERE user_id=? AND track_id=? ORDER BY achieved_at,stage_id').bind(userId,track.id).all<PromotionRow>()
 ]);
 const input:CareerInput={lessons:[...new Set([...reading.results,...quizzes.results].map(r=>r.id))],labs:labs.results.map(r=>r.id),missions:missions.results.map(r=>r.id),soc:soc.results,mastery:adaptive.mastery,recommendations:adaptive.recommendations};
 const reached=Math.max(0,...history.results.map(p=>track.stages.findIndex(s=>s.id===p.stageId)));
 const state=evaluateCareer(input,track,reached);
 const known=new Set(history.results.map(r=>r.stageId));
 const missing=state.stages.slice(0,state.currentIndex+1).filter(s=>!known.has(s.id));
 if(missing.length){const at=now.toISOString();await db.batch(missing.map(stage=>db.prepare('INSERT OR IGNORE INTO career_promotions(user_id,track_id,stage_id,achieved_at,requirements_json) VALUES(?,?,?,?,?)').bind(userId,track.id,stage.id,at,JSON.stringify(stage.requirementsState.map(({kind,id,minimum,current,done})=>({kind,id,minimum,current,done}))))));}
 const promotions=missing.length?(await db.prepare('SELECT stage_id AS stageId,achieved_at AS achievedAt,requirements_json AS requirementsJson FROM career_promotions WHERE user_id=? AND track_id=? ORDER BY achieved_at,stage_id').bind(userId,track.id).all<PromotionRow>()).results:history.results;
 return {...state,promotions:promotions.map(p=>({stageId:p.stageId,achievedAt:p.achievedAt,requirements:JSON.parse(p.requirementsJson) as unknown})),newlyUnlocked:missing.filter(s=>s.id!=='beginner').map(s=>s.id)};
}
