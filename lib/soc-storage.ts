import {defensiveBoard,isDefensiveId,responseObservations} from './soc-expansion';
import {defensiveAccess} from './soc-expansion-access';
import {readInvestigation,validateDecision} from './investigation-storage';
import {database} from './storage';
import {skillAwardStatements} from './skill-storage';
import {socAlerts,socAlertById,socCaseById} from './soc-alerts';
import {applySocAction,freshSocSession,type SocAction,type SocSession,type SocStatus} from './soc-engine';

type Row={alertId:string;status:SocStatus;startedAt:string;updatedAt:string;closedAt:string|null;score:number;bestScore:number;attempts:number;sessionJson:string};
type CaseRow={caseId:string;status:string;severity:string;createdAt:string;updatedAt:string;closedAt:string|null;finalConclusion:string|null};
const alertPublic=(a:NonNullable<ReturnType<typeof socAlertById>>)=>({id:a.id,title:a.title,severity:a.severity,timestamp:a.timestamp,user:a.user,host:a.host,sourceIp:a.sourceIp,type:a.type,summary:a.summary,scenario:a.scenario,skillRewards:a.skillRewards,evidence:a.evidence.map(e=>({id:e.id,kind:e.kind,time:e.time,title:e.title})),tools:a.tools.map(t=>({id:t.id,label:t.label,description:t.description}))});
function sessionOf(row:Row):SocSession{try{return {...freshSocSession(),...JSON.parse(row.sessionJson) as SocSession}}catch{return freshSocSession()}}
function view(row:Row|null){return row?{status:row.status,startedAt:row.startedAt,updatedAt:row.updatedAt,closedAt:row.closedAt,score:row.score,bestScore:row.bestScore,attempts:row.attempts,session:sessionOf(row)}:null}
async function rowFor(userId:string,id:string){return database().prepare('SELECT alert_id AS alertId,status,started_at AS startedAt,updated_at AS updatedAt,closed_at AS closedAt,score,best_score AS bestScore,attempts,session_json AS sessionJson FROM soc_investigations WHERE user_id=? AND alert_id=?').bind(userId,id).first<Row>()}
async function notesFor(userId:string,kind:'alert'|'case',id:string){const r=await database().prepare('SELECT id,content,created_at AS createdAt FROM soc_notes WHERE user_id=? AND scope_kind=? AND scope_id=? ORDER BY created_at DESC,id DESC LIMIT 100').bind(userId,kind,id).all<{id:number;content:string;createdAt:string}>();return r.results}
export async function readSocQueue(userId:string){
 const db=database();const [rows,cases]=await Promise.all([
  db.prepare('SELECT alert_id AS alertId,status,closed_at AS closedAt,score,best_score AS bestScore FROM soc_investigations WHERE user_id=?').bind(userId).all<{alertId:string;status:SocStatus;closedAt:string|null;score:number;bestScore:number}>(),
  db.prepare('SELECT case_id AS id,status,severity,updated_at AS updatedAt FROM soc_cases WHERE user_id=? ORDER BY updated_at DESC').bind(userId).all<{id:string;status:string;severity:string;updatedAt:string}>()
 ]);
 const items=socAlerts.map(a=>{const p=rows.results.find(r=>r.alertId===a.id);return {...alertPublic(a),status:p?.status||'New',closedAt:p?.closedAt||null,score:p?.score||0,bestScore:p?.bestScore||0,caseId:p&&a.caseId&&p.closedAt&&p.status!=='False Positive'?a.caseId:null}});
 return {alerts:items,cases:cases.results.map(c=>({...c,title:socCaseById(c.id)?.title||c.id})),stats:{newAlerts:items.filter(a=>a.status==='New').length,activeCases:cases.results.filter(c=>c.status!=='Resolved').length,closedAlerts:items.filter(a=>!!a.closedAt).length,totalAlerts:items.length,progress:Math.round(items.filter(a=>!!a.closedAt).length/items.length*100)}};
}
export async function readSocAlert(userId:string,id:string){
 const a=socAlertById(id);if(!a)throw Error('التنبيه غير موجود.');
 const [row,notes,award]=await Promise.all([rowFor(userId,id),notesFor(userId,'alert',id),database().prepare("SELECT COUNT(*) AS n FROM skill_awards WHERE user_id=? AND source_kind='soc' AND source_id=?").bind(userId,id).first<{n:number}>()]);
 const state=view(row),inspected=new Set(state?.session.inspected||[]);
 return {...(isDefensiveId(id)?{defensiveUnlocked:await defensiveAccess(userId,id),responseObservations:state?.session.defensive?.plan?responseObservations(id,state.session.defensive.plan):[]}:{}),alert:{...alertPublic(a),evidence:a.evidence.map(e=>({...e,content:inspected.has(e.id)?e.content:null}))},state,notes,skillAwarded:!!award?.n,caseId:a.caseId&&row?.closedAt&&row.status!=='False Positive'?a.caseId:null};
}
export async function writeSocAction(userId:string,action:SocAction){
 const alert=socAlertById(action.id);if(!alert)throw Error('التنبيه غير موجود.');
 const db=database(),now=new Date().toISOString();
 if(action.action==='start')await db.prepare("INSERT OR IGNORE INTO soc_investigations(user_id,alert_id,status,started_at,updated_at,session_json) VALUES(?,?,'Investigating',?,?,?)").bind(userId,alert.id,now,now,JSON.stringify(freshSocSession())).run();
 const row=await rowFor(userId,alert.id);if(!row)throw Error('افتح التنبيه قبل بدء التحقيق.');
 if(row.closedAt&&action.action!=='reopen'&&action.action!=='start')throw Error('التنبيه مغلق. أعد فتح التحقيق لمحاولة جديدة.');
 if(action.action==='reopen'&&!row.closedAt)throw Error('التحقيق مفتوح بالفعل.');
 if(action.action==='start')return {...await readSocAlert(userId,alert.id),message:row.closedAt?'التنبيه مغلق. يمكنك إعادة التحقيق دون مكافأة مكررة.':'استُعيد ملف التنبيه.'};
 const prior=sessionOf(row),board=defensiveBoard(alert.id);
 if(['defensive','assess','response-test','verify','report'].includes(action.action)&&(!board||!await defensiveAccess(userId,alert.id)))throw Error('أكمل تحقيق جلسة ليلى SOC-002 أولًا لفتح تدريب الاستجابة.');
 let correlated=false,workspace:Awaited<ReturnType<typeof readInvestigation>>|null=null;
 if(board&&(action.action==='assess'||action.action==='close'&&prior.defensive)){
  workspace=await readInvestigation(userId,board.id);
  const decision=action.action==='assess'?action.decision:prior.defensive?.assessment;
  if(!decision)throw Error('حدد التقييم والأصول والأدلة أولًا.');
  const collected=workspace.evidence.filter(e=>e.collectedAt).map(e=>e.evidenceId);
  // Values and ownership come from the persisted board, never client flags.
  correlated=validateDecision(board,decision,collected,workspace.links)&&board.expected.affected.every(id=>decision.affected.includes(id))&&decision.affected.every(id=>board.expected.affected.includes(id))&&prior.priority===alert.severity&&prior.usedTools.length>0;
  if(action.action==='assess'){prior.collected=alert.evidence.filter(e=>collected.includes(e.id)).map(e=>e.id);prior.inspected=alert.evidence.filter(e=>workspace!.evidence.some(saved=>saved.evidenceId===e.id&&saved.reviewedAt)).map(e=>e.id);}
 }
 const applied=applySocAction(alert,prior,action,correlated),result=applied.result;
 if(board&&action.action==='reopen'&&row.closedAt)applied.session.defensiveStarted=true;
 const status=applied.status==='Investigating'&&row.status==='Escalated'&&action.action!=='reopen'?row.status:applied.status;
 const before=result?.skillAwardEligible?await db.prepare("SELECT COUNT(*) AS n FROM skill_awards WHERE user_id=? AND source_kind='soc' AND source_id=?").bind(userId,alert.id).first<{n:number}>():null;
 if(result)applied.session.lastResult={...result,skillAwardGranted:!!result.skillAwardEligible&&!before?.n};
 const statements=[db.prepare('UPDATE soc_investigations SET status=?,updated_at=?,closed_at=?,score=?,best_score=MAX(best_score,?),attempts=?,session_json=? WHERE user_id=? AND alert_id=?').bind(status,now,result?now:action.action==='reopen'?null:row.closedAt,result?.score||row.score,result?.score||row.bestScore,row.attempts+(result?1:0),JSON.stringify(applied.session),userId,alert.id)];
 if(result&&board&&applied.session.defensive?.verified){
  const decision=applied.session.defensive.assessment!;
  statements.push(db.prepare('UPDATE investigation_workspaces SET status=?,decision_json=?,closed_at=?,updated_at=? WHERE user_id=? AND investigation_id=?').bind(decision.action==='contain'?'contained':'closed',JSON.stringify(decision),now,now,userId,board.id));
 }
 if(result&&alert.caseId&&result.classificationCorrect&&alert.truth==='true_positive'&&applied.session.collected.length>0){
  const template=socCaseById(alert.caseId)!;
  const existingLink=await db.prepare('SELECT alert_id FROM soc_case_alerts WHERE user_id=? AND case_id=? AND alert_id=?').bind(userId,template.id,alert.id).first();
  statements.push(db.prepare("INSERT OR IGNORE INTO soc_cases(user_id,case_id,status,severity,created_at,updated_at) VALUES(?,?,'Investigating',?,?,?)").bind(userId,template.id,template.severity,now,now));
  if(!existingLink)statements.push(db.prepare("UPDATE soc_cases SET status='Investigating',closed_at=NULL,updated_at=? WHERE user_id=? AND case_id=?").bind(now,userId,template.id));
  statements.push(db.prepare('INSERT OR IGNORE INTO soc_case_alerts(user_id,case_id,alert_id,linked_at) VALUES(?,?,?,?)').bind(userId,template.id,alert.id,now));
  for(const evidenceId of applied.session.collected)statements.push(db.prepare('INSERT OR IGNORE INTO soc_case_evidence(user_id,case_id,alert_id,evidence_id,collected_at) VALUES(?,?,?,?,?)').bind(userId,template.id,alert.id,evidenceId,now));
 }
 if(result?.skillAwardEligible)statements.push(...skillAwardStatements(db,userId,'soc',alert.id,now));
 await db.batch(statements);
 return {...await readSocAlert(userId,alert.id),message:applied.message,newSkillAward:!!result?.skillAwardEligible&&!before?.n};
}
export async function addSocNote(userId:string,kind:'alert'|'case',id:string,content:unknown){
 if(typeof content!=='string'||content.trim().length<3||content.length>2000)throw Error('اكتب ملاحظة من 3 إلى 2000 حرف.');
 if(kind==='alert'&&!socAlertById(id)||kind==='case'&&!await database().prepare('SELECT case_id FROM soc_cases WHERE user_id=? AND case_id=?').bind(userId,id).first())throw Error('القضية أو التنبيه غير موجود.');
 await database().prepare('INSERT INTO soc_notes(user_id,scope_kind,scope_id,content,created_at) VALUES(?,?,?,?,?)').bind(userId,kind,id,content.trim(),new Date().toISOString()).run();
 return notesFor(userId,kind,id);
}
export async function readSocCase(userId:string,id:string){
 const template=socCaseById(id);if(!template)throw Error('القضية غير موجودة.');
 const db=database();const [record,linked,evidence,notes]=await Promise.all([
  db.prepare('SELECT case_id AS caseId,status,severity,created_at AS createdAt,updated_at AS updatedAt,closed_at AS closedAt,final_conclusion AS finalConclusion FROM soc_cases WHERE user_id=? AND case_id=?').bind(userId,id).first<CaseRow>(),
  db.prepare('SELECT alert_id AS id,linked_at AS linkedAt FROM soc_case_alerts WHERE user_id=? AND case_id=? ORDER BY linked_at').bind(userId,id).all<{id:string;linkedAt:string}>(),
  db.prepare('SELECT alert_id AS alertId,evidence_id AS evidenceId,collected_at AS collectedAt FROM soc_case_evidence WHERE user_id=? AND case_id=? ORDER BY collected_at').bind(userId,id).all<{alertId:string;evidenceId:string;collectedAt:string}>(),
  notesFor(userId,'case',id)
 ]);
 if(!record)throw Error('القضية غير موجودة.');
 const alerts=linked.results.map(l=>({id:l.id,title:socAlertById(l.id)?.title||l.id,url:'/soc/alerts/'+l.id,linkedAt:l.linkedAt}));
 const collected=evidence.results.map(e=>{const a=socAlertById(e.alertId),item=a?.evidence.find(x=>x.id===e.evidenceId);return {...e,title:item?.title||e.evidenceId,content:item?.content||'',time:item?.time||'',kind:item?.kind||'auth'}});
 const affectedUsers=[...new Set(alerts.map(a=>socAlertById(a.id)?.user).filter(Boolean))],affectedHosts=[...new Set(alerts.map(a=>socAlertById(a.id)?.host).filter(Boolean))];
 const timeline=[...alerts.map(a=>({time:a.linkedAt,label:'رُبط التنبيه '+a.id+' بالقضية'})),...collected.map(e=>({time:e.collectedAt,label:'دليل '+e.title+' من '+e.alertId}))].sort((a,b)=>a.time.localeCompare(b.time));
 return {case:{...record,title:template.title,description:template.description,relatedAlertIds:template.relatedAlertIds},alerts,evidence:collected,notes,affectedUsers,affectedHosts,timeline};
}
export async function closeSocCase(userId:string,id:string,conclusion:unknown){
 const record=await readSocCase(userId,id);
 if(record.case.status==='Resolved')throw Error('القضية مغلقة بالفعل.');
 if(typeof conclusion!=='string'||conclusion.trim().length<25||conclusion.length>2000)throw Error('اكتب استنتاجًا نهائيًا من 25 إلى 2000 حرف.');
 const now=new Date().toISOString();await database().prepare("UPDATE soc_cases SET status='Resolved',final_conclusion=?,closed_at=?,updated_at=? WHERE user_id=? AND case_id=?").bind(conclusion.trim(),now,now,userId,id).run();
 return readSocCase(userId,id);
}
