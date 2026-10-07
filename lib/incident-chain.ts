import type {IncidentTemplateId,Difficulty} from './incident-catalog';
import type {BoardDecision} from './investigation-board';

// A presentation/orchestration adapter for the three existing dynamic templates.
// Completion, evidence, relationships and rewards remain in their current systems.
export const responseChain={id:'identity-follow-up',href:'/experience/nexacorp-response',title:'متابعة حادث ليلى',sourceHref:'/soc/alerts/SOC-002?view=guided',sourceId:'SOC-002',employeeId:'layla'} as const;
export const responseStages=[
 {templateId:'phishing' as IncidentTemplateId,difficulty:'beginner' as Difficulty,title:'رسالة ثانية ونشاط الحساب',brief:'وصلت رسالة أخرى إلى ليلى بعد التحقيق الأول. افحص البريد وسجل الهوية؛ لا تنسب كل رسالة إلى الحادث السابق بلا دليل.',focus:'قارن مصدر البريد بأثر الحساب، ثم اختر ما يستحق الحفظ.',knowledge:{email:{title:'هوية المرسل ليست الاسم الظاهر',text:'قارن النطاق والوجهة والسياق. اختلاف النطاق إشارة تحتاج قرينة مستقلة؛ سجل الحساب يساعدك على التحقق.',lessonId:'security-8'},account:{title:'الدخول حدث مستقل عن الرسالة',text:'قارن الحساب والمصدر والوقت. فتح رسالة لا يثبت وحده أن شخصًا آخر استخدم الحساب.',lessonId:'security-5'},links:{title:'الترابط يحتاج مصدرين',text:'RECEIVED يصف وصول الرسالة للحساب، وOBSERVED_IN يربط الحساب بسجل. اذكر الملاحظة التي تدعم كل علاقة.',lessonId:'soc-2'}}},
 {templateId:'endpoint' as IncidentTemplateId,difficulty:'intermediate' as Difficulty,title:'أثر على جهاز المالية',brief:'وصل أثر من WKST-02. قرار الحساب السابق لا يثبت سلامة الجهاز: قارن العملية والملف والاتصال قبل توسيع الاحتواء.',focus:'اجمع ما يربط العملية بالاتصال؛ سجل الصيانة ليس تفسيرًا كافيًا تلقائيًا.',knowledge:{process:{title:'العملية الأم تعطي سياقًا',text:'اسم العملية وحده لا يثبت الخبث. قارن ما شغّلها والحساب والوقت ثم أثرها على الشبكة.',lessonId:'soc-3'},network:{title:'الاتصال ليس إثبات اختراق وحده',text:'اربط الوجهة بالعملية نفسها وبالوقت. المنفذ 443 قد يستخدم لحركة اعتيادية أو مشبوهة.',lessonId:'net-3'},links:{title:'من العملية إلى الاتصال',text:'SPAWNED يربط عملية أم بعملية فرعية، وCONNECTED_TO يصف اتصالًا مرصودًا. لا تفترض العلاقة دون مصدر.',lessonId:'soc-3'}}},
 {templateId:'network-auth' as IncidentTemplateId,difficulty:'advanced' as Difficulty,title:'هل نجحت الاستجابة؟',brief:'راجع نشاط الهوية بعد الاستجابة. فرّق بين اتصال إلى خدمة تسجيل الدخول وجلسة دخلت فعلًا؛ قد تكون المحاولة المحظورة علامة على نجاح الاحتواء.',focus:'ابنِ خطًا زمنيًا من سجل الهوية والشبكة وسياق الجلسة المعروفة.',knowledge:{account:{title:'المصادقة ليست مجرد اتصال',text:'الوصول إلى خدمة الهوية لا يعني قبول تسجيل الدخول. result وsuccess في سجل الهوية يحددان ما ثبت عن الجلسة.',lessonId:'security-5'},network:{title:'الاتصال والجلسة طبقتان مختلفتان',text:'قد يصل اتصال إلى خدمة تسجيل الدخول ثم ترفض الخدمة المصادقة. قارِن سجل الشبكة بسجل الهوية قبل الحكم.',lessonId:'net-3'},links:{title:'تحقق من أثر الاستجابة',text:'اربط الحساب بسجل الدخول، والمصدر بسجل الشبكة، والاتصال بخدمة الهوية. اكتمال السلسلة يحدد حدود الاستنتاج.',lessonId:'soc-2'}}}
] as const;
export const responseSteps=['brief','observe','connect','decide','result'] as const;
export type ResponseStep=typeof responseSteps[number];
export type ChainContext={id:typeof responseChain.id;stage:number;rootSeed:number;previousInstanceId?:string;previousAction?:string;identityResponse?:string;sourceId:typeof responseChain.sourceId};
export function responseReturnPath(value:string){
 try{const url=new URL(value,'https://cyberlab.invalid');if(url.origin!=='https://cyberlab.invalid'||url.pathname!==responseChain.href)return null;
 const stage=Number(url.searchParams.get('stage')||0);if(!Number.isInteger(stage)||stage<0||stage>=responseStages.length)return null;
 const step=url.searchParams.get('step'),field=url.searchParams.get('field');
 return responseChain.href+'?stage='+stage+'&step='+(responseSteps.includes(step as ResponseStep)?step:'brief')+(field&&/^[a-z0-9-]{1,40}$/.test(field)?'&field='+field:'');
 }catch{return null}
}
export function chainConsequence(stage:number,decision:BoardDecision){
 if(stage===0)return decision.action==='contain'?'أُنهيت الجلسة غير المألوفة في المحاكاة مع حفظ الأدلة. هذا يحمي الحساب، لكنه لا يثبت سلامة جهاز المالية؛ راجع أثر الجهاز التالي.':'أُرسل ملف الأدلة لفريق الاستجابة. التصعيد لا يساوي تنفيذ الاحتواء؛ يبقى أثر الجهاز بحاجة إلى فحص.';
 if(stage===1)return decision.action==='contain'?'عُزل الاتصال المشبوه على الجهاز في المحاكاة مع حفظ مصادره. الخطوة التالية تتحقق من أثر الاستجابة على الهوية.':'صُعّد أثر الجهاز مع مصادره. لم يُفترض انتهاء الاتصال؛ تحقق من جلسات الهوية وحدد مسؤول الاستجابة.';
 return decision.hypothesis==='blocked-retry'?'أثبتت السجلات رفض المحاولات الجديدة مع بقاء جلسة المكتب المعروفة. اتصال خدمة الهوية وحده لم يثبت جلسة مخترقة؛ وثّقت نجاح الاستجابة والمراقبة.':'أثبتت السجلات دخولًا غير مألوفًا بعد التصعيد. احتواء الجلسة أو تصعيدها مع الأدلة يحدد الإجراء المطلوب، دون افتراض أن التصعيد السابق نفّذ الاستجابة.';
}
