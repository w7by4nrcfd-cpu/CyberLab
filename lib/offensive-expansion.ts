// Presentation and bounded scenario metadata for the three existing lab IDs.
// No independent incident, evidence, completion or reward engine.
export type OffensiveExtension={version:2;scope:string[];scopeApproved:boolean;collected:string[];affectedAsset:string;reportReady:boolean;retestVerdict:string};
export const freshOffensiveExtension=():OffensiveExtension=>({version:2,scope:[],scopeApproved:false,collected:[],affectedAsset:'',reportReady:false,retestVerdict:''});
export const offensiveCaseIds=['v2-attack-surface','v2-access-control','v2-auth-session'] as const;
export type OffensiveCaseId=typeof offensiveCaseIds[number];
export const isOffensiveCase=(id:string):id is OffensiveCaseId=>offensiveCaseIds.includes(id as OffensiveCaseId);
export const offensiveCases={
 'v2-attack-surface':{assetId:'surface-training',title:'تقييم سطح الهجوم',scope:['TRAIN-PORTAL','TRAIN-METRICS','TRAIN-ADMIN'],affected:'TRAIN-METRICS',handoff:'exposure',next:'/labs/v2/v2-access-control?track=offensive',nextLabel:'اختبر حدود الوصول إلى التقارير',summary:'بيانات تشغيل متاحة من منطقة لا تسمح بها سياسة الخدمة.',defense:'تراقب العمليات الأمنية الوصول إلى خدمة القياس من المناطق غير المعتمدة؛ لا يكفي رقم المنفذ لإثبات حادث.'},
 'v2-access-control':{assetId:'access-training',title:'تقييم الوصول إلى التقارير',scope:['TRAIN-REPORTS'],affected:'TRAIN-REPORTS',handoff:'access',next:'/labs/v2/v2-auth-session',nextLabel:'اختبر انتهاء الثقة في الجلسة',summary:'جلسة سارة قرأت تقرير ليلى دون صلاحية على المورد.',defense:'تحتاج مراقبة الوصول إلى هوية الحساب ومالك المورد وقرار التفويض؛ نجاح تسجيل الدخول وحده لا يثبت أن الطلب مسموح.'},
 'v2-auth-session':{assetId:'session-training',title:'تقييم المصادقة والجلسة',scope:['TRAIN-PROFILE'],affected:'TRAIN-PROFILE',handoff:'session',next:'/practice/offensive',nextLabel:'راجع ما أثبتّه في التجارب الثلاث',summary:'الجلسة السابقة بقيت مقبولة في الخادم بعد تسجيل الخروج.',defense:'اربط وقت تسجيل الخروج بقبول الجلسة لاحقًا في سجلات الهوية؛ بقاء طلب سابق لا يثبت الوصول إلى حساب آخر.'}
} as const;
export const scopeCandidates=(id:OffensiveCaseId)=>[...offensiveCases[id].scope.map(key=>({id:key,label:key,description:'أصل تدريبي معزول ضمن تكليف التقييم'})),{id:'WEB-01',label:'WEB-01',description:'بوابة الشركة؛ لا يشملها تفويض البيئة التدريبية'}];
export const surfaceHypotheses=[{id:'port',label:'مجرد وجود منفذ متاح يثبت ثغرة'},{id:'zone',label:'قد تسمح الخدمة بمنطقة أوسع من السياسة المعتمدة'},{id:'software',label:'اسم الخدمة وحده يثبت خللًا برمجيًا'}] as const;
export const retestChoices=[{id:'verified',label:'المعالجة منعت السلوك غير المسموح وأبقت الاستخدام المعتمد'},{id:'incomplete',label:'الردود لا تثبت المعالجة أو تعطّل استخدامًا معتمدًا'}] as const;
export const handoffChoices=[{id:'exposure',label:'مراقبة مناطق الوصول إلى الخدمة'},{id:'access',label:'مقارنة هوية الحساب ومالك المورد وقرار التفويض'},{id:'session',label:'مقارنة وقت الخروج بقبول الجلسة في سجلات الهوية'}] as const;
