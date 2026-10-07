import {assertIncidentIntegrity} from './dynamic-variation';
import {database} from './storage';
import {generateIncident,incidentTemplates,makeIncidentSeed,type Difficulty,type DynamicIncident,type IncidentTemplateId} from './dynamic-incidents';

type Row={instanceId:string;templateId:IncidentTemplateId;seed:number;difficulty:Difficulty;snapshotJson:string;variantNumber:number;createdAt:string};
const known=(id:string):id is IncidentTemplateId=>incidentTemplates.some(t=>t.id===id);
export async function getDynamicIncident(userId:string,instanceId:string):Promise<DynamicIncident|null>{
 if(!/^(phishing|endpoint|network-auth)-[0-9a-f]{8}$/.test(instanceId))return null;
 const row=await database().prepare('SELECT snapshot_json AS snapshotJson FROM dynamic_incidents WHERE user_id=? AND instance_id=?').bind(userId,instanceId).first<{snapshotJson:string}>();
 if(!row)return null;const snapshot=JSON.parse(row.snapshotJson) as DynamicIncident;
 if(snapshot.instanceId!==instanceId||![`dynamic-${instanceId}`,`dynamic:${instanceId}`].includes(snapshot.board.id))throw Error('تعذر التحقق من نسخة الحادث.');
 assertIncidentIntegrity(snapshot);return snapshot;
}
export async function listDynamicIncidents(userId:string){
 const result=await database().prepare('SELECT i.instance_id AS instanceId,i.template_id AS templateId,i.seed,i.difficulty,i.variant_number AS variantNumber,i.created_at AS createdAt,w.status FROM dynamic_incidents i LEFT JOIN investigation_workspaces w ON w.user_id=i.user_id AND w.investigation_id=(\'dynamic-\'||i.instance_id) WHERE i.user_id=? ORDER BY i.created_at DESC LIMIT 75').bind(userId).all<Omit<Row,'snapshotJson'>&{status:string|null}>();
 const active=await database().prepare('SELECT template_id AS templateId,instance_id AS instanceId FROM dynamic_active WHERE user_id=?').bind(userId).all<{templateId:string;instanceId:string}>();
 return {instances:result.results,active:Object.fromEntries(active.results.map(r=>[r.templateId,r.instanceId]))};
}
export async function startDynamicIncident(userId:string,templateId:string,difficulty:Difficulty,mode:'resume'|'new',generationVersion:1|2=1){
 if(!known(templateId)||!['beginner','intermediate','advanced'].includes(difficulty)||!['resume','new'].includes(mode))throw Error('اختيار الحادث غير صالح.');
 const db=database();
 if(mode==='resume'){
  const row=await db.prepare('SELECT instance_id AS instanceId FROM dynamic_active WHERE user_id=? AND template_id=?').bind(userId,templateId).first<{instanceId:string}>();
  if(row)return {instanceId:row.instanceId,created:false};
 }
 const count=await db.prepare('SELECT COALESCE(MAX(variant_number),0) AS n FROM dynamic_incidents WHERE user_id=? AND template_id=?').bind(userId,templateId).first<{n:number}>();
 if((count?.n||0)>=25)throw Error('بلغت الحد الأقصى للنسخ المحفوظة لهذا القالب. أعد التحقيق في نسخة محفوظة.');
 let seed=0,incident:DynamicIncident|null=null;
 for(let attempt=0;attempt<6;attempt++){
  seed=makeIncidentSeed(difficulty);const candidate=generateIncident(templateId,seed,undefined,generationVersion);
  const exists=await db.prepare('SELECT instance_id FROM dynamic_incidents WHERE user_id=? AND instance_id=?').bind(userId,candidate.instanceId).first();
  if(!exists){incident=candidate;break}
 }
 if(!incident)throw Error('تعذر توليد نسخة مختلفة الآن.');
 const now=new Date().toISOString();
 await db.batch([
  db.prepare('INSERT INTO dynamic_incidents(user_id,instance_id,template_id,variant_number,seed,difficulty,snapshot_json,created_at) SELECT ?,?,?,COALESCE(MAX(variant_number),0)+1,?,?,?,? FROM dynamic_incidents WHERE user_id=? AND template_id=? HAVING COALESCE(MAX(variant_number),0)<25').bind(userId,incident.instanceId,templateId,seed,difficulty,JSON.stringify(incident),now,userId,templateId),
  db.prepare('INSERT INTO dynamic_active(user_id,template_id,instance_id) SELECT user_id,template_id,instance_id FROM dynamic_incidents WHERE user_id=? AND instance_id=? ON CONFLICT(user_id,template_id) DO UPDATE SET instance_id=excluded.instance_id').bind(userId,incident.instanceId)
 ]);
 if(!await getDynamicIncident(userId,incident.instanceId))throw Error('بلغت الحد الأقصى للنسخ المحفوظة. أعد التحقيق في نسخة محفوظة.');
 return {instanceId:incident.instanceId,created:true};
}
