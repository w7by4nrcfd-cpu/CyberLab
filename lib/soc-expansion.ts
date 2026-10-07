import {socAlertById,type Verdict} from './soc-alerts';
import type {BoardDefinition,BoardEvidence,BoardLink,BoardNode,BoardDecision} from './investigation-board';
import type {SocAction,SocSession} from './soc-engine';

// Presentation/response adapters for existing alerts, not another incident or reward engine.
import {defensiveIds,defensivePhases,responsePlans,isDefensiveId,type DefensivePhase} from './soc-expansion-ui';
export {defensiveIds,defensivePhases,responsePlans,isDefensiveId,defensiveHref,defensiveReturnPath} from './soc-expansion-ui';
export type DefensiveState={phase:DefensivePhase;feedback:string;assessment:BoardDecision|null;plan:string|null;checks:string[];verified:boolean;report:string|null};
export const freshDefensiveState=():DefensiveState=>({phase:'triage',feedback:'',assessment:null,plan:null,checks:[],verified:false,report:null});
const n=(id:string,kind:BoardNode['kind'],label:string,companyRef?:BoardNode['companyRef']):BoardNode=>({id,kind,label,...(companyRef?{companyRef}:{})});
const link=(fromId:string,relation:BoardLink['relation'],toId:string):BoardLink=>({fromId,relation,toId});
const tpLinks=[link('account:maya','LOGGED_IN_TO','server:APP-02'),link('process:agent','OBSERVED_IN','evidence:process'),link('process:agent','CONNECTED_TO','ip:203.0.113.86')];
const fpLinks=[link('process:inventory','OBSERVED_IN','evidence:task'),link('process:inventory','RELATED_TO','evidence:change'),link('server:APP-01','CONNECTED_TO','ip:192.0.2.22')];
function evidence(alertId:string,id:string,key:string,role:BoardEvidence['role'],entities:string[]):BoardEvidence{
 const alert=socAlertById(alertId)!,e=alert.evidence.find(e=>e.id===id)!;
 return {id:key,type:e.kind==='network'?'network':e.kind==='auth'?'account':e.kind==='endpoint'?'process':e.kind==='file'?'file':'log',title:e.title,source:`${alertId} · ${e.kind}`,timestamp:alert.timestamp.slice(0,11)+e.time+':00Z',raw:e.content,role,entities};
}
export const defensiveBoards:BoardDefinition[]=[{
 id:'soc-SOC-004',sourceKind:'soc',sourceId:'SOC-004',sourceHref:'/soc/alerts/SOC-004?view=defensive',title:'تحقيق نشاط خادم التطبيق',subtitle:'قارِن سجلات الهوية والجهاز والشبكة.',
 nodes:[n('employee:maya','employee','مها عادل',{kind:'employee',id:'maya'}),n('account:maya','account','maya',{kind:'account',id:'maya'}),n('server:APP-02','server','APP-02',{kind:'device',id:'APP-02'}),n('process:agent','process','/tmp/agent-update.bin'),n('ip:203.0.113.86','ip','203.0.113.86'),n('file:agent','file','agent-update.bin'),n('alert:SOC-004','alert','SOC-004'),n('alert:SOC-005','alert','SOC-005')],
 evidence:[evidence('SOC-004','hash','hash','required',['file:agent','alert:SOC-004']),evidence('SOC-004','process','process','required',['account:maya','server:APP-02','process:agent']),evidence('SOC-004','auth','auth','required',['account:maya','server:APP-02','ip:203.0.113.86']),evidence('SOC-005','flow','flow','required',['server:APP-02','ip:203.0.113.86','alert:SOC-005']),evidence('SOC-005','process','socket','required',['process:agent','ip:203.0.113.86']),evidence('SOC-005','file','file','distractor',['server:APP-02'])],
 hypotheses:[{id:'incident',label:'نشاط غير مصرح به مرتبط بحساب وعملية واتصال'},{id:'quarantine-only',label:'حجر الملف أنهى جميع آثار النشاط'},{id:'exfiltration',label:'ثبت تسريب محتوى الملفات من حجم التدفق وحده'},{id:'approved',label:'تشغيل معتمد لا يحتاج استجابة'}],actions:[{id:'contain',label:'احتواء الحساب والخادم مع حفظ الأدلة'}],expected:{hypothesis:'incident',actions:['contain'],affected:['account:maya','server:APP-02'],requiredEvidenceIds:['hash','process','auth','flow','socket'],requiredLinks:tpLinks},allowedLinks:[...tpLinks,link('employee:maya','USES','account:maya'),link('file:agent','OBSERVED_IN','evidence:hash'),link('server:APP-02','OBSERVED_IN','alert:SOC-004'),link('account:maya','OBSERVED_IN','evidence:auth'),link('server:APP-02','OBSERVED_IN','evidence:flow')]
},{
 id:'soc-SOC-010',sourceKind:'soc',sourceId:'SOC-010',sourceHref:'/soc/alerts/SOC-010?view=defensive',title:'تحقيق مهمة مجدولة',subtitle:'قارِن التنفيذ والتغيير المعتمد والوجهة.',
 nodes:[n('server:APP-01','server','APP-01',{kind:'device',id:'APP-01'}),n('process:inventory','process','inventory-check'),n('file:inventory','file','/opt/nexa/inventory-check.sh'),n('ip:192.0.2.22','ip','192.0.2.22'),n('alert:SOC-010','alert','SOC-010')],
 evidence:[evidence('SOC-010','task','task','required',['process:inventory','file:inventory','server:APP-01']),evidence('SOC-010','change','change','required',['process:inventory']),evidence('SOC-010','network','network','required',['server:APP-01','ip:192.0.2.22'])],
 hypotheses:[{id:'approved',label:'تشغيل معتمد تؤيده هوية الملف والتغيير والوجهة'},{id:'incident',label:'تشغيل ليلي يكفي لإثبات اختراق'},{id:'uncertain',label:'الأدلة غير كافية للحسم'}],actions:[{id:'dismiss',label:'إغلاق التنبيه المحدد مع إبقاء المراقبة'}],expected:{hypothesis:'approved',actions:['dismiss'],affected:['server:APP-01'],requiredEvidenceIds:['task','change','network'],requiredLinks:fpLinks},allowedLinks:[...fpLinks,link('file:inventory','OBSERVED_IN','evidence:task'),link('server:APP-01','OBSERVED_IN','evidence:network'),link('server:APP-01','OBSERVED_IN','alert:SOC-010')]
}].map(b=>({...b,nodes:[...b.nodes,...b.evidence.map(e=>n('evidence:'+e.id,'evidence',e.title))]})) as BoardDefinition[];
export const defensiveBoard=(id:string)=>defensiveBoards.find(b=>b.sourceId===id);
export function responseObservations(id:string,plan:string){
 if(id==='SOC-004'){
  const complete=plan==='complete';
  return [{id:'network',label:'الشبكة بعد الاستجابة',raw:complete?'APP-02 → 203.0.113.86: blocked · no repeat connection in the observation window':plan==='disable'?'Task monitoring disabled · network connections remain observable and repeated':'APP-02 → 203.0.113.86: repeated connection remains · host not isolated'},
   {id:'identity',label:'الجلسة وحفظ الأدلة',raw:complete?'maya session on APP-02: revoked · process stopped · logs preserved · no new session in the observation window':plan==='file-only'?'File quarantined · maya session on APP-02: active · containment incomplete':plan==='scoped-close'?'Alert marked closed in simulation · maya session on APP-02: active · no containment applied':'Task stopped in simulation · maya session on APP-02: active · host not isolated'}];
 }
 const scoped=plan==='scoped-close';
 return [{id:'service',label:'الخدمة بعد الاستجابة',raw:scoped?'inventory-check: completed · signed script matches CHG-170 · internal inventory received':plan==='complete'?'APP-01 isolated · approved inventory job interrupted · inventory update missing':plan==='file-only'?'Signed approved script quarantined · scheduled inventory cannot complete':'Approved inventory job interrupted · inventory update missing'},
  {id:'monitoring',label:'المراقبة بعد الاستجابة',raw:scoped?'Only SOC-010 closed · alert monitoring remains enabled · no new external connection in the observation window':plan==='disable'?'Task monitoring disabled · later task activity not observable':'Monitoring remains enabled · no new external connection in the observation window · approved service disrupted'}];
}
export const defensiveVerdict=(id:string):Verdict=>id==='SOC-004'?'true_positive':'false_positive';
export function applyDefensiveAction(id:string,s:SocSession,a:SocAction,correlated:boolean){
 const d:DefensiveState={...(s.defensive||freshDefensiveState()),checks:[...(s.defensive?.checks||[])]};s.defensive=d;
 const requirePhase=(...phases:DefensivePhase[])=>{if(!phases.includes(d.phase))throw Error('أكمل المرحلة الحالية قبل هذا الإجراء.');};
 if(a.action==='defensive'){if(!s.defensiveStarted){s.defensiveStarted=true;d.phase=s.priority?'evidence':'triage';}return 'استُعيد مسار الاستجابة.';}
 if(a.action==='assess'){
  requirePhase('evidence','correlate','assess','respond');if(!s.priority)throw Error('أكمل الفرز أولًا.');
  if(!a.decision)throw Error('اختر التقييم والأصول والأدلة.');
  d.feedback='';d.verified=false;d.report=null;d.plan=null;d.checks=[];
  if(!correlated){d.assessment=null;d.phase='evidence';d.feedback=id==='SOC-004'?'قارِن وقت العملية بوقت التدفق وحالة الجلسة. الحجر أو حجم الاتصال وحدهما لا يثبتان انتهاء الحادث أو تسريب الملفات.':'قارِن التوقيت بتذكرة التغيير والتوقيع والوجهة. التشغيل الليلي وحده لا يثبت اختراقًا.';return 'بقي التحقيق مفتوحًا لإعادة الفحص.';}
  d.assessment=a.decision;d.phase='respond';s.verdict=defensiveVerdict(id);s.conclusion=id==='SOC-004'?'ارتبط تشغيل غير مصرح به على APP-02 بحساب maya وتدفق خارجي؛ لا يثبت حجم التدفق محتوى مسرّبًا.':'تطابق تنفيذ inventory-check مع التغيير المعتمد والتوقيع والوجهة الداخلية؛ التنبيه إنذار كاذب.';return 'سُجل التقييم المستند إلى عدة مصادر.';
 }
 if(a.action==='response-test'){
  requirePhase('respond','verify');if(!d.assessment)throw Error('أكمل تقييم الأدلة أولًا.');
  const plan=responsePlans.find(p=>p.id===a.plan);if(!plan)throw Error('إجراء الاستجابة غير صالح.');
  d.plan=plan.id;d.checks=[];d.verified=false;d.report=null;d.phase='verify';d.feedback='';s.response=plan.response;s.responseReason=plan.label+' داخل المحاكاة مع مراجعة أثر الإجراء.';return 'نُفذت الاستجابة في المحاكاة. افحص أثرها.';
 }
 if(a.action==='verify'){
  requirePhase('verify');const observations=responseObservations(id,d.plan!);
  if(!Array.isArray(a.checks)||a.checks.length!==2||new Set(a.checks).size!==2||a.checks.some(c=>!observations.some(o=>o.id===c)))throw Error('افحص نتيجتي الاستجابة قبل التحقق.');
  if(!['effective','incomplete'].includes(a.verification||''))throw Error('نتيجة التحقق غير صالحة.');
  d.checks=[...a.checks];const effective=id==='SOC-004'?d.plan==='complete':d.plan==='scoped-close';
  if(!effective||a.verification!=='effective'){d.phase='respond';d.feedback=id==='SOC-004'?'نتيجة الشبكة والجلسة لا تتفق مع اعتبار الاستجابة كافية. راجع نطاق الإجراء ثم اختبره مجددًا.':'قارِن اكتمال خدمة الجرد ببقاء المراقبة. هل توقف التنبيه على حساب العمل المشروع أو القدرة على رصد نشاط لاحق؟';return 'لم يُغلق التحقيق؛ راجع الاستجابة.';}
  d.verified=true;d.phase='report';d.feedback='';return 'تحققت الاستجابة ضمن نافذة الرصد؛ لا تعني ضمان عدم تكرار حادث لاحق.';
 }
 if(a.action==='report'){
  requirePhase('report');if(!d.verified||!d.assessment)throw Error('تحقق من الاستجابة قبل التقرير.');
  if(!['follow-up','baseline'].includes(a.reportNext||'')||(id==='SOC-004'?a.reportNext!=='follow-up':a.reportNext!=='baseline'))throw Error('راجع الخطوة التالية المتناسبة مع نتيجة التحقيق.');
  d.report=a.reportNext!;s.caseNote={observation:s.conclusion,evidenceRefs:s.collected,assessment:id==='SOC-004'?'حادث مثبت ضمن APP-02 وحساب maya؛ يحتاج متابعة السبب الجذري.':'تطابق عدة مصادر يدعم إغلاق التنبيه كإنذار كاذب.',actionTaken:s.response,owner:'فريق الأمن في NexaCorp',nextStep:a.reportNext==='follow-up'?'متابعة السبب الجذري ومراجعة حساب maya قبل إعادة الخدمة.':'إبقاء المراقبة ومراجعة تطابق الجدول والتوقيع في التشغيل التالي.'};return 'حُفظ التقرير؛ يمكن إغلاق التحقيق.';
 }
 throw Error('الإجراء غير صالح لمسار الاستجابة.');
}
