import {applyDefensiveAction,type DefensiveState} from './soc-expansion';
import type {BoardDecision} from './investigation-board';
import type {SocAlert,Severity,Verdict,ResponseAction} from './soc-alerts';
export type SocCaseNote={observation:string;evidenceRefs:string[];assessment:string;actionTaken:ResponseAction|null;owner:string;nextStep:string};
export type SocAction={id:string;action:'start'|'triage'|'inspect'|'collect'|'tool'|'decide'|'respond'|'document'|'close'|'reopen'|'defensive'|'assess'|'response-test'|'verify'|'report';priority?:Severity;reason?:string;evidenceId?:string;toolId?:string;verdict?:Verdict;response?:ResponseAction;conclusion?:string;caseNote?:SocCaseNote;decision?:BoardDecision;plan?:string;checks?:string[];verification?:string;reportNext?:string};
export type SocSession={defensive?:DefensiveState;defensiveStarted?:boolean;priority:Severity|null;triageReason:string;inspected:string[];collected:string[];usedTools:string[];transcript:{toolId:string;output:string}[];verdict:Verdict|null;conclusion:string;response:ResponseAction|null;responseReason:string;caseNote?:SocCaseNote;prematureDecisions:number;timeline:{time:string;label:string}[];lastResult:SocResult|null};
export type SocResult={score:number;correct:boolean;skillAwardEligible:boolean;skillAwardGranted?:boolean;feedback:string[];missingEvidence:string[];classificationCorrect:boolean;responseCorrect:boolean;priorityCorrect:boolean;documentation?:{met:string[];missing:string[]};};
export const SOC_STATUSES=['New','Investigating','Escalated','Resolved','False Positive'] as const;
export type SocStatus=typeof SOC_STATUSES[number];
export const SOC_SEVERITIES=['Low','Medium','High','Critical'] as const;
export const SOC_VERDICTS=['true_positive','false_positive','benign_suspicious'] as const;
export const SOC_RESPONSES=['contain','escalate','monitor','dismiss'] as const;
export function freshSocSession():SocSession{return {priority:null,triageReason:'',inspected:[],collected:[],usedTools:[],transcript:[],verdict:null,conclusion:'',response:null,responseReason:'',prematureDecisions:0,timeline:[],lastResult:null}}
function field(value:unknown,min:number,max:number,label:string){if(typeof value!=='string'||value.trim().length<min||value.length>max)throw Error(label+' يجب أن يحتوي على '+min+' أحرف على الأقل وبحد أقصى '+max+'.');return value.trim()}
function log(s:SocSession,label:string){s.timeline=[...s.timeline,{time:new Date().toISOString(),label}].slice(-90)}
export function evaluateSoc(alert:SocAlert,s:SocSession):SocResult{
 const missingEvidence=alert.requiredEvidence.filter(id=>!s.collected.includes(id));
 const classificationCorrect=s.verdict===alert.truth,responseCorrect=!!s.response&&alert.responses.includes(s.response),priorityCorrect=s.priority===alert.severity;
 const note=s.caseNote;
 const checks:[string,boolean][]=[['الملاحظة',!!note?.observation&&note.observation.length>=15],['مراجع الأدلة',!!note?.evidenceRefs.length&&note.evidenceRefs.every(id=>s.collected.includes(id))],['التقييم',!!note?.assessment&&note.assessment.length>=15],['الإجراء',!!note?.actionTaken&&note.actionTaken===s.response],['المسؤول',!!note?.owner&&note.owner.length>=3],['الخطوة التالية',!!note?.nextStep&&note.nextStep.length>=12]];
 const documentation={met:checks.filter(([,ok])=>ok).map(([label])=>label),missing:checks.filter(([,ok])=>!ok).map(([label])=>label)};
 let score=100-(classificationCorrect?0:35)-(responseCorrect?0:20)-(priorityCorrect?0:8)-Math.min(32,missingEvidence.length*16)-(s.usedTools.length?0:10)-Math.min(30,s.prematureDecisions*15)-documentation.missing.length*4;
 score=Math.max(0,score);
 const feedback:string[]=[];
 feedback.push(classificationCorrect?'تصنيفك متسق مع الأدلة.':'أعد مقارنة نوع التنبيه بالأدلة؛ '+alert.feedback);
 feedback.push(missingEvidence.length?'لم تُضف إلى ملف التحقيق أدلة كافية: '+missingEvidence.map(id=>alert.evidence.find(e=>e.id===id)?.title||id).join('، ')+'.':'جمعت المؤشرات الحاسمة قبل إغلاق التنبيه.');
 if(s.prematureDecisions)feedback.push('سجلت قرارًا قبل جمع المؤشرات المطلوبة. دوّن فرضيتك أولًا ثم تحقق من السجلات.');
 if(!responseCorrect)feedback.push('إجراء الاستجابة لا يناسب هذا النوع من الأحداث. '+alert.feedback);
 if(!priorityCorrect)feedback.push('راجع تقدير الأولوية: التدريب يضع هذا التنبيه ضمن '+alert.severity+'.');
 if(!s.usedTools.length)feedback.push('استخدم أداة فحص واحدة على الأقل لتقوية الاستنتاج.');
 feedback.push(documentation.missing.length?'التوثيق يحتاج: '+documentation.missing.join('، ')+'. الطول وحده لا يعوض غياب الأدلة والخطوة التالية.':'ملاحظة القضية تربط الملاحظة بالدليل والتقييم والإجراء والمسؤول والخطوة التالية.');
 if(classificationCorrect&&responseCorrect)feedback.push(alert.feedback);
 const skillAwardEligible=classificationCorrect&&responseCorrect&&missingEvidence.length===0&&s.usedTools.length>0&&s.prematureDecisions===0&&score>=70;
 return {score,correct:classificationCorrect&&responseCorrect,skillAwardEligible,feedback,missingEvidence,classificationCorrect,responseCorrect,priorityCorrect,documentation};
}
export function applySocAction(alert:SocAlert,prior:SocSession,action:SocAction,correlated=false){
 const s:SocSession={...prior,inspected:[...prior.inspected],collected:[...prior.collected],usedTools:[...prior.usedTools],transcript:[...prior.transcript],timeline:[...prior.timeline]};
 let status:SocStatus='Investigating',result:SocResult|null=null,message='حُفظت خطوة التحقيق.';
 if(action.action==='start')return {session:s,status,message:'استُعيد ملف التنبيه.',result};
 if(action.action==='reopen')return {session:freshSocSession(),status,message:'بدأت محاولة تحقيق جديدة. ملاحظاتك السابقة محفوظة.',result};
 if(['defensive','assess','response-test','verify','report'].includes(action.action)){
  message=applyDefensiveAction(alert.id,s,action,correlated);log(s,({defensive:'فتح مسار الاستجابة',assess:'مراجعة التقييم بالأدلة', 'response-test':'اختبار الاستجابة في المحاكاة',verify:'فحص أثر الاستجابة',report:'حفظ خلاصة التحقيق'} as Record<string,string>)[action.action]);
  if(action.action==='assess'&&s.defensive&&!correlated&&s.priority!==alert.severity){s.defensive.phase='triage';s.defensive.feedback='راجع أولوية الفرز في ضوء حساسية الأصل ونطاق النشاط؛ الأدلة محفوظة.';}
  if(action.action==='assess'&&s.defensive&&!s.usedTools.length)s.defensive.feedback='افحص نتيجة أداة محاكاة قبل التقييم؛ الأدلة والروابط محفوظة.';return {session:s,status,message,result};
 }
 if(s.defensive&&['decide','respond','document'].includes(action.action))throw Error('استخدم التقييم والاستجابة والتحقق داخل مسار التحقيق الحالي.');
 if(action.action==='triage'){
  if(!SOC_SEVERITIES.includes(action.priority as Severity))throw Error('الأولوية غير صالحة.');
  if(s.defensive&&s.defensive.phase!=='triage')throw Error('الفرز محفوظ؛ أكمل التحقيق الحالي.');
  if(s.defensive)s.defensive={...s.defensive,phase:'evidence'};
  s.priority=action.priority!;s.triageReason=field(action.reason,12,500,'مبرر الفرز');log(s,'فرز التنبيه بأولوية '+s.priority);message='سُجل الفرز والأولوية.';
 }else if(action.action==='inspect'){
  const evidence=alert.evidence.find(e=>e.id===action.evidenceId);if(!evidence)throw Error('الدليل غير موجود.');
  if(!s.inspected.includes(evidence.id)){s.inspected.push(evidence.id);log(s,'فحص '+evidence.title)}message='فُتح الدليل '+evidence.title+'.';
 }else if(action.action==='collect'){
  if(!s.inspected.includes(action.evidenceId||''))throw Error('افحص الدليل قبل إضافته للقضية.');
  if(!s.collected.includes(action.evidenceId!)){s.collected.push(action.evidenceId!);log(s,'جمع '+alert.evidence.find(e=>e.id===action.evidenceId)!.title)}message='أُضيف الدليل إلى التحقيق.';
 }else if(action.action==='tool'){
  const tool=alert.tools.find(t=>t.id===action.toolId);if(!tool)throw Error('أداة غير متاحة.');
  if(!s.usedTools.includes(tool.id))s.usedTools.push(tool.id);
  s.transcript=[...s.transcript,{toolId:tool.id,output:tool.output}].slice(-20);log(s,'استخدام '+tool.label);message='ظهرت نتيجة الأداة المحاكية.';
 }else if(action.action==='decide'){
  if(!s.priority)throw Error('فرز التنبيه أولًا.');
  if(!SOC_VERDICTS.includes(action.verdict as Verdict))throw Error('التصنيف غير صالح.');
  const conclusion=field(action.conclusion,20,1000,'الاستنتاج');
  if(alert.requiredEvidence.some(id=>!s.collected.includes(id)))s.prematureDecisions=Math.min(2,s.prematureDecisions+1);
  s.verdict=action.verdict!;s.conclusion=conclusion;s.response=null;s.responseReason='';log(s,'تسجيل فرضية التحقيق');message='سُجل الاستنتاج. راجع أدلتك قبل الإغلاق.';
 }else if(action.action==='respond'){
  if(!s.verdict)throw Error('سجل استنتاجك أولًا.');
  if(!SOC_RESPONSES.includes(action.response as ResponseAction))throw Error('إجراء غير صالح.');
  s.response=action.response!;s.responseReason=field(action.reason,20,800,'سبب الإجراء');log(s,'قرار الاستجابة: '+s.response);status=s.response==='escalate'?'Escalated':'Investigating';message='سُجل إجراء الاستجابة.';
 }else if(action.action==='document'){
  if(!s.response)throw Error('سجّل قرار الاستجابة قبل توثيق القضية.');
  const input=action.caseNote;
  if(!input||typeof input!=='object'||!Array.isArray(input.evidenceRefs)||input.evidenceRefs.length>15||input.evidenceRefs.some(id=>typeof id!=='string'||!s.collected.includes(id))||!SOC_RESPONSES.includes(input.actionTaken as ResponseAction))throw Error('افحص الأدلة المجموعة ثم اختر مراجع وإجراء صالحين.');
  s.caseNote={observation:field(input.observation,15,500,'الملاحظة'),evidenceRefs:[...new Set(input.evidenceRefs)],assessment:field(input.assessment,15,500,'التقييم'),actionTaken:input.actionTaken,owner:field(input.owner,3,100,'المسؤول'),nextStep:field(input.nextStep,12,500,'الخطوة التالية')};
  log(s,'حفظ ملاحظة قضية منظمة');message='حُفظت ملاحظة القضية داخل التحقيق؛ سيقيّم المعيار علاقتها بالأدلة والاستجابة.';
 }else if(action.action==='close'){
  if(!s.priority||!s.verdict||!s.response||!s.inspected.length)throw Error('أكمل الفرز، وافحص دليلًا، وسجل الاستنتاج والاستجابة قبل الإغلاق.');
  if(s.defensive&&(!s.defensive.verified||!s.defensive.report||!correlated))throw Error('أكمل ربط الأدلة والاستجابة والتحقق والتقرير قبل الإغلاق.');
  result=evaluateSoc(alert,s);if(s.defensive)s.defensive={...s.defensive,phase:'result'};s.lastResult=result;
  status=s.verdict==='false_positive'?'False Positive':s.response==='escalate'?'Escalated':'Resolved';log(s,'إغلاق التنبيه بنتيجة '+result.score+'/100');message='أُغلق التنبيه، وظهر تقييم التحقيق.';
 }else throw Error('الإجراء غير صالح.');
 return {session:s,status,message,result};
}
