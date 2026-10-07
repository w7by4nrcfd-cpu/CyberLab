import type {LabSession} from './interactive-lab-engine';
import type {PracticeCase} from '@/components/practice-check';
import {practicalChecks} from './practical-checks';

// Teaching support only; the lab engine owns grading, progress and rewards.
// Time ranges are editorial estimates.
export type LabLearningMeta={time:string;reference:{id:string;title:string};debrief:string;transfer:PracticeCase};
export const labLearning:Record<string,LabLearningMeta>={
 'v2-terminal':{time:'15–25 دقيقة',reference:{id:'linux-2',title:'فهم أوامر الطرفية'},debrief:'ربطت ناتج الأوامر بالسؤال، بدل التخمين من اسم الملف. نجاح هذا السيناريو يثبت خطوات المحاكاة فقط، ولا يعني أنك أدرت خادمًا حقيقيًا.',transfer:practicalChecks['v2-terminal']},
 'v2-logs':{time:'20–35 دقيقة',reference:{id:'soc-3',title:'قراءة السجلات الأمنية'},debrief:'ربطت تسلسل الهوية بأحداث الجهاز والشبكة. الحدث المفرد أو لون الخطورة لا يثبتان الحادث؛ العلاقة بين المصادر هي أساس الاستنتاج.',transfer:practicalChecks['v2-logs']},
 'v2-email':{time:'15–25 دقيقة',reference:{id:'security-8',title:'فحص الرسائل المشبوهة'},debrief:'قارنت رسائل مختلفة وربطت المصدر والوجهة بالطلب. فشل SPF أو نجاحه وحده لا يحسم سلامة الرسالة، ووصول التصيّد لا يثبت فقدان الحساب.',transfer:practicalChecks['v2-email']},
 'v2-network':{time:'30–50 دقيقة',reference:{id:'net-2',title:'IP والبوابة وDNS وDHCP'},debrief:'فحصت الإعداد، ثم اختبرت الإصلاح، ثم تتبعت النقل والمسار. نجاح الوصول إلى البوابة لا يثبت سلامة كل خدمة؛ حدّد ما اختبرته قبل تعميم النتيجة.',transfer:practicalChecks['v2-network']},
 'v2-http':{time:'10–20 دقيقة',reference:{id:'web-1',title:'كيف يعمل طلب الويب؟'},debrief:'قارنت طلبين وردين وربطت جلسة التدريب بالنتيجة. نجاح المصادقة ليس إثباتًا أن المستخدم مصرح له بكل الموارد؛ التفويض يحتاج فحصًا مستقلًا.',transfer:practicalChecks['v2-http']}
};
export type LabLearningStep={title:string;done:boolean;instruction:string};
export type LabLearningScope={emailIds:string[];httpIds:string[];devices:number;transports:number;flows:number;logCases:number};
export function labLearningSteps(id:string,s:LabSession,scope:LabLearningScope):LabLearningStep[]{
 const finished=!!s.lastResult?.passed;
 const evaluation:LabLearningStep={title:'تحقق من استنتاجك',done:finished,instruction:s.lastResult&&!finished?'راجع ملاحظات المحاولة أسفل المختبر، ثم صحح الدليل أو الاستنتاج وأعد التقييم.':'أرسل استنتاجك بعد الفحص. جمع الأدلة وحده لا يعني اجتياز المختبر.'};
 switch(id){
  case 'v2-terminal':{const required=s.terminalScenarioId==='dns'?['terminal:readme','terminal:resolver','terminal:ip','terminal:ping','terminal:nslookup']:['terminal:readme','terminal:find','terminal:report','terminal:ps'];return [{title:'اجمع أدلة السيناريو',done:required.every(v=>s.visited.includes(v)),instruction:s.terminalScenarioId==='dns'?'اقرأ البلاغ وإعداد محلل الأسماء، ثم قارِن الوصول بالعنوان بنتيجة حل الاسم.':'اقرأ README، وحدد ملف الخدمة، ثم قارِن التقرير بالعملية التي تشغّلها.'},evaluation]}
  case 'v2-logs':return [{title:'حلّل تسلسل الدخول',done:!!s.logAuthSolved,instruction:'رشّح الأحداث، واحفظ الفشل والنجاح المرتبطين، ثم قارِن الحساب والمصدر والوقت.'},{title:'اربط الجهاز بالشبكة',done:(s.logSolved||[]).length===scope.logCases,instruction:'قارِن سلسلة العمليات باتصالات الجهاز. احفظ الأدلة التي تبرر كل قرار.'},evaluation];
  case 'v2-email':return [{title:'افحص مصادر الرسائل',done:scope.emailIds.every(v=>['headers','url'].every(part=>s.visited.includes(v+':'+part))),instruction:'عاين الترويسة ووجهة الرابط لكل رسالة. الروابط بيانات تدريبية لا تحتاج فتحًا.'},{title:'سجّل التصنيف والأدلة',done:scope.emailIds.every(v=>!!s.verdicts[v])&&['E03:replyTo','E03:headers'].every(v=>s.evidence.includes(v)),instruction:'صنّف الرسائل بحسب المصدر والوجهة والطلب، واحفظ أدلة الرسالة التي تتطلب تصعيدًا. تسجيل التصنيف لا يثبت صحته بعد.'},evaluation];
  case 'v2-network':return [{title:'افحص الأجهزة وأعد الاختبار',done:s.networkFixed.length===scope.devices,instruction:'افحص الإعداد الحالي واختبر الاتصال قبل تعديل واحد. أعد الاختبار لتعرف أثره.'},{title:'قارن متطلبات النقل',done:(s.transportSolved||[]).length===scope.transports,instruction:'اختبر أثر الفقد أو التأخر، ثم اختر النقل وفق حاجة كل تطبيق.'},{title:'تتبّع المسار والرد',done:(s.networkSolved||[]).length===scope.flows,instruction:'قارِن بيانات الجهاز وجدول الجلسات والمسارات قبل تحديد الخلل والقرار التالي.'},evaluation];
  case 'v2-http':return [{title:'قارن الطلبين والردين',done:scope.httpIds.every(v=>['request','response'].every(part=>s.visited.includes(v+':'+part))),instruction:'افحص طريقة الطلب وترويساته ورمز الرد. ما الفرق بين الطلبين، وما الذي تثبته المقارنة؟'},evaluation];
  default:return [];
 }
}
