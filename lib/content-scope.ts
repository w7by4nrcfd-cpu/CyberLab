import {lessons} from './curriculum';

// Presentation-only audit of the V48 catalog. No completion, prerequisite,
// reward, mastery or career data is rewritten by these classifications.
export type ContentScope='CYBER_CORE'|'CYBER_SUPPORTING'|'OUT_OF_SCOPE';
export type CyberDirection='foundations'|'offensive'|'defensive'|'investigation';
export const scopeLabels:Record<ContentScope,string>={CYBER_CORE:'أساسي للأمن السيبراني',CYBER_SUPPORTING:'معرفة مساندة',OUT_OF_SCOPE:'معرفة إضافية · خارج الرحلة الأساسية'};
export const scopeEnglish:Record<ContentScope,string>={CYBER_CORE:'Cyber Core',CYBER_SUPPORTING:'Supporting Knowledge',OUT_OF_SCOPE:'Archived / Additional'};
export const scopeOrder:Record<ContentScope,number>={CYBER_CORE:0,CYBER_SUPPORTING:1,OUT_OF_SCOPE:2};
export const cyberDirections=[
 {id:'foundations',title:'أساسيات الأمن السيبراني',en:'Cyber Foundations',description:'عقلية أمنية، ثم معرفة الشبكة والنظام والويب عندما تحتاجها القضية.'},
 {id:'offensive',title:'الأمن الهجومي والاختبار الأخلاقي',en:'Offensive Security / Ethical Hacking',description:'ثلاثة تقييمات عملية محاكية: سطح الهجوم، والتحكم بالوصول، والمصادقة والجلسة. المعرفة هنا مرجع للفحص والمعالجة.'},
 {id:'defensive',title:'الدفاع ومراقبة التنبيهات',en:'Defensive Security / SOC',description:'حماية الهوية والشبكة والخدمات، ثم فحص التنبيهات والسجلات.'},
 {id:'investigation',title:'التحقيق والاستجابة للحوادث',en:'Investigation & Incident Response',description:'حفظ الدليل وربط الأحداث وبناء قرار احتواء أو تصعيد يمكن مراجعته.'}
] as const;
export const cyberUnits:Record<CyberDirection,{id:string;title:string;context:string}[]>={
 foundations:[
  {id:'security',title:'العقلية الأمنية والثقة',context:'تمييز الأصل والتهديد والمخاطر وحماية الحساب والمعلومة.'},
  {id:'network',title:'فهم الاتصالات',context:'IP وDNS وDHCP والمنافذ لتفسير اتصال أو مؤشر شبكي.'},
  {id:'systems',title:'فهم الجهاز والدليل',context:'الملفات والحسابات والصلاحيات والعمليات والخدمات والسجلات.'},
  {id:'data',title:'فهم الويب وصيغ البيانات',context:'قراءة طلب أو رابط أو ملف سجل، دون الدخول في مشروع برمجي عام.'},
  {id:'orientation',title:'مرجع المهارات والعمل الأمني',context:'استكشفه عند الحاجة؛ ليس اختيار مسار مهني شرطًا للبداية.'}
 ],
 offensive:[
  {id:'web',title:'ثغرات الويب والتحقق من الوصول',context:'SQL Injection وXSS وCSRF والجلسات والتفويض، مع المعالجة.'},
  {id:'surface',title:'نطاق الاختبار وسطح التعرض',context:'التفويض والخدمات والمنافذ وقراءة الأداة قبل فحص بيئة مصرح بها.'}
 ],
 defensive:[
  {id:'network',title:'الدفاع عن الشبكة',context:'تقسيم المرور والجدار الناري وTLS وIDS/IPS وتحليل الحزم.'},
  {id:'identity',title:'الهوية والخدمات السحابية',context:'الصلاحيات والأسرار والتكوين والتدقيق دفاعيًا.'},
  {id:'soc',title:'SOC والتحليل الدفاعي',context:'فرز التنبيه ومقارنة مصادره وتقييم الفرضية قبل الاستجابة.'}
 ],
 investigation:[
  {id:'evidence',title:'الأدلة والارتباط الزمني',context:'سلامة الدليل والسياق والوقت وحدود الاستنتاج.'},
  {id:'response',title:'الاحتواء والاستعادة',context:'قرار متناسب مع الأثر ويحافظ على الدليل.'},
  {id:'reporting',title:'توثيق التحقيق وتسليمه',context:'اشرح الوقائع والقرار والقيود والمسؤول عن المتابعة.'}
 ]
};
export type ContentPlacement={scope:ContentScope;direction:CyberDirection|null;unit:string|null;reason:string};
const catalog:Record<string,ContentPlacement>={};
const ids=(prefix:string,start=1,end=12)=>Array.from({length:end-start+1},(_,i)=>prefix+'-'+(start+i));
function assign(keys:string[],scope:ContentScope,direction:CyberDirection|null,unit:string|null,reason:string){for(const id of keys){if(catalog[id])throw Error('Duplicate scope entry: '+id);catalog[id]={scope,direction,unit,reason}}}
// The audit is explicit: new curriculum entries must be audited separately.
assign(['it-1','it-2','it-3','it-12'],'OUT_OF_SCOPE',null,null,'شرح حاسب أو عتاد أو تشخيص دعم عام، دون تطبيق أمني واضح في محتوى الدرس الحالي.');
assign(ids('it',4,8),'CYBER_SUPPORTING','foundations','systems','مفاهيم بيانات ونظام وملفات واستعادة تحتاجها قراءة الأصول والأدلة، عند الحاجة فقط.');
assign(ids('it',9,11),'CYBER_CORE','foundations','systems','التصحيح الأمني وسلاسل العمليات وحدود الصلاحيات تخدم الحماية والتحقيق مباشرة.');
assign(['net-1','net-2','net-3',...ids('network',1,10)],'CYBER_SUPPORTING','foundations','network','تفسير العناوين والمصادر والبروتوكولات والخدمات ومسار الاتصال أثناء فحص أمني.');
assign(['net-4',...ids('network',11,12)],'CYBER_CORE','foundations','network','ضبط المرور والتقسيم والاتصال المشفر عناصر حماية شبكية مباشرة.');
assign([...ids('linux',1,7),'linux-9','linux-10','linux-11'],'CYBER_SUPPORTING','foundations','systems','قراءة الطرفية والملفات والعمليات والخدمات والبحث في السجلات ضمن مختبر أمني.');
assign(['linux-8','linux-12'],'CYBER_CORE','foundations','systems','فحص الصلاحيات والسجلات يرتبط بحماية النظام وتحديد أثر النشاط.');
assign(['windows-1','windows-9'],'OUT_OF_SCOPE',null,null,'واجهة سطح مكتب أو تشخيص تعريفات عتاد، دون تحقيق أو ضابط أمني في الدرس الحالي.');
assign(['windows-2','windows-3','windows-5','windows-12'],'CYBER_SUPPORTING','foundations','systems','فهم موقع الملف وهوية الجهاز وأوامر قراءة العمليات عند التحقيق.');
assign(['windows-4','windows-6','windows-7','windows-8','windows-10','windows-11'],'CYBER_CORE','foundations','systems','تمويه الملفات والامتيازات والسياسة والسجلات والتصحيح الأمني تخدم الدفاع مباشرة.');
assign([...ids('py',1,5),...ids('py',7,11),...ids('py',15,17),'py-19'],'OUT_OF_SCOPE',null,null,'برمجة عامة أو مشروع نقاط؛ لا توجد مهمة أمنية مباشرة في محتوى هذا الدرس.');
assign(['py-6','py-12','py-13','py-14'],'CYBER_SUPPORTING','foundations','data','قراءة النصوص والملفات وJSON وCSV تساعد على تفسير مصادر الأدلة؛ ليست مسار برمجة افتراضيًا.');
assign(['py-18'],'CYBER_CORE','offensive','web','التحقق على الخادم وحدود المدخلات وعدم الثقة بزر الواجهة من أساسيات أمن التطبيق.');
assign(['py-20'],'CYBER_CORE','defensive','soc','تحليل سجلات دخول وهمية، مع بيان أن تكرار الفشل لا يثبت الاختراق وحده.');
assign(['sec-1','sec-2','sec-3','sec-4',...ids('security')],'CYBER_CORE','foundations','security','مبادئ أمن وحماية هوية وتهديدات ودفاع وتحقق واستعادة بعد حادث.');
assign(['web-4'],'OUT_OF_SCOPE',null,null,'تنسيق صفحات وCSS واستجابة بصرية؛ لا تحليل ثغرة أو حماية في المحتوى الحالي.');
assign([...ids('web',1,3),...ids('web',5,11)],'CYBER_SUPPORTING','foundations','data','بنية صفحة وURL وHTTP وCookies وSession وAPI لفهم التصيد وأمن التطبيق.');
assign(['web-12'],'CYBER_CORE','foundations','data','الأصل الواحد حد أمني يضبط تفاعل الصفحات.');
assign(ids('web-security'),'CYBER_CORE','offensive','web','ثغرات التطبيق والتحقق من التفويض والمدخلات والجلسات وطرق المعالجة.');
assign(ids('network-security',1,2),'CYBER_CORE','offensive','surface','فهم الخدمات والمنافذ وسطح التعرض قبل اختبار مصرح به.');
assign(ids('network-security',3,12),'CYBER_CORE','defensive','network','ضوابط مرور ومراقبة وتقسيم واتصال آمن وخط أساس للدفاع.');
assign(ids('soc'),'CYBER_CORE','defensive','soc','مصادر الرصد والفرز والفرضية والارتباط وتوثيق قرار المحلل.');
assign(ids('forensics'),'CYBER_CORE','investigation','evidence','سياق الدليل وسلامته وحيازته والخط الزمني وحدود الاستنتاج.');
assign(ids('crypto'),'CYBER_CORE','foundations','security','السرية والتجزئة وكلمات المرور والشهادات وإدارة الثقة والمفاتيح.');
assign(['cloud-1','cloud-2','cloud-4','cloud-8','cloud-11'],'CYBER_SUPPORTING','defensive','identity','سياق الخدمة ومكان البيانات والشبكة والاستعادة لفهم الدفاع السحابي.');
assign(['cloud-3','cloud-5','cloud-6','cloud-7','cloud-9','cloud-10','cloud-12'],'CYBER_CORE','defensive','identity','المسؤولية الأمنية والهوية والأسرار والوصول والتدقيق والتكوين.');
assign(ids('iam'),'CYBER_CORE','defensive','identity','التحقق من الهوية والتفويض ودورة الحساب وأقل امتياز.');
assign(ids('response'),'CYBER_CORE','investigation','response','الفرز والاحتواء وحفظ الدليل وتحديد النطاق والاستعادة.');
assign(['tools-1'],'CYBER_CORE','offensive','surface','حدود التفويض والبيئة المسموح فحصها جزء من الاختبار الأخلاقي.');
assign(['tools-2'],'CYBER_SUPPORTING','foundations','systems','قراءة الأوامر النصية لتكرار فحص وتحليل سجل.');
assign(['tools-3','tools-6','tools-11','tools-12'],'CYBER_CORE','investigation','evidence','ترشيح الدليل والبصمة وسجل التحليل والتحقق من مصدر مستقل.');
assign(['tools-4'],'CYBER_SUPPORTING','investigation','evidence','مقارنة نسخ سياسة أو ملف لكشف تغيير يحتاج تفسيرًا.');
assign(['tools-5'],'CYBER_CORE','defensive','network','تحليل حقول التقاط مصرح به أثناء فحص الاتصال.');
assign(['tools-7','tools-10'],'CYBER_SUPPORTING','offensive','surface','قراءة HTTP ومعلمات الأداة قبل تفسير نتائج فحص مصرح به.');
assign(['tools-8','tools-9'],'CYBER_CORE','defensive','soc','ربط أحداث SIEM وضبط قاعدة كشف موثقة.');
assign(['career-3','career-7','career-8','career-9'],'OUT_OF_SCOPE',null,null,'تنظيم تعلم أو سيرة أو ملف أعمال أو مقابلة؛ لا ممارسة أمنية مباشرة في هذا الدرس.');
assign(['career-1','career-2','career-11'],'CYBER_SUPPORTING','foundations','orientation','مرجع للأدوار والمهارات الأمنية والتعلم المستمر، وليس شرط تقدم جديدًا.');
assign(['career-4'],'CYBER_CORE','offensive','surface','الممارسة المصرح بها وحدود الخصوصية قبل أي اختبار أمني.');
assign(['career-5','career-6'],'CYBER_SUPPORTING','investigation','reporting','توثيق تحليل تدريبي قابل للتكرار وشرح البيئة والحدود.');
assign(['career-10','career-12'],'CYBER_CORE','investigation','reporting','فرضية من سجل وشرح قرار الحادث وما ثبت وما لم يثبت.');
export const contentScope:Readonly<Record<string,ContentPlacement>>=catalog;
export const scopeForLesson=(id:string)=>contentScope[id]?.scope??'OUT_OF_SCOPE';
export const isCyberLesson=(id:string)=>!!contentScope[id]&&scopeForLesson(id)!=='OUT_OF_SCOPE';
export function directionLessons(direction:CyberDirection){return lessons.filter(l=>isCyberLesson(l.id)&&contentScope[l.id].direction===direction)}
export function scopeCounts(){return Object.fromEntries((Object.keys(scopeLabels) as ContentScope[]).map(scope=>[scope,lessons.filter(l=>scopeForLesson(l.id)===scope).length])) as Record<ContentScope,number>}
export function scopeForTrack(trackId:string):ContentScope{const all=lessons.filter(l=>l.track===trackId);return all.some(l=>!isCyberLesson(l.id))?'OUT_OF_SCOPE':all.some(l=>scopeForLesson(l.id)==='CYBER_CORE')?'CYBER_CORE':'CYBER_SUPPORTING'}
export function scopeForHref(href:string):ContentScope{const path=href.split(/[?#]/)[0];if(path.startsWith('/learn/'))return scopeForLesson(decodeURIComponent(path.slice(7)));if(path.startsWith('/tracks/'))return scopeForTrack(decodeURIComponent(path.slice(8)));return 'CYBER_CORE'}
export const isCyberHref=(href:string)=>scopeForHref(href)!=='OUT_OF_SCOPE';
// Display context for historical track URLs; canonical track names/IDs stay intact.
export const cyberTrackLabels:Record<string,string>={it:'النظام والملفات والصلاحيات',network:'الاتصالات في السياق الأمني',linux:'Linux للدفاع والتحقيق',windows:'Windows للدفاع والتحقيق',python:'قراءة البيانات والتحليل الأمني',web:'الويب لفهم أمن التطبيقات',career:'الممارسة والتوثيق الأمني'};
