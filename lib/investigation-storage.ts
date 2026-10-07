import {defensiveAccess} from './soc-expansion-access';
import {isDefensiveId} from './soc-expansion';
import {chainConsequence} from './incident-chain';
import {database} from './storage';
import {investigationBoardById,relationshipTypes,validRelationship,type BoardDecision,type BoardDefinition,type RelationshipType} from './investigation-board';
import {readCampaign} from './campaign-storage';
import {readBossLocks} from './mission-storage';
import {getDynamicIncident} from './dynamic-storage';

type WorkspaceRow={status:string;decisionJson:string|null;createdAt:string;updatedAt:string;closedAt:string|null};
type EvidenceRow={evidenceId:string;reviewedAt:string|null;collectedAt:string|null;classification:string|null;note:string};
type LinkRow={fromId:string;relation:RelationshipType;toId:string;reason:string;createdAt:string};
export type BoardAction=
 |{action:'review'|'collect';evidenceId:string}
 |{action:'annotate';evidenceId:string;note:string;classification:string}
 |{action:'link';fromId:string;toId:string;relation:RelationshipType;reason:string}
 |{action:'unlink';fromId:string;toId:string;relation:RelationshipType}
 |{action:'decide';decision:BoardDecision}
 |{action:'reopen'};

function definition(id:string){const board=investigationBoardById(id);if(!board)throw Error('التحقيق غير موجود.');return board}
async function visibleDefinition(userId:string,id:string){
 if(id.startsWith('dynamic-')){
  const incident=await getDynamicIncident(userId,id.slice(8));if(!incident)throw Error('التحقيق غير موجود.');
  return incident.board;
 }
 const board=definition(id);
 if(board.sourceKind==='soc'&&isDefensiveId(board.sourceId)&&!await defensiveAccess(userId,board.sourceId))throw Error('أكمل تحقيق جلسة ليلى SOC-002 أولًا لفتح تدريب الاستجابة.');
 if(board.sourceKind==='campaign'){
  const unlocked=new Set((await readCampaign(userId,board.sourceId)).evidence.map(e=>e.id));
  const available=board.evidence.filter(e=>unlocked.has(e.id));
  const referenced=new Set(available.flatMap(e=>e.entities));
  return {...board,evidence:available,nodes:board.nodes.filter(n=>!!n.companyRef||n.kind==='evidence'&&unlocked.has(n.id.slice(9))||referenced.has(n.id))};
 }
 if(board.sourceKind==='boss'){
  const started=await database().prepare('SELECT mission_id FROM mission_progress WHERE user_id=? AND mission_id=?').bind(userId,board.sourceId).first();
  if(!started&&((await readBossLocks(userId)).find(b=>b.id===board.sourceId)?.reasons.length||0)>0)throw Error('هذا التحقيق لم يُفتح بعد في مهمته الأصلية.');
 }
 return board;
}
export async function readInvestigation(userId:string,id:string){
 const board=await visibleDefinition(userId,id),db=database();
 const [workspace,evidence,links]=await Promise.all([
  db.prepare('SELECT status,decision_json AS decisionJson,created_at AS createdAt,updated_at AS updatedAt,closed_at AS closedAt FROM investigation_workspaces WHERE user_id=? AND investigation_id=?').bind(userId,id).first<WorkspaceRow>(),
  db.prepare('SELECT evidence_id AS evidenceId,reviewed_at AS reviewedAt,collected_at AS collectedAt,classification,note FROM investigation_evidence WHERE user_id=? AND investigation_id=?').bind(userId,id).all<EvidenceRow>(),
  db.prepare('SELECT from_id AS fromId,relation,to_id AS toId,reason,created_at AS createdAt FROM investigation_links WHERE user_id=? AND investigation_id=? ORDER BY created_at').bind(userId,id).all<LinkRow>()
 ]);
 let decision:BoardDecision|null=null;try{if(workspace?.decisionJson)decision=JSON.parse(workspace.decisionJson) as BoardDecision}catch{/* Legacy-invalid drafts remain reopenable. */}
 const {expected:_privateAnswer,allowedLinks:_privateLinks,...visibleBoard}=board;
 const incident=board.sourceKind==='dynamic'?await getDynamicIncident(userId,id.slice(8)):null;
 const v2=incident?.generationVersion===2;
 const defensive=board.sourceKind==='soc'&&isDefensiveId(board.sourceId);
 const publicBoard=defensive||v2?{...visibleBoard,evidence:visibleBoard.evidence.map(e=>({...e,raw:evidence.results.some(saved=>saved.evidenceId===e.id&&saved.reviewedAt)?e.raw:'',role:'unclassified' as const}))}:board.sourceKind==='dynamic'?{...visibleBoard,evidence:visibleBoard.evidence.map(e=>({...e,role:'unclassified' as const}))}:visibleBoard;
 const review=incident&&decision&&(v2?workspace?.status!=='open'&&!!workspace:(!incident.chain||workspace?.status!=='open'))?{explanation:incident.review.explanation,evidence:incident.review.evidence,important:incident.successConditions.requiredEvidenceIds,distractors:incident.distractors,correctLinks:incident.review.links,missedEvidence:incident.successConditions.requiredEvidenceIds.filter(e=>!decision.evidenceIds.includes(e)),missedLinks:incident.review.links.filter(l=>!links.results.some(saved=>saved.fromId===l.fromId&&saved.toId===l.toId&&saved.relation===l.relation))}:null;
 const consequence=incident?.chain&&decision&&workspace?.status!=='open'?chainConsequence(incident.chain.stage,decision):null;
 let needsRecheck=false;if(v2&&decision&&workspace?.status==='open')try{needsRecheck=!validateDecision(board,decision,evidence.results.filter(e=>e.collectedAt).map(e=>e.evidenceId),links.results)||!board.expected.affected.every(id=>decision!.affected.includes(id))}catch{needsRecheck=true}
 const feedback=v2&&needsRecheck?{observation:incident.recheckObservation||'قارن المصادر والسياق المعتمد قبل القرار.',impact:'بقي التحقيق مفتوحًا وأدلته محفوظة. لم يُنفذ احتواء غير مؤيد بالأدلة.'}:incident?.chain&&decision&&workspace?.status==='open'?{observation:decision.hypothesis==='unrelated'?'قارِن الحساب والمصدر والتوقيت بين السجلات. هل تفسر فرضية عدم الترابط هذا التطابق؟':incident.chain.stage===2?'افحص نتيجة المصادقة في سجل الهوية؛ اتصال الشبكة وحده لا يثبت جلسة ناجحة.':decision.action==='monitor'?'حفظ الملاحظة وحده لا يوقف جلسة أو اتصالًا. ما الإجراء المتناسب مع الأدلة التي جمعتها؟':'قارِن نطاق الحساب والجهاز والمصادر التي تسند القرار، ثم تحقق أن علاقاتك موثقة.',impact:'لم يُنفذ إجراء استجابة في المحاكاة. بقي التحقيق مفتوحًا وأدلته محفوظة لإعادة الفحص.'}:null;
 return {...(incident?.chain||v2?{consequence,feedback}:{}),board:publicBoard,workspace:workspace?{status:workspace.status,decision,createdAt:workspace.createdAt,updatedAt:workspace.updatedAt,closedAt:workspace.closedAt}:{status:'open',decision:null,createdAt:null,updatedAt:null,closedAt:null},evidence:evidence.results,links:links.results,incident:incident?{instanceId:incident.instanceId,templateId:incident.templateId,seed:incident.seed,difficulty:incident.difficulty,guidance:incident.guidance,...(v2?{generationVersion:2,objective:incident.objective}:{}),timeline:incident.timeline,events:incident.events,...(incident.chain?{chain:incident.chain}:{} )}:null,review};
}
export function validateDecision(board:BoardDefinition,decision:BoardDecision,collected:string[],links:LinkRow[]){
 if(!board.hypotheses.some(h=>h.id===decision.hypothesis)||!board.actions.some(a=>a.id===decision.action))throw Error('اختر استنتاجًا وإجراءً من القائمة.');
 if(!Array.isArray(decision.affected)||decision.affected.length<1||decision.affected.length>8||decision.affected.some(id=>!board.nodes.some(n=>n.id===id&&['account','device','server','employee'].includes(n.kind))))throw Error('حدد حسابًا أو أصلًا متأثرًا من الكيانات المتاحة.');
 if(!Array.isArray(decision.evidenceIds)||decision.evidenceIds.length<1||decision.evidenceIds.length>board.evidence.length||new Set(decision.evidenceIds).size!==decision.evidenceIds.length||decision.evidenceIds.some(id=>!collected.includes(id)))throw Error('استند إلى أدلة جمعتها بالفعل.');
 if(board.evidence.some(e=>e.role==='required'&&!collected.includes(e.id)))throw Error('اجمع الأدلة المطلوبة قبل القرار.');
 if(!decision.evidenceIds.some(id=>board.evidence.some(e=>e.id===id&&e.role==='required')))throw Error('اختر دليلًا مطلوبًا لدعم الاستنتاج.');
 if(decision.evidenceIds.some(id=>board.evidence.some(e=>e.id===id&&e.role==='distractor')))throw Error('راجع الأدلة غير المرتبطة قبل اعتمادها أساسًا للاستنتاج.');
 if(links.length<1)throw Error('اربط كيانين مع توضيح سبب العلاقة قبل القرار.');
 const correlation=(!board.expected.requiredEvidenceIds||board.expected.requiredEvidenceIds.every(id=>decision.evidenceIds.includes(id)))&&(!board.expected.requiredLinks||board.expected.requiredLinks.every(l=>links.some(saved=>saved.fromId===l.fromId&&saved.toId===l.toId&&saved.relation===l.relation)));
 return correlation&&decision.hypothesis===board.expected.hypothesis&&board.expected.actions.includes(decision.action)&&decision.affected.some(id=>board.expected.affected.includes(id))&&(board.sourceKind!=='dynamic'||decision.affected.every(id=>board.expected.affected.includes(id)));
}
export async function writeInvestigation(userId:string,id:string,input:BoardAction){
 const board=await visibleDefinition(userId,id),db=database(),now=new Date().toISOString();
 if(board.sourceKind==='soc'&&isDefensiveId(board.sourceId)&&input.action==='decide')throw Error('أكمل الاستجابة والتحقق والتقرير في التنبيه قبل إغلاق اللوحة.');
 const current=await readInvestigation(userId,id);
 if(input.action==='reopen'){
  if(current.workspace.status==='open')throw Error('التحقيق مفتوح بالفعل.');
  await db.prepare("UPDATE investigation_workspaces SET status='open',closed_at=NULL,updated_at=? WHERE user_id=? AND investigation_id=?").bind(now,userId,id).run();
  return {...await readInvestigation(userId,id),message:'أُعيد فتح لوحة التحقيق مع الاحتفاظ بالأدلة والروابط، دون مكافآت جديدة.'};
 }
 if(current.workspace.status!=='open')throw Error('افتح التحقيق مجددًا قبل تعديل اللوحة.');
 await db.prepare("INSERT OR IGNORE INTO investigation_workspaces(user_id,investigation_id,status,created_at,updated_at) VALUES(?,?,'open',?,?)").bind(userId,id,now,now).run();
 let message='حُفظت خطوة التحقيق.';
 if(input.action==='review'||input.action==='collect'){
  if(!board.evidence.some(e=>e.id===input.evidenceId))throw Error('الدليل غير موجود.');
  if(input.action==='collect'&&!current.evidence.some(e=>e.evidenceId===input.evidenceId&&e.reviewedAt))throw Error('راجع الدليل قبل جمعه.');
  if(input.action==='review')await db.prepare('INSERT INTO investigation_evidence(user_id,investigation_id,evidence_id,reviewed_at) VALUES(?,?,?,?) ON CONFLICT(user_id,investigation_id,evidence_id) DO UPDATE SET reviewed_at=COALESCE(investigation_evidence.reviewed_at,excluded.reviewed_at)').bind(userId,id,input.evidenceId,now).run();
  else await db.prepare('INSERT INTO investigation_evidence(user_id,investigation_id,evidence_id,reviewed_at,collected_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,investigation_id,evidence_id) DO UPDATE SET collected_at=COALESCE(investigation_evidence.collected_at,excluded.collected_at)').bind(userId,id,input.evidenceId,now,now).run();
  message=input.action==='collect'?'أُضيف الدليل إلى الخزانة مرة واحدة.':'سُجلت مراجعة الدليل.';
 }else if(input.action==='annotate'){
  if(!board.evidence.some(e=>e.id===input.evidenceId)||!current.evidence.some(e=>e.evidenceId===input.evidenceId&&e.reviewedAt))throw Error('راجع الدليل قبل إضافة ملاحظة.');
  if(typeof input.note!=='string'||input.note.length>1200||!['relevant','uncertain','irrelevant'].includes(input.classification))throw Error('الملاحظة أو التصنيف غير صالح.');
  await db.prepare('UPDATE investigation_evidence SET note=?,classification=? WHERE user_id=? AND investigation_id=? AND evidence_id=?').bind(input.note.trim(),input.classification,userId,id,input.evidenceId).run();
  message='حُفظ تصنيفك وملاحظتك؛ بقي الدليل الخام كما هو.';
 }else if(input.action==='link'||input.action==='unlink'){
  if(!relationshipTypes.includes(input.relation)||!validRelationship(board,input.fromId,input.relation,input.toId))throw Error('العلاقة بين هذين العنصرين غير صالحة.');
  for(const nodeId of [input.fromId,input.toId])if(nodeId.startsWith('evidence:')&&!current.evidence.some(e=>e.evidenceId===nodeId.slice(9)&&e.collectedAt))throw Error('اجمع الدليل قبل ربطه باللوحة.');
  if(input.action==='link'){
   if(typeof input.reason!=='string'||input.reason.trim().length<8||input.reason.length>400)throw Error('اشرح سبب الربط في 8 أحرف على الأقل.');
   await db.prepare('INSERT OR IGNORE INTO investigation_links(user_id,investigation_id,from_id,relation,to_id,reason,created_at) VALUES(?,?,?,?,?,?,?)').bind(userId,id,input.fromId,input.relation,input.toId,input.reason.trim(),now).run();message='حُفظت العلاقة وسببها مرة واحدة.';
  }else{await db.prepare('DELETE FROM investigation_links WHERE user_id=? AND investigation_id=? AND from_id=? AND relation=? AND to_id=?').bind(userId,id,input.fromId,input.relation,input.toId).run();message='أُزيلت العلاقة.'}
 }else if(input.action==='decide'){
  const collected=current.evidence.filter(e=>e.collectedAt).map(e=>e.evidenceId);
  const incident=board.sourceKind==='dynamic'?await getDynamicIncident(userId,id.slice(8)):null;
  let valid=false;try{valid=validateDecision(board,input.decision,collected,current.links)}catch(e){if(incident?.generationVersion===2)throw Error('راجع الأدلة المحفوظة وعلاقاتها قبل اعتماد الاستنتاج.');throw e}
  const correct=valid&&(!(incident?.chain||incident?.generationVersion===2)||board.expected.affected.every(entity=>input.decision.affected.includes(entity)));
  const status=correct?(input.decision.action==='contain'?'contained':input.decision.action==='escalate'?'escalated':'closed'):'open';
  await db.prepare('UPDATE investigation_workspaces SET status=?,decision_json=?,closed_at=?,updated_at=? WHERE user_id=? AND investigation_id=?'+(incident?.generationVersion===2?" AND status='open'":'')).bind(status,JSON.stringify(input.decision),correct?now:null,now,userId,id).run();
  message=correct?'سُجل الاستنتاج والإجراء. هذه اللوحة لا تمنح XP إضافيًا.':'حُفظ القرار للمراجعة. قارن الاستنتاج بالأدلة قبل إغلاق اللوحة.';
 }
 await db.prepare('UPDATE investigation_workspaces SET updated_at=? WHERE user_id=? AND investigation_id=?').bind(now,userId,id).run();
 return {...await readInvestigation(userId,id),message};
}
