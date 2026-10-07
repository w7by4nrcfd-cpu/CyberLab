import {lessons} from './curriculum';
import {database} from './storage';
import {skillAwardStatements} from './skill-storage';
import {interactiveLabs,interactiveLabById} from './interactive-labs';
import {applyLabAction,newLabSession,progressOf,type LabAction,type LabSession} from './interactive-lab-engine';
type Row={startedAt:string;updatedAt:string;completedAt:string|null;bestScore:number;attempts:number;hintsUsed:number;sessionJson:string};
const now=()=>new Date().toISOString();
async function row(userId:string,id:string){return database().prepare('SELECT started_at AS startedAt,updated_at AS updatedAt,completed_at AS completedAt,best_score AS bestScore,attempts,hints_used AS hintsUsed,session_json AS sessionJson FROM interactive_lab_progress WHERE user_id=? AND lab_id=?').bind(userId,id).first<Row>()}
function presentation(id:string,r:Row){const lab=interactiveLabById(id)!;const session:LabSession=JSON.parse(r.sessionJson);return {id,startedAt:r.startedAt,updatedAt:r.updatedAt,completedAt:r.completedAt,bestScore:r.bestScore,attempts:r.attempts,hintsUsed:r.hintsUsed,session,progress:progressOf(lab,session)}}
export async function listInteractiveLabs(userId:string){const rows=await database().prepare('SELECT lab_id AS id,completed_at AS completedAt,best_score AS bestScore,attempts,hints_used AS hintsUsed,updated_at AS updatedAt FROM interactive_lab_progress WHERE user_id=?').bind(userId).all<{id:string;completedAt:string|null;bestScore:number;attempts:number;hintsUsed:number;updatedAt:string}>();return Promise.all(interactiveLabs.map(async l=>({...l,state:rows.results.find(r=>r.id===l.id)||null,access:await interactiveLabAccess(userId,l.id)})));}
export async function readInteractiveLab(userId:string,id:string){if(!interactiveLabById(id))throw Error('مختبر غير معروف.');const r=await row(userId,id);return r?presentation(id,r):null;}
export async function updateInteractiveLab(userId:string,id:string,action:LabAction){const lab=interactiveLabById(id);if(!lab)throw Error('مختبر غير معروف.');const db=database(),at=now();const access=await interactiveLabAccess(userId,id);if(access?.locked)throw Error('التقييم مقفل: '+access.reasons.join('، '));
 if(action.action==='start'){
  await db.prepare('INSERT OR IGNORE INTO interactive_lab_progress(user_id,lab_id,started_at,updated_at,completed_at,best_score,attempts,hints_used,session_json) VALUES(?,?,?,?,NULL,0,0,0,?)').bind(userId,id,at,at,JSON.stringify(newLabSession())).run();
  return {state:await readInteractiveLab(userId,id),message:'استُعيدت خطوات المختبر المحفوظة.'};
 }
 const before=await row(userId,id);if(!before)throw Error('ابدأ المختبر أولًا.');const existing:LabSession=JSON.parse(before.sessionJson);
 const {session,message,submitted}=applyLabAction(lab,existing,action);
 const passed=!!(submitted&&session.lastResult?.passed),first=passed&&!before.completedAt,score=session.lastResult?.score||0;
 if(passed&&session.lastResult){session.lastResult.xpGranted=first;session.lastResult.skillGranted=first;}
 const common=db.prepare('UPDATE interactive_lab_progress SET updated_at=?, completed_at=COALESCE(completed_at,?), best_score=MAX(best_score,?), attempts=?, hints_used=hints_used+?, session_json=? WHERE user_id=? AND lab_id=?').bind(at,passed?at:null,passed?score:0,session.attempts,action.action==='hint'?1:0,JSON.stringify(session),userId,id);
 const queries=[common];
 if(first){queries.push(db.prepare('INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET score=MAX(progress.score,excluded.score),xp=MAX(progress.xp,excluded.xp)').bind(userId,id,'lab',score,lab.xpReward,at));queries.push(...skillAwardStatements(db,userId,'lab',id,at));}
 await db.batch(queries);
 return {state:await readInteractiveLab(userId,id),message};
}

// Uses the same completed-lesson/lab records as guided progression; no new ledger.
export async function interactiveLabAccess(userId:string|null,id:string){
 const lab=interactiveLabById(id);if(!lab?.unlock)return null;
 const total=lab.unlock.lessons.length+lab.unlock.labs.length;
 const db=userId?database():null;
 const [quiz,reading,labs]=db?await Promise.all([
  db.prepare("SELECT item_id AS id FROM progress WHERE user_id=? AND kind='quiz'").bind(userId).all<{id:string}>(),
  db.prepare('SELECT lesson_id AS id FROM activity WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<{id:string}>(),
  db.prepare('SELECT lab_id AS id FROM interactive_lab_progress WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<{id:string}>()
 ]):[{results:[]},{results:[]},{results:[]}];
 const done=new Set([...quiz.results,...reading.results].map(r=>r.id)),doneLabs=new Set(labs.results.map(r=>r.id));
 // A saved completion remains accessible if prerequisite data is later incomplete.
 const completed=doneLabs.has(id),requirements=[...lab.unlock.lessons.map(key=>({href:'/learn/'+key,label:lessons.find(l=>l.id===key)?.title||key,done:done.has(key)})),...lab.unlock.labs.map(key=>({href:'/labs/v2/'+key,label:interactiveLabById(key)?.title||key,done:doneLabs.has(key)}))];
 const reasons=completed?[]:requirements.filter(r=>!r.done).map(r=>'أكمل '+r.label);return {locked:reasons.length>0,completed,total,met:completed?total:requirements.filter(r=>r.done).length,reasons,requirements};
}
