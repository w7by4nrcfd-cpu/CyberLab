import {database,readProgress,readLearning} from './storage';
import {readAdaptiveLearning} from './adaptive-storage';
import {achievementCatalog,achievementStates,levelPath,careerTitles,type AchievementUnlock,type ProgressionData} from './progression';
import {learningMetrics} from './metrics';
import type {Item,Learning} from '@/app/shell';
import {lessons,tracks} from './curriculum';
import {missionById} from './missions';
import {socAlertById} from './soc-alerts';
import {interactiveLabById} from './interactive-labs';
import {interactiveLabAccess} from './interactive-lab-storage';
import {offensiveOrder} from './offensive-minimum';
import {firstPilot} from './mission-first-pilot';
import {coreJourney,coreNextStep,isCoreBeginner} from './mission-first-core';
import {guidedLesson} from './guided-progression';
import {isCyberLesson,isCyberHref} from './content-scope';
import {investigationBoardById,validRelationship,type BoardDefinition,type BoardDecision,type BoardLink} from './investigation-board';
import {validateDecision} from './investigation-storage';
import type {DynamicIncident} from './dynamic-incidents';
import {responseChain} from './incident-chain';
import {careerTracks,evaluateCareer} from './career';

type Workspace={id:string;status:string;decisionJson:string|null;closedAt:string|null};
type SavedLink=BoardLink&{id:string;reason:string;createdAt:string};
const parse=<T,>(s:string|null):T|null=>{try{return JSON.parse(s||'null') as T}catch{return null}};
export async function readProgression(userId:string,now=new Date()):Promise<ProgressionData>{
 const db=database();const [progress,learning,adaptive,workspaces,evidence,links,incidents,missions,labs,soc,history,earned]=await Promise.all([
  readProgress(userId),readLearning(userId),readAdaptiveLearning(userId,now),
  db.prepare('SELECT investigation_id AS id,status,decision_json AS decisionJson,closed_at AS closedAt FROM investigation_workspaces WHERE user_id=?').bind(userId).all<Workspace>(),
  db.prepare('SELECT investigation_id AS id,evidence_id AS evidenceId FROM investigation_evidence WHERE user_id=? AND collected_at IS NOT NULL').bind(userId).all<{id:string;evidenceId:string}>(),
  db.prepare('SELECT investigation_id AS id,from_id AS fromId,relation,to_id AS toId,reason,created_at AS createdAt FROM investigation_links WHERE user_id=?').bind(userId).all<SavedLink>(),
  db.prepare('SELECT snapshot_json AS snapshot FROM dynamic_incidents WHERE user_id=?').bind(userId).all<{snapshot:string}>(),
  db.prepare('SELECT mission_id AS id,completed_at AS completedAt FROM mission_progress WHERE user_id=?').bind(userId).all<{id:string;completedAt:string|null}>(),
  db.prepare('SELECT lab_id AS id,completed_at AS completedAt,session_json AS sessionJson FROM interactive_lab_progress WHERE user_id=?').bind(userId).all<{id:string;completedAt:string|null;sessionJson:string}>(),
  db.prepare('SELECT alert_id AS id,closed_at AS closedAt,best_score AS score,session_json AS sessionJson FROM soc_investigations WHERE user_id=?').bind(userId).all<{id:string;closedAt:string|null;score:number;sessionJson:string}>(),
  db.prepare('SELECT stage_id AS id FROM career_promotions WHERE user_id=? AND track_id=?').bind(userId,careerTracks[0].id).all<{id:string}>(),
  db.prepare('SELECT achievement_id AS id,tier,earned_at AS earnedAt,proof_json AS proofJson FROM achievement_unlocks WHERE user_id=?').bind(userId).all<{id:string;tier:number;earnedAt:string;proofJson:string}>()
 ]);
 const items=progress as Item[],activity=learning as unknown as Learning,m=learningMetrics(items,activity),xp=m.xp;
 const old:AchievementUnlock[]=earned.results.map(r=>({...r,proof:parse<string[]>(r.proofJson)||[]}));
 const proofs:Record<string,Set<string>>=Object.fromEntries(achievementCatalog.map(a=>[a.id,new Set(old.filter(u=>u.id===a.id).flatMap(u=>u.proof))]));
 const add=(key:string,id:string)=>proofs[key].add(id);
 const missionDone=new Set([...missions.results.filter(r=>r.completedAt&&missionById(r.id)).map(r=>r.id),...items.filter(r=>['mission','boss'].includes(r.kind)).map(r=>r.id.replace(/^(mission|boss):/, '')).filter(id=>missionById(id))]);
 for(const id of missionDone)add('first-mission',id);if(missionDone.has('003'))add('phishing','003');
 const labDone=new Set([...labs.results.filter(r=>r.completedAt).map(r=>r.id),...items.filter(r=>r.kind==='lab').map(r=>r.id)]);
 for(const id of offensiveOrder)if(labDone.has(id))add('offensive-foundations',id);
 for(const row of soc.results)if(row.closedAt&&socAlertById(row.id)&&parse<{lastResult?:{correct:boolean}}>(row.sessionJson)?.lastResult?.correct===true)add('soc-response',row.id);
 const snapshots=incidents.results.map(r=>parse<DynamicIncident>(r.snapshot)).filter((i):i is DynamicIncident=>!!i);
 const correctBoards=new Set<string>();
 for(const w of workspaces.results){
  if(w.status==='open'||!w.closedAt)continue;
  const instance=snapshots.find(i=>i.board.id===w.id),board:BoardDefinition|undefined=instance?.board||investigationBoardById(w.id),decision=parse<BoardDecision>(w.decisionJson);
  if(!board||!decision)continue;
  const collected=evidence.results.filter(e=>e.id===w.id).map(e=>e.evidenceId),saved=links.results.filter(l=>l.id===w.id);
  try{
   if(!saved.every(l=>validRelationship(board,l.fromId,l.relation,l.toId)&&l.reason.trim().length>=8)||!validateDecision(board,decision,collected,saved))continue;
   if(instance?.chain&&!board.expected.affected.every(id=>decision.affected.includes(id)))continue;
   correctBoards.add(w.id);
   // Variants of a template are practice, not an unlimited badge counter.
   const key=instance?(instance.chain?`chain:${instance.chain.id}:${instance.chain.stage}`:`template:${instance.templateId}`):w.id;
   const important=board.evidence.filter(e=>e.role==='required'&&decision.evidenceIds.includes(e.id));
   const correlated=saved.some(l=>board.expected.requiredLinks?.some(r=>r.fromId===l.fromId&&r.toId===l.toId&&r.relation===l.relation)||important.some(e=>e.entities.includes(l.fromId)&&e.entities.includes(l.toId)));
   if(important.length>=2&&correlated){add('investigator',key);if(new Set(important.map(e=>e.source)).size>=2)add('correlation',key)}
  }catch{/* Unproven legacy closures stay accessible but do not earn a new badge. */}
 }
 const chain=snapshots.filter(i=>i.chain?.id===responseChain.id);
 const completedChain=chain.some(last=>{
  if(last.chain?.stage!==2||!correctBoards.has(last.board.id))return false;
  const middle=chain.find(i=>i.instanceId===last.chain?.previousInstanceId&&i.chain?.stage===1&&correctBoards.has(i.board.id));
  const first=middle&&chain.find(i=>i.instanceId===middle.chain?.previousInstanceId&&i.chain?.stage===0&&correctBoards.has(i.board.id));
  return !!first&&first.chain?.rootSeed===middle!.chain?.rootSeed&&first.chain?.rootSeed===last.chain.rootSeed;
 });
 if(completedChain)add('incident-chain',responseChain.id);
 for(const s of adaptive.mastery)if(s.samples>=2&&['Proficient','Strong'].includes(s.band))add('mastery',s.id);
 const completedLessons=lessons.filter(l=>m.done.has(l.id));
 for(const l of completedLessons){add('first',l.id);add('five',l.id);add('explorer',l.track)}
 for(const id of labDone)if(interactiveLabById(id)||items.some(i=>i.kind==='lab'&&i.id===id))add('labs',id);
 for(const t of tracks)if(lessons.filter(l=>l.track===t.id).every(l=>m.done.has(l.id)))add('track',t.id);
 const days=[...new Set([...activity.dailyTime.filter(d=>d.seconds>0).map(d=>d.day),...items.map(i=>i.completedAt.slice(0,10))])].filter(d=>/^\d{4}-\d\d-\d\d$/.test(d)).sort();let longest=0,run=0,last=0;
 for(const d of days){const t=Date.parse(d);run=t-last===86400000?run+1:1;last=t;longest=Math.max(longest,run)}
 const values=Object.fromEntries(achievementCatalog.map(a=>[a.id,proofs[a.id].size]));values['level-milestone']=levelPath(xp).level;values.streak=Math.max(longest,...old.filter(u=>u.id==='streak').map(()=>3));
 const pending:AchievementUnlock[]=achievementCatalog.flatMap(a=>a.thresholds.flatMap((target,index)=>values[a.id]>=target&&!old.some(u=>u.id===a.id&&u.tier===index+1)?[{id:a.id,tier:index+1,earnedAt:now.toISOString(),proof:[...proofs[a.id]]}]:[]));
 // Server-derived, non-reward metadata. Compound key + INSERT OR IGNORE tolerates concurrency.
 const inserted=pending.length?await db.batch(pending.map(u=>db.prepare('INSERT OR IGNORE INTO achievement_unlocks(user_id,achievement_id,tier,earned_at,proof_json) VALUES(?,?,?,?,?)').bind(userId,u.id,u.tier,u.earnedAt,JSON.stringify(u.proof)))):[];
 // Preserve proven progress toward the next tier even if a completed source is reopened.
 const proofUpdates=achievementCatalog.filter(a=>old.some(u=>u.id===a.id)&&[...proofs[a.id]].some(id=>!old.filter(u=>u.id===a.id).some(u=>u.proof.includes(id))));
 if(proofUpdates.length)await db.batch(proofUpdates.map(a=>db.prepare('UPDATE achievement_unlocks SET proof_json=(SELECT json_group_array(value) FROM (SELECT value FROM json_each(achievement_unlocks.proof_json) UNION SELECT value FROM json_each(?))) WHERE user_id=? AND achievement_id=?').bind(JSON.stringify([...proofs[a.id]]),userId,a.id)));
 const stored=(await db.prepare('SELECT achievement_id AS id,tier,earned_at AS earnedAt,proof_json AS proofJson FROM achievement_unlocks WHERE user_id=?').bind(userId).all<{id:string;tier:number;earnedAt:string;proofJson:string}>()).results.map(u=>({...u,proof:parse<string[]>(u.proofJson)||[]}));
 const career=evaluateCareer({lessons:[...m.done],labs:[...labDone],missions:[...missionDone],soc:soc.results.filter(r=>r.closedAt).map(r=>({id:r.id,score:r.score})),mastery:adaptive.mastery,recommendations:adaptive.recommendations},careerTracks[0],Math.max(0,...history.results.map(r=>careerTracks[0].stages.findIndex(s=>s.id===r.id))));
 const network=parse<{networkFixed?:string[]}>(labs.results.find(l=>l.id===firstPilot.labId)?.sessionJson||null)?.networkFixed?.includes(firstPilot.caseId)||false;
 const socDone=soc.results.some(s=>s.id===coreJourney.socId&&s.closedAt&&parse<{lastResult?:{correct?:boolean}}>(s.sessionJson)?.lastResult?.correct!==false),boardDone=correctBoards.has(coreJourney.boardId)||workspaces.results.some(w=>w.id===coreJourney.boardId&&w.status!=='open');
 let goal:ProgressionData['goal'];
 const core=coreNextStep(network,missionDone.has('003'),missionDone.has(coreJourney.signalMissionId),socDone,boardDone,proofs['incident-chain'].size>0);
 const unfinished=workspaces.results.find(w=>w.status==='open');
 if(isCoreBeginner(items.filter(i=>!lessons.some(l=>l.id===i.id)||isCyberLesson(i.id)),activity.activity.filter(a=>isCyberLesson(a.id)))&&core.href!=='/progress')goal=core;
 else if(unfinished)goal={href:'/investigations/'+unfinished.id,title:'أكمل التحقيق المحفوظ',detail:'أدلتك وعلاقاتك محفوظة؛ راجعها قبل القرار.',action:'تابع التحقيق'};
 else if(boardDone&&core.href!=='/progress')goal=core;
 else {const recommendation=adaptive.recommendations.find(r=>r.href!== '/progress'&&isCyberHref(r.href));if(recommendation){goal={href:recommendation.href,title:recommendation.title,detail:recommendation.priority==='Review'?'مراجعة لتحسين الإتقان؛ لا تُمنح مكافأة إكمال ثانية.':recommendation.why[0]||'تدريب مناسب وفق أدلة مهاراتك الحالية.',action:recommendation.priority==='Review'?'راجع التدريب':'تابع التدريب'};if(recommendation.href.startsWith('/labs/v2/')){const access=await interactiveLabAccess(userId,recommendation.href.split('?')[0].split('/').at(-1)!);const requirement=access?.locked?access.requirements.find(r=>!r.done):null;if(requirement)goal={href:requirement.href,title:requirement.label,detail:'خطوة تفتح التدريب الموصى به: '+recommendation.title+'. المحتوى يتطلب معرفة سابقة، ولا تفتحه النقاط وحدها.',action:'أكمل المتطلب'}}}else{const next=guidedLesson(m.done,activity.activity);goal={href:'/learn/'+next.lesson.id,title:next.lesson.title,detail:'مرجع سيبراني مناسب لتقدمك الحالي.',action:next.continuing?'تابع ما بدأت':'افتح المعرفة'}}}
 return {xp,level:levelPath(xp),achievements:achievementStates(values,stored),goal,mastery:adaptive.mastery.map(({id,mastery,samples,band,xp})=>({id,mastery,samples,band,xp})),career:{id:career.current.id,title:careerTitles[career.current.id]||career.current.title,readiness:career.next?.readiness??100,next:career.next?careerTitles[career.next.id]||career.next.title:null},newUnlocks:pending.filter((_,i)=>inserted[i]?.meta.changes===1)};
}
