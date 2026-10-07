import {missionById} from './missions';
import {nexaCorp} from './nexacorp';
import {emails,interactiveLabById} from './interactive-labs';
import type {MissionSession} from './mission-engine';

// Presentation adapter only: mission 003 owns evidence, grading and rewards.
// E03 is a related lab exercise, not an attachment/header source for this message.
export const emailExperience={href:'/experience/nexacorp-email',missionId:'003',labId:'v2-email',labEmailId:'E03',lessonId:'security-8'} as const;
export const emailMission=missionById(emailExperience.missionId)!;
export const emailLab=interactiveLabById(emailExperience.labId)!;
export const relatedLabEmail=emails.find(e=>e.id===emailExperience.labEmailId)!;
export const emailEmployee=nexaCorp.employees.find(e=>e.id==='layla')!;
export const emailRecipient=nexaCorp.emailIdentities.find(e=>e.id===emailEmployee.emailId)!;
export const emailAccount=nexaCorp.accounts.find(e=>e.id===emailEmployee.accountId)!;
export const emailEvidence=(id:string)=>emailMission.evidence.find(e=>e.id===id)!;
const lines=emailEvidence('message').content.split('\n');
const sender=lines[0].replace(/^من:\s*/,'');
export const emailMessage={sender,address:sender.match(/<([^>]+)>/)?.[1]||sender,displayName:sender.split('<')[0].trim(),subject:lines[1].replace(/^الموضوع:\s*/,''),body:lines.slice(2).join('\n')};
export const emailFields=['sender','domain','link','attachment','headers'] as const;
// Keep old field URLs valid; the main investigation needs only these three views.
export const emailInspectionFields=['sender','headers','link'] as const;
export type EmailField=typeof emailFields[number];
export type EmailStep='brief'|'explore'|'decide'|'result';
export const emailSteps:EmailStep[]=['brief','explore','decide','result'];
export const emailFieldLabels:Record<EmailField,string>={sender:'هوية المرسل',domain:'النطاق',link:'وجهة الرابط',attachment:'بيانات المرفق',headers:'الترويسة'};
export const emailKnowledge:Record<EmailField,{title:string;text:string}>={
 sender:{title:'الاسم الظاهر ليس إثباتًا',text:'يمكن كتابة اسم فريق معروف دون امتلاك بريده. اقرأ العنوان بين الأقواس، ثم قارنه بالترويسة وطلب الرسالة؛ الاسم وحده لا يثبت الهوية.'},
 domain:{title:'اختلاف النطاق · Domain mismatch',text:'قد تختلف نطاقات البريد لأسباب مشروعة. الاختلاف يدعو للفحص؛ قارنه بطلب الرسالة ونتائج المصادقة.'},
 link:{title:'الوجهة الفعلية · Suspicious URL',text:'اقرأ النطاق في عنوان الوجهة الفعلي، لا اسم الشركة في نص الرابط. عاينه دون فتحه، وحدّد البيانات المطلوبة؛ وجود HTTPS وحده لا يجعل الطلب موثوقًا.'},
 attachment:{title:'ما لا نعرفه',text:'غياب بيانات المرفق لا يثبت أمان الرسالة أو خبثها. دوّن حدود الدليل المتاح، ولا تخترع تفاصيل غير مسجلة.'},
 headers:{title:'Return-Path وSPF',text:'From هو المرسل الظاهر، وReturn-Path عنوان ارتداد رسائل التسليم، وليس وجهة الرد. SPF يفحص إذن خادم الإرسال لاستخدام نطاق MAIL FROM أو HELO؛ لا يتحقق من الاسم الظاهر أو محتوى الرسالة. اربط نتيجته بالرابط والطلب.'}
};
export const emailClassifications=[{id:'legitimate',label:'يرجّح أنها سليمة'},{id:'suspicious',label:'مشبوهة وتحتاج تحققًا'},{id:'malicious',label:'محاولة تصيّد تدعمها الأدلة'}] as const;
export const emailReasons=[{id:'headers',label:'Return-Path ونتائج SPF',evidenceId:'headers'},{id:'link',label:'وجهة الرابط وطلب رمز التحقق',evidenceId:'link'},{id:'name',label:'الاسم الظاهر مألوف',evidenceId:'message'},{id:'urgency',label:'المهلة قصيرة',evidenceId:'message'}] as const;
export const emailActions=[{id:'report',label:'احفظ الرسالة واعزلها وأبلغ فريق الأمن'},{id:'verify',label:'تحقق بقناة معروفة قبل التعامل معها'},{id:'release',label:'اسمح بالرسالة واتبع طلبها'},{id:'delete',label:'احذف الرسالة دون حفظ الدليل أو إبلاغ'}] as const;
export type EmailDecision={classification:string;reasons:string[];action:string};
export function emailDecisionAnswers(decision:EmailDecision){
 const clues=decision.reasons.filter(id=>id==='headers'||id==='link').map(id=>id==='headers'?'return-path':'link').join(',');
 // Incorrect classifications remain incorrect reports for the existing grader.
 return {clues,action:decision.classification==='malicious'&&decision.action==='report'?'report and quarantine':'قرار يحتاج مراجعة'};
}
export function emailRecheck(decision:EmailDecision){
 if(!decision.reasons.includes('headers'))return 'الاسم المألوف والمهلة لا يثبتان هوية المرسل. راجع From وReturn-Path ونتيجة SPF، ثم اربطها بالطلب؛ اختلاف العناوين وحده لا يكفي.';
 if(!decision.reasons.includes('link'))return 'الترويسة وحدها لا تشرح ما يريده المرسل. عاين الوجهة دون فتحها واربطها بطلب رمز التحقق؛ هذا الدليل مفقود من قرارك.';
 if(decision.classification==='legitimate')return 'لماذا تُعد الرسالة سليمة رغم طلب رمز الحساب عبر وجهة خارجية وفشل التحقق؟ هذان الدليلان معًا يخالفان تصنيفك.';
 if(decision.classification==='suspicious')return 'ليست الملاحظة مجرد نطاق مختلف: الرسالة تطلب رمز الحساب، والوجهة خارجية، والترويسة تسجل فشل التحقق. اجتماعها يدعم محاولة تصيّد، لا يثبت اختراق الحساب.';
 if(decision.action==='verify')return 'التحقق بقناة معروفة آمن، لكنه لا يكمل معالجة هذا البلاغ وحده. بعد ثبوت محاولة التصيّد، احفظ الرسالة واعزلها وأبلغ الفريق في المحاكاة.';
 return decision.action==='delete'?'الحذف وحده يفقد الدليل ولا يبلغ الفريق. احفظ الرسالة واعزلها ثم أبلغ بالقناة المعتمدة.':'السماح بالرسالة يتعارض مع أدلة محاولة التصيّد. أوقف التعامل مع طلب الرمز، واحفظ الرسالة واعزلها وأبلغ الفريق.';
}
export function recoverEmailStep(requested:EmailStep,session:MissionSession|null,completed:boolean):EmailStep{
 if(completed&&!session?.replaying)return 'result';
 if(requested==='result')return session?.inspected.length?'explore':'brief';
 if(requested==='decide'&&!emailMission.successConditions.evidence.every(id=>session?.inspected.includes(id)))return 'explore';
 return requested;
}
export function emailReturnPath(value:string){
 try{const url=new URL(value,'https://cyberlab.invalid');if(url.origin!=='https://cyberlab.invalid'||url.pathname!==emailExperience.href)return null;
  const step=url.searchParams.get('step'),field=url.searchParams.get('field');
  return emailExperience.href+(emailSteps.includes(step as EmailStep)?'?step='+step+(emailFields.includes(field as EmailField)?'&field='+field:''):'');
 }catch{return null}
}
