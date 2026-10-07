import {database} from './storage';
import {gradeQuiz} from './grading';
import {evaluateAdaptive,type AdaptiveAttempt,type AdaptiveInput,type AdaptiveRecord} from './adaptive-learning';

type AttemptRow={id:string;score:number;total:number;answers:string;createdAt:string};
type DateRow={id:string;completedAt:string};
type ProgressRow=AdaptiveRecord&{hintsUsed:number};

// Read-only projection from the established user-owned tables. No XP, completion or
// mastery snapshot is written here; changes are visible on the next request.
export async function readAdaptiveLearning(userId:string,now=new Date()){
 const db=database();const [activity,quizzes,attemptRows,missionRows,labRows,socRows,skillRows]=await Promise.all([
  db.prepare('SELECT lesson_id AS id, completed_at AS completedAt FROM activity WHERE user_id=? AND completed_at IS NOT NULL').bind(userId).all<DateRow>(),
  db.prepare("SELECT item_id AS id,completed_at AS completedAt FROM progress WHERE user_id=? AND kind='quiz'").bind(userId).all<DateRow>(),
  db.prepare('SELECT lesson_id AS id,score,total,answers,created_at AS createdAt FROM attempts WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 500').bind(userId).all<AttemptRow>(),
  db.prepare('SELECT mission_id AS id,score,attempts,hints_used AS hintsUsed,completed_at AS completedAt,updated_at AS updatedAt,session_json AS sessionJson FROM mission_progress WHERE user_id=?').bind(userId).all<ProgressRow>(),
  db.prepare('SELECT lab_id AS id,best_score AS bestScore,attempts,hints_used AS hintsUsed,completed_at AS completedAt,updated_at AS updatedAt,session_json AS sessionJson FROM interactive_lab_progress WHERE user_id=?').bind(userId).all<ProgressRow>(),
  db.prepare('SELECT alert_id AS id,score,best_score AS bestScore,attempts,closed_at AS closedAt,updated_at AS updatedAt,session_json AS sessionJson FROM soc_investigations WHERE user_id=?').bind(userId).all<ProgressRow>(),
  db.prepare('SELECT skill_id AS id,xp FROM skill_progress WHERE user_id=?').bind(userId).all<{id:string;xp:number}>()
 ]);
 const complete=new Map([...quizzes.results,...activity.results].map(l=>[l.id,l]));
 const attempts:AdaptiveAttempt[]=attemptRows.results.map(a=>{
  try{const grade=gradeQuiz(a.id,JSON.parse(a.answers));return {id:a.id,score:a.score,total:a.total,createdAt:a.createdAt,questions:grade.score===a.score&&grade.total===a.total?grade.feedback.map((q,index)=>({index,correct:q.correct,topic:q.topic})):[]}}
  catch{return {id:a.id,score:a.score,total:a.total,createdAt:a.createdAt,questions:[]}}
 });
 const input:AdaptiveInput={lessons:[...complete.values()],attempts,missions:missionRows.results,labs:labRows.results,soc:socRows.results,skillXp:skillRows.results};
 return evaluateAdaptive(input,now);
}
