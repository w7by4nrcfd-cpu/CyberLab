import {expansionAction} from './offensive-expansion-actions';
import {freshOffensiveExtension} from './offensive-expansion';
import {assessmentPages,assessmentTests,assessmentHypotheses,assessmentFindings,assessmentImpacts,assessmentFixes,freshAssessment,type AssessmentTrace} from './offensive-pilot';
import type {LabSession,LabAction} from './interactive-lab-engine';
// Scenario adapter: no shell, URL fetch, credential input or configurable target.
function trace(id:string,patched=false):AssessmentTrace{
 if(id==='own')return {id,request:'GET /training/reports/R-104\nSimulated account: sara',status:200,body:'report: R-104\nowner: sara\nclassification: internal-training\namount: 240 simulated units',policy:'مالك التقرير يستطيع القراءة.'};
 if(id==='guest')return {id,request:'GET /training/reports/R-205\nSimulated account: anonymous',status:401,body:'Login required · simulated response',policy:'لا يُسمح بالقراءة دون جلسة.'};
 if(id==='other')return {id,request:'GET /training/reports/R-205\nSimulated account: sara',status:patched?403:200,body:patched?'Access denied · simulated response':'report: R-205\nowner: layla\nclassification: internal-training\namount: 910 simulated units',policy:'سارة ليست مالكة R-205 ولا تحمل دور مراجع.'};
 throw Error('طلب خارج نطاق التفويض التدريبي.');
}
export function applyAssessment(old:LabSession,action:LabAction){const s=structuredClone(old),p=s.assessment||freshAssessment();s.assessment=p;let submitted=false;const key=typeof action.key==='string'?action.key:'';
 const expect=(...steps:string[])=>{if(!steps.includes(p.step))throw Error('أكمل خطوة الفحص الحالية أولًا.');};
 const listed=(options:readonly {id:string}[])=>{if(!options.some(x=>x.id===key))throw Error('اختر خيارًا من بيئة التدريب.');};
 const fail=(message:string)=>{p.feedback=message;s.mistakes++;};
 const expanded=expansionAction('v2-access-control',s,action);if(expanded!==null)return {session:s,submitted:false,message:expanded};
 if(s.lastResult?.passed&&action.action!=='replay')throw Error('أعد فتح التقييم لبدء محاولة جديدة.');
 switch(action.action){
 case 'replay':if(!s.lastResult?.passed)throw Error('أكمل التقييم قبل إعادته.');s.assessment=freshAssessment();if(s.offensive)s.offensive=freshOffensiveExtension();s.visited=[];s.evidence=[];s.hintsUsed=0;s.mistakes=0;s.lastResult=null;return {session:s,submitted:false,message:'بدأت المحاكاة نفسها؛ لا مكافأة أساسية جديدة.'};
 case 'authorize':expect('authorize');if(action.accepted!==true)throw Error('راجع الهدف والنطاق ثم وافق على التفويض.');p.authorized=true;p.step='recon';break;
 case 'page':expect('recon');listed(assessmentPages);if(!p.pages.includes(key))p.pages.push(key);break;
 case 'observe':expect('recon');if(!assessmentPages.every(x=>p.pages.includes(x.id)))throw Error('افحص الحساب والوظائف المتاحة قبل الطلب.');p.observations=[trace('own')];p.step='observe';break;
 case 'hypothesis':expect('observe');p.step='hypothesis';p.feedback='';break;
 case 'choose':expect('hypothesis');listed(assessmentHypotheses);p.hypothesis=key;p.step='test';p.feedback='';break;
 case 'probe':expect('test');listed(assessmentTests);if(!p.authorized||!p.hypothesis)throw Error('يلزم تفويض وفرضية قبل الاختبار.');const observed=trace(key);if(!p.observations.some(x=>x.id===key))p.observations.push(observed);break;
 case 'evaluate':expect('test');if(s.offensive&&!assessmentTests.every(t=>s.offensive!.collected.includes(t.id)))throw Error('اجمع المقارنات الثلاث قبل اعتماد الفرضية.');if(!assessmentTests.every(x=>p.observations.some(t=>t.id===x.id)))throw Error('قارن طلب المالك والطلب دون جلسة وطلب الحساب الآخر.');
 if(p.hypothesis!=='object'){fail(p.hypothesis==='ui'?'الرابط غير ظاهر في قائمة سارة، لكن طلب R-205 عاد ببياناته. هل قائمة الواجهة وحدها تفسر رد الخادم؟':'السياسة تقصر القراءة على المالك، وR-205 مملوك لليلى؛ نجاح الجلسة وحده لا يفسر الإذن. قارِن السياسة بالرد.');}else{p.feedback='';p.step='impact';}break;
 case 'recheck':expect('test','impact','remediation');p.feedback='';p.step='hypothesis';break;
 case 'report':expect('impact');{
 const report=action.report as typeof p.report|undefined;
 if(!report||!assessmentFindings.some(x=>x.id===report.finding)||!assessmentImpacts.some(x=>x.id===report.impact)||!Array.isArray(report.evidence)||report.evidence.some(id=>typeof id!=='string'||!assessmentTests.some(t=>t.id===id))||new Set(report.evidence).size!==report.evidence.length)throw Error('اختر استنتاجًا وأثرًا وأدلة صحيحة دون تكرار.');
 p.report={...p.report,finding:report.finding,impact:report.impact,evidence:[...report.evidence]};
 if(report.finding!=='read'||report.impact!=='confidentiality'){fail('الطلبات كانت GET وأعادت تقريرًا داخليًا؛ لم تختبر تعديلًا أو حذفًا أو بيانات دخول. اجعل الأثر في حدود ما لاحظته.');break;}
 if(!['own','guest','other'].every(id=>report.evidence.includes(id))){fail('الرد المختلف يحتاج مقارنة مرجعية: قارِن هوية الجلسة ومالك التقرير، وأضف طلبًا دون جلسة لتمييز الفرضيتين.');break;}
 p.feedback='';p.step='remediation';break;}
 case 'patch':expect('remediation');listed(assessmentFixes);p.patch=key;p.report.fix=key;p.retests=[];p.feedback='';break;
 case 'retest':expect('remediation');listed(assessmentTests);if(!p.patch)throw Error('اختر إجراء تصحيحيًا قبل إعادة الاختبار.');if(!p.retests.some(x=>x.id===key))p.retests.push(trace(key,p.patch==='server'));break;
 case 'submit':expect('remediation');submitted=true;s.attempts++;
 if(p.patch!=='server'||!assessmentTests.every(t=>p.retests.some(r=>r.id===t.id))){fail(p.retests.some(t=>t.id==='other'&&t.status===200)?'بعد التغيير، ما زال الحساب نفسه يقرأ تقرير ليلى. قارِن الطلب بالرد مجددًا قبل اعتماد المعالجة.':'إثبات المعالجة يحتاج منع الحساب غير المخوّل، مع بقاء وصول المالك ورفض الزائر.');s.lastResult={passed:false,score:40,feedback:[p.feedback]};break;}
 p.step='result';p.feedback='';s.lastResult={passed:true,score:Math.max(60,100-s.mistakes*5),feedback:['ثبت كشف تقرير لحساب غير مخوّل دون إثبات تعديل أو استيلاء على حساب.','التحقق من صلاحية الحساب على المورد في الخادم منع الطلب غير المصرح، مع استمرار وصول المالك.']};break;
 default:throw Error('إجراء غير متاح في هذا التقييم المحدود.');
 }
 s.visited=p.pages.map(id=>'assessment:'+id);s.evidence=s.offensive?[...s.offensive.collected]:p.observations.map(t=>t.id);return {session:s,submitted,message:p.feedback||'حُفظت خطوة التقييم.'};
}
