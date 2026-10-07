// One bounded scenario, consumed by the existing interactive-lab workflow.
export const offensivePilot={id:'v2-access-control',href:'/labs/v2/v2-access-control',assetId:'access-training',accountId:'sara',otherAccountId:'layla',prerequisites:{lessons:['security-6'],labs:['v2-http']}} as const;
export const assessmentSteps=['authorize','recon','observe','hypothesis','test','impact','remediation','result'] as const;
export type AssessmentStep=typeof assessmentSteps[number];
export type AssessmentTrace={id:string;request:string;status:number;body:string;policy:string};
export type AssessmentState={step:AssessmentStep;authorized:boolean;pages:string[];observations:AssessmentTrace[];hypothesis:string;feedback:string;report:{finding:string;impact:string;evidence:string[];fix:string};patch:string;retests:AssessmentTrace[]};
export const freshAssessment=():AssessmentState=>({step:'authorize',authorized:false,pages:[],observations:[],hypothesis:'',feedback:'',report:{finding:'',impact:'',evidence:[],fix:''},patch:'',retests:[]});
export const assessmentPages=[{id:'account',label:'حسابي وصلاحياتي'},{id:'reports',label:'تقاريري والوظائف المتاحة'}] as const;
export const assessmentHypotheses=[{id:'session',label:'الجلسة تمنح جميع الموظفين حق قراءة كل التقارير'},{id:'ui',label:'إخفاء الرابط في الواجهة يكفي لحماية التقرير'},{id:'object',label:'الطلب قد يتحقق من الجلسة دون التحقق من مالك التقرير'}] as const;
export const assessmentTests=[{id:'own',label:'سارة تطلب تقريرها R-104'},{id:'guest',label:'زائر دون جلسة يطلب R-205'},{id:'other',label:'سارة تطلب التقرير R-205 المخصص لليلى'}] as const;
export const assessmentFindings=[{id:'read',label:'قراءة تقرير حساب آخر بجلسة موظفة عادية'},{id:'admin',label:'الحصول على صلاحيات إدارة التطبيق بالكامل'},{id:'write',label:'تعديل التقارير وحذفها'}] as const;
export const assessmentImpacts=[{id:'confidentiality',label:'كشف معلومات تقرير داخلي لحساب غير مخوّل'},{id:'takeover',label:'سرقة حساب كل موظف في الشركة'},{id:'outage',label:'تعطيل شبكة الشركة بالكامل'}] as const;
export const assessmentFixes=[{id:'hide',label:'إخفاء الرابط وتغيير شكل المعرّف في الواجهة'},{id:'server',label:'فحص صلاحية الحساب على التقرير في الخادم لكل طلب'},{id:'session',label:'السماح لكل جلسة دخول صالحة بقراءة أي تقرير'}] as const;
export const assessmentKnowledge={
 observe:{title:'المصادقة والتفويض',text:'المصادقة تتحقق ممن أنت. التفويض يحدد ما يجوز لحسابك فعله. نجاح تسجيل الدخول لا يمنح إذنًا لكل مورد.',lessonId:'security-6'},
 hypothesis:{title:'صلاحية كل مورد · Object-level access',text:'صلاحية صفحة عامة لا تعني صلاحية كل تقرير فيها. قارِن الحساب ومالك المورد وسياسة الوصول، ثم اختبر فرضيتك.',lessonId:'web-security-7'},
 test:{title:'حدود الواجهة',text:'إخفاء رابط أو زر يغيّر ما يراه المستخدم. لا يثبت أن الخادم يمنع طلب المورد نفسه؛ يلزم فحص الرد ضمن التفويض.',lessonId:'web-security-12'},
 remediation:{title:'التحقق في الخادم',text:'تحقق من إذن الحساب على المورد لكل طلب. بعد الإصلاح، اختبر منع غير المخوّل مع استمرار وصول المالك.',lessonId:'web-security-7'}
} as const;
// Exact allowlist, used only by full-lesson return context. It grants no access.
export function assessmentReturnPath(value:string){try{const url=new URL(value,'https://cyberlab.invalid');if(url.origin!=='https://cyberlab.invalid'||url.pathname!==offensivePilot.href)return null;return offensivePilot.href}catch{return null}}
