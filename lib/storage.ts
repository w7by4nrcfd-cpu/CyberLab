import { env } from 'cloudflare:workers';
import {skillAwardStatements} from './skill-storage';
export function database() { if (!env.DB)
    throw Error('Database unavailable'); return env.DB; }
export async function readProgress(userId: string) {
    const result = await database().prepare('SELECT item_id AS id, kind, score, xp, completed_at AS completedAt FROM progress WHERE user_id = ? ORDER BY completed_at DESC').bind(userId).all();
    return result.results;
}
export async function saveProgress(userId: string, id: string, kind: string, score: number, xp: number) {
    // A unique compound key and MAX make retries/concurrent submissions idempotent.
    await database().prepare('INSERT INTO progress (user_id,item_id,kind,score,xp,completed_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET score=MAX(progress.score,excluded.score), xp=MAX(progress.xp,excluded.xp)').bind(userId, id, kind, score, xp, new Date().toISOString()).run();
}
export async function savePassedQuiz(userId:string,id:string,score:number,xp:number){
 const db=database(),now=new Date().toISOString();
 // The XP award and lesson completion must commit together. Both upserts are idempotent.
 await db.batch([
  db.prepare('INSERT INTO progress (user_id,item_id,kind,score,xp,completed_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id,item_id) DO UPDATE SET score=MAX(progress.score,excluded.score), xp=MAX(progress.xp,excluded.xp)').bind(userId,id,'quiz',score,xp,now),
  db.prepare('INSERT INTO activity(user_id,lesson_id,started_at,last_at,seconds,completed_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET last_at=excluded.last_at, completed_at=COALESCE(activity.completed_at,excluded.completed_at)').bind(userId,id,now,now,0,now),
  ...skillAwardStatements(db,userId,'lesson',id,now)
 ]);
}
export async function readLearning(userId:string) {
 const db=database();
 const [a,n,b,t,p,d]=await Promise.all([
  db.prepare('SELECT lesson_id AS id, started_at AS startedAt, last_at AS lastAt, seconds, completed_at AS completedAt FROM activity WHERE user_id = ? ORDER BY last_at DESC').bind(userId).all(),
  db.prepare('SELECT lesson_id AS id, content, updated_at AS updatedAt FROM notes WHERE user_id = ?').bind(userId).all(),
  db.prepare('SELECT lesson_id AS id, created_at AS createdAt FROM bookmarks WHERE user_id = ?').bind(userId).all(),
  db.prepare('SELECT lesson_id AS id, score, total, created_at AS createdAt FROM attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').bind(userId).all(),
  db.prepare('SELECT daily_goal AS dailyGoal, theme FROM preferences WHERE user_id = ?').bind(userId).first(),
  db.prepare('SELECT day,seconds FROM daily_time WHERE user_id = ? ORDER BY day DESC LIMIT 365').bind(userId).all()
 ]);
 return {activity:a.results,notes:n.results,bookmarks:b.results,attempts:t.results,dailyTime:d.results,preferences:p||{dailyGoal:15,theme:'dark'}};
}
export async function recordActivity(userId:string,id:string,action:'read'|'complete',seconds=0){
 const now=new Date().toISOString();
 const db=database();
 const activity=db.prepare('INSERT INTO activity(user_id,lesson_id,started_at,last_at,seconds,completed_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET last_at=excluded.last_at, seconds=activity.seconds+excluded.seconds, completed_at=COALESCE(activity.completed_at,excluded.completed_at)').bind(userId,id,now,now,seconds,action==='complete'?now:null);
 if(action==='complete'){await db.batch([activity,...skillAwardStatements(db,userId,'lesson',id,now)]);return}
 const daily=db.prepare('INSERT INTO daily_time(user_id,day,seconds) VALUES(?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET seconds=daily_time.seconds+excluded.seconds').bind(userId,now.slice(0,10),seconds);
 await db.batch([activity,daily]);
}
export async function saveNote(userId:string,id:string,content:string){ await database().prepare('INSERT INTO notes(user_id,lesson_id,content,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET content=excluded.content,updated_at=excluded.updated_at').bind(userId,id,content,new Date().toISOString()).run(); }
export async function setBookmark(userId:string,id:string,saved:boolean){if(saved) await database().prepare('INSERT OR IGNORE INTO bookmarks(user_id,lesson_id,created_at) VALUES(?,?,?)').bind(userId,id,new Date().toISOString()).run(); else await database().prepare('DELETE FROM bookmarks WHERE user_id=? AND lesson_id=?').bind(userId,id).run();}
export async function savePreferences(userId:string,goal:number,theme:string){ await database().prepare('INSERT INTO preferences(user_id,daily_goal,theme,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET daily_goal=excluded.daily_goal,theme=excluded.theme,updated_at=excluded.updated_at').bind(userId,goal,theme,new Date().toISOString()).run(); }
export async function saveAttempt(userId:string,id:string,score:number,total:number,answers:unknown){await database().prepare('INSERT INTO attempts(user_id,lesson_id,score,total,answers,created_at) VALUES(?,?,?,?,?,?)').bind(userId,id,score,total,JSON.stringify(answers),new Date().toISOString()).run();}
