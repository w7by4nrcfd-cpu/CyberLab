// Two bounded scenarios. No target input, networking, shell, or separate progress ledger.
export const offensiveTrackHref='/practice/offensive';
export const surfaceId='v2-attack-surface',sessionId='v2-auth-session';
export const offensiveOrder=[surfaceId,'v2-access-control',sessionId] as const;
export const minimumHref=(id:string)=>'/labs/v2/'+id;
export const isMinimumAssessment=(id:string)=>id===surfaceId||id===sessionId;
export function minimumReturnPath(value:string){try{const u=new URL(value,'https://cyberlab.invalid');return u.origin==='https://cyberlab.invalid'&&[minimumHref(surfaceId),minimumHref(sessionId)].includes(u.pathname)&&!u.search&&!u.hash?u.pathname:null}catch{return null}}
export const surfaceSteps=['scope','recon','classify','prioritize','validate','impact','remediation','result'] as const;
export const sessionSteps=['scope','login','observe','hypothesis','test','impact','remediation','result'] as const;
export type MinimumStep=typeof surfaceSteps[number]|typeof sessionSteps[number];
export type MinimumTrace={id:string;label:string;request:string;status:number;body:string};
export type MinimumState={step:MinimumStep;authorized:boolean;inspected:string[];classifications:Record<string,string>;priority:string;phase:'none'|'a'|'out'|'b';hypothesis:string;observations:MinimumTrace[];feedback:string;report:{finding:string;impact:string;evidence:string[]};patch:string;retests:MinimumTrace[]};
export const freshMinimum=():MinimumState=>({step:'scope',authorized:false,inspected:[],classifications:{},priority:'',phase:'none',hypothesis:'',observations:[],feedback:'',report:{finding:'',impact:'',evidence:[]},patch:'',retests:[]});
export const surfaceServices=[
 {id:'portal',host:'TRAIN-PORTAL',port:443,service:'HTTPS',endpoint:'/login',banner:'Training Portal',response:'200 · Login page · no account data',exposure:'يمكن الوصول من منطقة التقييم الخارجية المحاكية'},
 {id:'metrics',host:'TRAIN-METRICS',port:8080,service:'HTTP',endpoint:'/metrics',banner:'Training Monitor',response:'200 · queue=4; worker=training-only; build=simulated',exposure:'يمكن الوصول من منطقة التقييم الخارجية المحاكية'},
 {id:'admin',host:'TRAIN-ADMIN',port:22,service:'SSH',endpoint:'—',banner:'Training SSH · version not disclosed',response:'Internal: service present · External: connection denied',exposure:'داخل منطقة الإدارة التدريبية فقط'}
] as const;
export const surfaceClasses=[{id:'present',label:'خدمة موجودة؛ لا دليل على خلل الآن'},{id:'review',label:'تعرّض يحتاج مراجعة السياسة والتحقق'},{id:'misconfiguration',label:'إعداد خاطئ مثبت بأدلة'},{id:'vulnerability',label:'ثغرة برمجية مثبتة'}] as const;
export const surfaceValidation=[{id:'policy',label:'سجل الأصول والإعداد المعتمد'},{id:'external',label:'طلب من منطقة التقييم الخارجية المحاكية'},{id:'internal',label:'طلب من منطقة الإدارة الداخلية المحاكية'}] as const;
export const surfaceRetests=[{id:'external',label:'خدمة القياس من المنطقة الخارجية'},{id:'internal',label:'خدمة القياس من المنطقة الداخلية'},{id:'portal',label:'بوابة HTTPS المسموح بها'}] as const;
export const sessionHypotheses=[{id:'browser',label:'واجهة المتصفح فقط لم تسجّل الخروج'},{id:'authorization',label:'المشكلة هي صلاحية قراءة ملف حساب آخر'},{id:'revocation',label:'قد لا يتوقف قبول الجلسة السابقة بعد الخروج'}] as const;
export const sessionTests=[{id:'old',label:'الجلسة A المحفوظة قبل الخروج'},{id:'current',label:'الجلسة B الناتجة من تسجيل الدخول الجديد'},{id:'anonymous',label:'طلب دون جلسة'}] as const;
export const minimumOptions={
 surface:{findings:[{id:'config',label:'إعداد تعرّض خدمة القياس يخالف السياسة المعتمدة'},{id:'cve',label:'ثغرة برمجية مؤكدة من اسم الخدمة'},{id:'all',label:'كل منفذ متاح يمثل ثغرة'}],impacts:[{id:'metadata',label:'كشف بيانات تشغيل تدريبية من منطقة غير مصرح لها'},{id:'takeover',label:'السيطرة على كل أجهزة الشركة'}],fixes:[{id:'restrict',label:'حصر خدمة القياس بمنطقة الإدارة مع إبقاء الخدمة المقصودة'},{id:'close',label:'إغلاق جميع الخدمات بلا تمييز'},{id:'rename',label:'تغيير اسم الخدمة في الرد'}]},
 session:{findings:[{id:'revocation',label:'الخادم ما زال يقبل جلسة سارة السابقة بعد تسجيل الخروج'},{id:'other',label:'سارة تقرأ موارد حساب آخر'},{id:'password',label:'كلمة مرور المستخدم أصبحت معروفة'}],impacts:[{id:'continued',label:'من يمتلك الجلسة القديمة قد يستمر في قراءة بيانات حسابها'},{id:'admin',label:'الجلسة تمنح إدارة كل الحسابات'}],fixes:[{id:'revoke',label:'إبطال الجلسة في الخادم عند تسجيل الخروج'},{id:'cookie',label:'حذف Cookie من واجهة المتصفح فقط'},{id:'authorization',label:'تغيير صلاحيات الملف دون تغيير حالة الجلسة'}]}
} as const;
export const minimumKnowledge={
 surface:{recon:{title:'المنافذ والخدمات',text:'المنفذ يوجّه الطلب إلى خدمة. وجود خدمة أو رد ناجح لا يثبت ثغرة؛ يلزم سياق وتحقق.',lessonId:'net-3'},classify:{title:'سطح الهجوم',text:'قارن ما يمكن الوصول إليه بما تقصده الشركة. التعرّض إشارة للمراجعة، وليس حكمًا بوجود ثغرة.',lessonId:'network-security-1'},validate:{title:'قراءة الطلب والرد',text:'المسار والحالة والمحتوى أدلة مختلفة. قارِن منطقتين وسياسة الأصل بدل الاعتماد على اسم الخدمة.',lessonId:'web-7'},remediation:{title:'تقليل التعرّض',text:'احصر الخدمة بمن يحتاجها ثم أثبت استمرار الاستخدام المسموح. إغلاق كل شيء ليس معالجة صالحة.',lessonId:'network-security-1'}},
 session:{login:{title:'مصادقة أم جلسة؟',text:'المصادقة تتحقق من الهوية. الجلسة تربط الطلبات اللاحقة بتلك الهوية؛ وهي مختلفة عن إذن المورد.',lessonId:'security-5'},observe:{title:'Cookie والجلسة',text:'اختفاء Cookie من المتصفح يغيّر الطلبات الجديدة. قارن ذلك بما يقرره الخادم عن الجلسة السابقة.',lessonId:'web-9'},test:{title:'عمر الجلسة',text:'قارن جلسة سابقة وجلسة حالية وطلبًا بلا جلسة. لا تستنتج صلاحيات حساب آخر من مورد الحساب نفسه.',lessonId:'web-10'},remediation:{title:'ضبط الجلسة',text:'إغلاق الواجهة وحده لا يثبت انتهاء الثقة. أعد فحص الجلسة السابقة والحالية والطلب دون جلسة بعد المعالجة.',lessonId:'web-security-6'}}
} as const;

export function trackLessonReturnPath(value:string){if(value==='/labs/v2/v2-access-control?track=offensive')return value;return minimumReturnPath(value)}
