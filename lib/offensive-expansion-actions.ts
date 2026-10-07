// Shared checks called by the existing assessment adapters. State stays in LabSession.
import {offensiveCases,freshOffensiveExtension,type OffensiveCaseId} from './offensive-expansion';
import {freshAssessment} from './offensive-pilot';
import {freshMinimum} from './offensive-minimum';
import type {LabSession,LabAction} from './interactive-lab-engine';
const grading={
 'v2-attack-surface':{required:['policy','external','internal'],finding:'config',impact:'metadata',fix:'restrict',retestIds:['external','internal','portal'],retestStatuses:[403,200,200]},
 'v2-access-control':{required:['own','guest','other'],finding:'read',impact:'confidentiality',fix:'server',retestIds:['own','guest','other'],retestStatuses:[200,401,403]},
 'v2-auth-session':{required:['old','current','anonymous'],finding:'revocation',impact:'continued',fix:'revoke',retestIds:['old','current','anonymous'],retestStatuses:[401,200,401]}
};
export function expansionAction(id:OffensiveCaseId,s:LabSession,action:LabAction):string|null {
 const c={...offensiveCases[id],...grading[id]},access=id==='v2-access-control';
 if((s.offensive||action.action==='assessment-upgrade')&&['url','ip','domain','target','input','credentials','path','host','user','owner','method'].some(k=>k in action))throw Error('لا تقبل المحاكاة هدفًا أو بيانات دخول أو طلبًا حرًا؛ اختر حالة معتمدة فقط.');
 if(action.action==='assessment-upgrade'){
  const current=access?s.assessment:s.minimum;
  if(s.offensive)throw Error('التقييم الموسّع محفوظ بالفعل.');
  if(current?.authorized&&!s.lastResult?.passed)throw Error('أكمل المحاولة السابقة أولًا؛ خطواتها محفوظة.');
  if(s.lastResult?.passed&&action.accepted!==true)throw Error('أكد بدء إعادة تقييم دون مكافأة جديدة.');
  s.offensive=freshOffensiveExtension();if(access)s.assessment=freshAssessment();else s.minimum=freshMinimum();
  s.visited=[];s.evidence=[];s.lastResult=null;s.mistakes=0;s.hintsUsed=0;s.attempts??=0;
  return 'استُعيد تكليف التقييم؛ حدد الأصول داخل النطاق.';
 }
 const e=s.offensive;if(!e)return null;
 const p=(access?s.assessment:s.minimum)!;
 const fail=(msg:string)=>{p.feedback=msg;s.mistakes++;return msg};
 if(['scope-check','mark','finding-report'].includes(action.action)&&s.lastResult?.passed)throw Error('أعد فتح التقييم قبل محاولة جديدة.');
 if(action.action==='scope-check'){
  if(!['scope','authorize'].includes(p.step)||p.authorized)throw Error('راجع التفويض قبل تحديد النطاق.');
  const keys=action.scope;
  if(!Array.isArray(keys)||keys.some(k=>typeof k!=='string')||new Set(keys).size!==keys.length||keys.length>4)throw Error('حدد نطاقًا صالحًا دون تكرار.');
  const candidates=[...c.scope,'WEB-01'];if(keys.some(k=>!candidates.includes(k)))throw Error('أصل خارج بيئة التدريب.');
  e.scope=keys;e.scopeApproved=keys.length===c.scope.length&&c.scope.every(k=>keys.includes(k));
  if(!e.scopeApproved)return fail(keys.includes('WEB-01')?'تفويضك يخص الأصول التدريبية. WEB-01 بوابة الشركة وليست هدفًا لهذا التكليف؛ أعد تحديد النطاق.':'لم تشمل كل الأصول المحددة في التكليف. قارِن اختيارك بسجل التفويض.');
  p.feedback='';return 'حُدد النطاق. لا يتيح هذا التفويض اختبار أي أصل آخر.';
 }
 if(action.action==='authorize'&&!e.scopeApproved)throw Error('حدد الأصول المصرح بها قبل بدء التقييم.');
 if(action.action==='mark'){
  if(!p.authorized||!['observe','test','validate','impact'].includes(p.step))throw Error('افحص الطلب داخل النطاق قبل جمع الدليل.');
  const key=String(action.key||'');if(!p.observations.some(t=>t.id===key))throw Error('اجمع دليلًا شاهدته بالفعل.');
  if(!e.collected.includes(key))e.collected.push(key);s.evidence=[...e.collected];return 'حُفظ الدليل في التقييم نفسه دون تعديل بياناته الخام.';
 }
 if(action.action==='report'){
  if(p.step!=='impact')throw Error('أكمل التحقق قبل تقييم الأثر.');
  const r=action.report as {evidence:string[];asset?:string};
  if(!r||!Array.isArray(r.evidence)||r.evidence.some(key=>!e.collected.includes(key)))throw Error('استند إلى أدلة جمعتها بالفعل.');
  if(r.asset!==c.affected) return fail('راجع الأصل في الطلبات والردود التي أثبتت السلوك؛ لا تنسب الأثر إلى نظام لم تختبره.');
  e.affectedAsset=r.asset;
 }
 if(action.action==='patch'){e.reportReady=false;e.retestVerdict='';}
 if(action.action==='finding-report'){
  if(p.step!=='remediation'||!c.retestIds.every(k=>p.retests.some(t=>t.id===k)))throw Error('نفّذ كل المقارنات بعد المعالجة قبل توثيق التقرير.');
  if(!['verified','incomplete'].includes(String(action.key))||!['exposure','access','session'].includes(String(action.value)))throw Error('اختر نتيجة وإجراء مراقبة من الخيارات.');
  const effective=p.patch===c.fix&&c.retestIds.every((k,i)=>p.retests.find(t=>t.id===k)?.status===c.retestStatuses[i]);
  if(!effective){e.reportReady=false;return fail('قارن الردود بعد المعالجة: هل توقف السلوك غير المسموح؟ وهل بقي الاستخدام المعتمد يعمل؟ عد إلى المعالجة وأعد الاختبار.');}
  if(action.key!=='verified'){e.reportReady=false;return fail('راجع الفرق بين الردود قبل المعالجة وبعدها، بما فيها طلب الاستخدام المعتمد. هل تدعم حكمك؟');}
  if(action.value!==c.handoff){e.reportReady=false;return fail('إجراء المراقبة لا يتابع السلوك الذي أثبتته طلباتك. قارِن مصدر الدليل بالضابط الذي اختبرته.');}
  if(p.report.finding!==c.finding||p.report.impact!==c.impact||e.affectedAsset!==c.affected||!c.required.every(k=>e.collected.includes(k)&&p.report.evidence.includes(k)))throw Error('استكمل الاستنتاج والأثر والأدلة قبل توثيق التقرير.');
  e.retestVerdict='verified';e.reportReady=true;p.feedback='';return 'حُفظ تقرير النتيجة والمعالجة وإعادة الاختبار.';
 }
 if(action.action==='submit'&&!e.reportReady)throw Error('وثّق نتيجة إعادة الاختبار والتقرير قبل إنهاء التقييم.');
 return null;
}
