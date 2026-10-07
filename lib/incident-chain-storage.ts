import {database} from './storage';
import {getDynamicIncident} from './dynamic-storage';
import type {DynamicIncident} from './dynamic-incidents';
import {composeResponseIncident} from './incident-chain-definition';
import {responseChain,responseStages} from './incident-chain';
import type {BoardDecision} from './investigation-board';

async function savedStages(userId:string){
 const rows=await database().prepare("SELECT snapshot_json AS snapshotJson FROM dynamic_incidents WHERE user_id=? AND json_extract(snapshot_json,'$.chain.id')=? ORDER BY created_at,instance_id").bind(userId,responseChain.id).all<{snapshotJson:string}>();
 return rows.results.map(r=>JSON.parse(r.snapshotJson) as DynamicIncident);
}
export async function readResponseChain(userId:string){
 const instances=await savedStages(userId),db=database();
 const soc=await db.prepare('SELECT closed_at AS closedAt,session_json AS sessionJson FROM soc_investigations WHERE user_id=? AND alert_id=?').bind(userId,responseChain.sourceId).first<{closedAt:string|null;sessionJson:string}>();
 let incorrect=false;try{incorrect=JSON.parse(soc?.sessionJson||'{}').lastResult?.correct===false}catch{}
 const available=instances.length>0||!!soc?.closedAt&&!incorrect;
 const stages=await Promise.all(responseStages.map(async(stage,index)=>{
  const instance=instances.find(i=>i.chain?.stage===index);
  const workspace=instance?await db.prepare('SELECT status,decision_json AS decisionJson FROM investigation_workspaces WHERE user_id=? AND investigation_id=?').bind(userId,instance.board.id).first<{status:string;decisionJson:string|null}>():null;
  const completed=!!workspace&&workspace.status!=='open';
  return {index,title:stage.title,instanceId:instance?.instanceId||null,status:completed?'completed':instance?'active':'locked',completed};
 }));
 for(const stage of stages)if(!stage.instanceId&&available&&(stage.index===0||stages[stage.index-1].completed))stage.status='available';
 const next=stages.find(s=>!s.completed)?.index??2;
 return {id:responseChain.id,title:responseChain.title,locked:!available,requirement:{href:responseChain.sourceHref,label:'أكمل التحقيق والاستجابة الصحيحة لتنبيه جلسة ليلى',done:available},stages,next,completed:stages.every(s=>s.completed)};
}
// Context is built exclusively from stored, user-owned snapshots and decisions.
// No client-supplied seed, employee, previous action, score or XP is trusted.
export async function startResponseStage(userId:string,stage:number){
 if(!Number.isInteger(stage)||stage<0||stage>=responseStages.length)throw Error('مرحلة التحقيق غير صالحة.');
 const state=await readResponseChain(userId),entry=state.stages[stage];
 if(entry.instanceId)return {instanceId:entry.instanceId,created:false};
 if(state.locked||entry.status==='locked')throw Error('المرحلة مقفلة؛ أكمل متطلب التحقيق السابق أولًا.');
 const db=database(),previous=stage>0?await getDynamicIncident(userId,state.stages[stage-1].instanceId!):null;
 const row=previous?await db.prepare('SELECT decision_json AS decisionJson FROM investigation_workspaces WHERE user_id=? AND investigation_id=? AND status<>?').bind(userId,previous.board.id,'open').first<{decisionJson:string}>():null;
 const decision=row?JSON.parse(row.decisionJson) as BoardDecision:undefined;
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(responseChain.id+':'+userId)));
 const base=new DataView(digest.buffer).getUint32(0)&0x3fffffff;
 for(let attempt=0;attempt<8;attempt++){
  const rootSeed=previous?.chain?.rootSeed??((base+attempt)&0x3fffffff),incident=composeResponseIncident(stage,rootSeed,previous||undefined,decision);
  const existing=await getDynamicIncident(userId,incident.instanceId);
  if(existing){if(existing.chain?.id===responseChain.id&&existing.chain.stage===stage)return {instanceId:existing.instanceId,created:false};if(previous)throw Error('تعارض مع نسخة محفوظة؛ لم تتغير بياناتك.');continue}
  // One SQLite statement computes variant order at execution time. Stable primary key
  // and INSERT OR IGNORE make concurrent stage starts idempotent without a migration.
  const inserted=await db.prepare('INSERT OR IGNORE INTO dynamic_incidents(user_id,instance_id,template_id,variant_number,seed,difficulty,snapshot_json,created_at) SELECT ?,?,?,COALESCE(MAX(variant_number),0)+1,?,?,?,? FROM dynamic_incidents WHERE user_id=? AND template_id=?').bind(userId,incident.instanceId,incident.templateId,incident.seed,incident.difficulty,JSON.stringify(incident),new Date().toISOString(),userId,incident.templateId).run();
  const saved=await getDynamicIncident(userId,incident.instanceId);
  if(saved?.chain?.id===responseChain.id)return {instanceId:saved.instanceId,created:inserted.meta.changes===1};
 }
 throw Error('تعذر فتح القضية دون التأثير على نسخة محفوظة.');
}
