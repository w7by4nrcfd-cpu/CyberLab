export type AnswerRule={acceptedAnswers:string[];aliases?:string[];keywords?:{all:string[][];none?:string[]}[]};
export type MissionTool = {id:string;label:string;command?:string;output:string;after?:{toolId:string;output:string}};
export type MissionEvidence = {id:string;title:string;content:string;occurredAt?:string};
export type MissionObjective = {id:string;label:string;kind:'evidence'|'tool'|'solve'|'decision';target:string;dependsOn?:string[];optional?:boolean};
export type MissionDecision = {id:string;label:string;prompt:string;rule:AnswerRule;dependsOn:string[];feedback:string};
export type Mission = {
 id:string;title:string;description:string;difficulty:'مبتدئ'|'متوسط'|'متقدم';requiredSkills:string[];kind?:'boss';unlock?:{lessons?:string[];missions?:string[];skills?:{id:string;level:number}[]};intro?:string;networkView?:{id:string;label:string;description:string}[];decisions?:MissionDecision[];
 objectives:MissionObjective[];scenario:string;tools:MissionTool[];evidence:MissionEvidence[];
 hints:string[];successConditions:{evidence:string[];tools:string[];answers:Record<string,AnswerRule>};
 xpReward:number;skillRewards:{skill:string;points:number}[];
 scoreRules:{base:number;hintPenalty:number;mistakePenalty:number;minimum:number;threeStars:number;twoStars:number};
 relatedLessons:string[];answerFields:{id:string;label:string;placeholder:string}[];
};
const rules={base:100,hintPenalty:15,mistakePenalty:12,minimum:40,threeStars:90,twoStars:70};
export const missions:Mission[]=[
 {id:'001',title:'No Internet',description:'افحص جهازًا لا يتصل بالشبكة وحدد سبب المشكلة وأصلحه داخل المحاكاة.',difficulty:'مبتدئ',requiredSkills:['IP','DHCP','أساسيات الطرفية'],scenario:'وصلت بلاغًا: جهاز التدريب متصل بالكابل، لكنه لا يصل إلى بوابة الشبكة. عنوان البوابة 192.168.50.1. افحص الإعدادات وسجل DHCP قبل اتخاذ إجراء.',
  objectives:[{id:'ip',label:'افحص إعدادات IP بالطرفية',kind:'tool',target:'ipconfig'},{id:'lease',label:'اقرأ سجل خدمة DHCP',kind:'evidence',target:'lease'},{id:'repair',label:'أصلح الخدمة ثم جدّد العنوان',kind:'tool',target:'renew'},{id:'solve',label:'قدّم التشخيص والإجراء',kind:'solve',target:'solve'}],
  tools:[{id:'ipconfig',label:'عرض إعدادات الشبكة',command:'ipconfig',output:'IPv4: 169.254.42.18\nSubnet: 255.255.0.0\nGateway: —\nDHCP: enabled'},
   {id:'ping-gateway',label:'اختبار البوابة',command:'ping 192.168.50.1',output:'Request timed out · 0/4 replies',after:{toolId:'renew',output:'Reply from 192.168.50.1 · 4/4 replies'}},
   {id:'start-dhcp',label:'تشغيل خدمة DHCP الافتراضية',command:'service dhcp start',output:'Training DHCP service: running'},
   {id:'renew',label:'تجديد عنوان الجهاز',command:'ipconfig /renew',output:'لا يمكن تجديد العنوان: خدمة DHCP متوقفة.',after:{toolId:'start-dhcp',output:'IPv4: 192.168.50.24\nGateway: 192.168.50.1\nLease renewed (simulation).'}}],
  evidence:[{id:'lease',title:'سجل تأجير العناوين',content:'08:41 DISCOVER from training-pc\n08:41 no DHCPOFFER · DHCP service stopped\n08:43 cable link up'},{id:'cable',title:'مؤشر المنفذ',content:'Link: UP · speed: 1 Gbps · cable error count: 0'}],
  hints:['العنوان 169.254.x.x يظهر عندما لا يحصل الجهاز على عنوان من DHCP.','قارن حالة الخدمة بسجل تأجير العناوين، ثم أعد طلب العنوان.'],
  successConditions:{evidence:['lease'],tools:['ipconfig','start-dhcp','renew'],answers:{cause:{acceptedAnswers:['dhcp','خدمة dhcp','توقف dhcp','توقف خدمة dhcp'],aliases:['تعطل خدمة توزيع العناوين','dhcp server stopped'],keywords:[{all:[['dhcp','تأجير العناوين'],['متوقف','متوقفة','تعطل','لا يعمل','failed','stopped']],none:['ليس','ليس السبب','not']}]},action:{acceptedAnswers:['تجديد العنوان','تشغيل dhcp','تشغيل خدمة dhcp ثم تجديد العنوان','start dhcp then renew'],aliases:['إعادة تشغيل خدمة DHCP وتجديد IP','تشغيل الخدمة ثم طلب عنوان جديد'],keywords:[{all:[['تشغيل','اعادة تشغيل','start','restart'],['dhcp','الخدمة'],['تجديد','طلب عنوان','renew']],none:['دون تجديد','بدون تجديد','لا اجدد','لا اشغل']}]}}},
  xpReward:120,skillRewards:[{skill:'networking',points:80},{skill:'troubleshooting',points:40}],scoreRules:rules,relatedLessons:['net-1','net-2'],
  answerFields:[{id:'cause',label:'ما السبب الجذري؟',placeholder:'مثال: خدمة ...'},{id:'action',label:'ما الإجراء الذي أصلح الاتصال؟',placeholder:'اذكر الإجراء الذي نفذته'}]},
 {id:'002',title:'DNS Problem',description:'الاتصال يعمل بالأرقام، لكن أسماء المواقع لا تُحل. اعزل الخلل وأصلحه.',difficulty:'مبتدئ',requiredSkills:['DNS','IP','فحص الاتصال'],scenario:'جهاز المختبر يستطيع الوصول إلى 203.0.113.10، لكن portal.training لا يفتح. لا تفترض أن الإنترنت كله متعطل. افحص عنوان DNS ثم اختبر الاسم بعد تغيير الإعداد الافتراضي.',
  objectives:[{id:'ip',label:'تحقق من وصول IP',kind:'tool',target:'ping-ip'},{id:'dns',label:'افحص ملف إعداد DNS',kind:'evidence',target:'resolver'},{id:'test',label:'اختبر حل الاسم وأصلح الإعداد',kind:'tool',target:'set-dns'},{id:'solve',label:'قدّم التشخيص والإجراء',kind:'solve',target:'solve'}],
  tools:[{id:'ping-ip',label:'اختبار العنوان الرقمي',command:'ping 203.0.113.10',output:'Reply from 203.0.113.10 · 4/4 replies (simulated)'},
   {id:'nslookup',label:'فحص حل الاسم',command:'nslookup portal.training',output:'DNS request timed out · server 192.0.2.53',after:{toolId:'set-dns',output:'portal.training → 203.0.113.10 · resolver 1.1.1.1 (simulated)'}},
   {id:'set-dns',label:'تغيير محلّل DNS الافتراضي',command:'set-dns 1.1.1.1',output:'Resolver changed to 1.1.1.1 (simulation only).'}],
  evidence:[{id:'resolver',title:'إعداد محلّل الأسماء',content:'DNS server: 192.0.2.53\nInterface: up\nDefault gateway: 192.168.50.1'},{id:'status',title:'حالة الخدمة',content:'Gateway reachable. Web server 203.0.113.10 reachable. Resolver 192.0.2.53 unreachable.'}],
  hints:['إذا نجح الوصول إلى IP وفشل الاسم، ابدأ بخدمة DNS.','أعد اختبار الاسم بعد تغيير المحلّل داخل المحاكاة.'],
  successConditions:{evidence:['resolver'],tools:['ping-ip','nslookup','set-dns'],answers:{cause:{acceptedAnswers:['dns','تعطل dns','خادم dns','محلل dns','محلّل dns'],aliases:['فشل خادم أسماء النطاقات','تعذر حل أسماء المواقع'],keywords:[{all:[['dns','حل الاسم','اسماء النطاقات'],['فشل','تعطل','لا يعمل','غير متاح']],none:['ليس','not']}]},action:{acceptedAnswers:['تغيير dns','تغيير خادم dns','تعيين dns','set-dns 1.1.1.1'],aliases:['استبدال محلل الأسماء بخادم صالح','ضبط DNS على 1.1.1.1'],keywords:[{all:[['تغيير','تعيين','ضبط','استبدال'],['dns','محلل الاسم','خادم الاسم']]}]}}},
  xpReward:120,skillRewards:[{skill:'networking',points:80},{skill:'troubleshooting',points:40}],scoreRules:rules,relatedLessons:['net-2','net-3'],
  answerFields:[{id:'cause',label:'أين وقع الخلل؟',placeholder:'ما الخدمة المعطلة؟'},{id:'action',label:'كيف أصلحته؟',placeholder:'ما الإعداد الذي غيّرته؟'}]},
 {id:'003',title:'Suspicious Email',description:'حلّل رسالة مشبوهة من خلال الترويسة والوجهة قبل اتخاذ قرار.',difficulty:'مبتدئ',requiredSkills:['Phishing','تحليل الرسائل','اتخاذ القرار'],scenario:'وصلت رسالة تدّعي أنها من فريق الحسابات وتطلب إدخال رمز التحقق فورًا. العنوان الظاهر يبدو مألوفًا، لكن الرابط وجهة مختلفة. افحص الترويسة ومعاينة الرابط وحدد الأدلة قبل التعامل معها.',
  objectives:[{id:'headers',label:'افحص ترويسة الرسالة',kind:'evidence',target:'headers'},{id:'link',label:'عاين الرابط دون فتحه',kind:'evidence',target:'link'},{id:'verify',label:'تحقق من مؤشرات الاحتيال',kind:'tool',target:'analyze'},{id:'solve',label:'حدّد الإجراء والأدلة',kind:'solve',target:'solve'}],
  tools:[{id:'analyze',label:'تجميع مؤشرات الرسالة',output:'عدم تطابق نطاق المرسل الظاهر مع Return-Path، ورابط خارجي يطلب رمز تحقق. لا تفتح الرابط ولا تشارك الرمز.'}],
  evidence:[{id:'message',title:'نص الرسالة',content:'من: فريق الحسابات <support@cyberlab.example>\nالموضوع: تحقّق الآن\nانتهت جلستك. أرسل رمز التحقق خلال 5 دقائق لاستعادة الحساب.'},
   {id:'headers',title:'تفاصيل الترويسة',content:'From: support@cyberlab.example\nReturn-Path: verify@account-review.example\nAuthentication-Results: SPF fail · DKIM none'},
   {id:'link',title:'معاينة الرابط (دون فتح)',content:'النص الظاهر: افتح حسابك\nالوجهة: https://login-check.example/verify-code\nهذه وجهة تدريب وهمية داخل الرسالة.'}],
  hints:['لا تعتمد على الاسم الظاهر؛ اقرأ Return-Path ونتائج التحقق.','طلب رمز تحقق مع رابط على نطاق مختلف مؤشر قوي للتصيّد.'],
  successConditions:{evidence:['headers','link'],tools:['analyze'],answers:{clues:{acceptedAnswers:['return-path,link','link,return-path','spf,link','link,spf','المرسل والرابط','اختلاف المرسل والرابط'],aliases:['فشل SPF مع رابط تصيد','اختلاف Return-Path ووجهة الرابط'],keywords:[{all:[['return path','spf','المرسل','نطاق الارسال'],['رابط','الوجهة','link','نطاق مختلف']]}]},action:{acceptedAnswers:['إبلاغ وحظر','ابلاغ وحظر','عزل الرسالة والإبلاغ','الإبلاغ عن الرسالة','report and quarantine'],aliases:['حجر الرسالة والتبليغ عنها','لا أفتح الرابط وأبلغ فريق الأمن'],keywords:[{all:[['ابلاغ','تبليغ','report'],['عزل','حجر','حظر','لا افتح','عدم فتح','quarantine']],none:['عدم الابلاغ','لا ابلغ','افتح الرابط','شارك الرمز']}]}}},
  xpReward:140,skillRewards:[{skill:'phishing',points:80},{skill:'cybersecurity',points:40}],scoreRules:rules,relatedLessons:['sec-1','net-2'],
  answerFields:[{id:'clues',label:'اذكر مؤشرين من الأدلة',placeholder:'مثال: Return-Path,link'},{id:'action',label:'ما الإجراء الآمن؟',placeholder:'الإبلاغ و...'}]},
 {id:'004',title:'Failed Login Attempts',description:'افحص سجلات دخول وحدد المصدر والحساب المستهدف من نمط المحاولات.',difficulty:'متوسط',requiredSkills:['تحليل السجلات','حماية الحسابات','عناوين IP'],scenario:'ظهر ارتفاع في محاولات الدخول الفاشلة خلال دقيقة. افحص السجل، رشّح الفشل، واجمعه حسب المصدر. سجلات المحاكاة فقط؛ لا تتعامل مع أجهزة حقيقية.',
  objectives:[{id:'logs',label:'افحص سجل الدخول',kind:'evidence',target:'logs'},{id:'filter',label:'رشّح محاولات الفشل',kind:'tool',target:'failures'},{id:'group',label:'اجمع المحاولات حسب المصدر',kind:'tool',target:'group-ip'},{id:'solve',label:'حدد IP والحساب والإجراء',kind:'solve',target:'solve'}],
  tools:[{id:'failures',label:'إظهار محاولات الفشل فقط',output:'09:02 admin · 198.51.100.24 · failed\n09:02 admin · 198.51.100.24 · failed\n09:03 admin · 198.51.100.24 · failed\n09:03 user1 · 203.0.113.18 · failed'},
   {id:'group-ip',label:'تجميع الفشل حسب IP',output:'198.51.100.24 → 3 failures / admin\n203.0.113.18 → 1 failure / user1'}],
  evidence:[{id:'logs',title:'سجلات الدخول',content:'09:00 user1 · 203.0.113.18 · success\n09:02 admin · 198.51.100.24 · failed\n09:02 admin · 198.51.100.24 · failed\n09:03 admin · 198.51.100.24 · failed\n09:03 user1 · 203.0.113.18 · failed\n09:04 analyst · 192.0.2.9 · success'},
   {id:'context',title:'سياق الفريق',content:'لم يعلن مسؤول المختبر عن أي اختبار دخول على حساب admin بين 09:00 و09:05.'}],
  hints:['ابحث عن التكرار خلال فترة قصيرة، لا عن فشل مفرد.','تظهر ثلاث محاولات على admin من المصدر نفسه.'],
  successConditions:{evidence:['logs'],tools:['failures','group-ip'],answers:{ip:{acceptedAnswers:['198.51.100.24'],aliases:['IP: 198.51.100.24']},account:{acceptedAnswers:['admin'],aliases:['حساب admin','المسؤول admin']},action:{acceptedAnswers:['تنبيه الفريق وحظر المصدر','حظر المصدر والإبلاغ','حظر ip وتنبيه الفريق','block and report'],aliases:['حظر 198.51.100.24 وإبلاغ الأمن','أبلغ الفريق وأحظر عنوان IP المشبوه'],keywords:[{all:[['حظر','منع','block'],['ابلاغ','تنبيه','report','اخطار']]}]}}},
  xpReward:150,skillRewards:[{skill:'logs',points:80},{skill:'incident',points:40}],scoreRules:rules,relatedLessons:['net-2','sec-2'],
  answerFields:[{id:'ip',label:'عنوان IP المشبوه',placeholder:'198.51.100.x'},{id:'account',label:'الحساب المستهدف',placeholder:'اسم الحساب'},{id:'action',label:'ما قرارك؟',placeholder:'حظر المصدر وإبلاغ الفريق'}]},
 {id:'005',title:'Linux File Hunt',description:'استخدم طرفية تدريب للعثور على ملف إعداد ومعلومة مطلوبة دون Shell حقيقي.',difficulty:'متوسط',requiredSkills:['Linux','البحث في الملفات','قراءة الإعدادات'],scenario:'في نظام ملفات تدريبي، طُلب العثور على ملف إعداد التطبيق واسم مالك الخدمة. استكشف المسارات بأوامر محددة داخل المحاكاة ثم قدّم المسار والاسم.',
  objectives:[{id:'readme',label:'اقرأ تعليمات المجلد',kind:'tool',target:'readme'},{id:'find',label:'ابحث عن ملف الإعداد',kind:'tool',target:'find'},{id:'config',label:'اقرأ الملف المناسب',kind:'tool',target:'config'},{id:'solve',label:'قدّم المسار واسم المالك',kind:'solve',target:'solve'}],
  tools:[{id:'pwd',label:'معرفة المجلد الحالي',command:'pwd',output:'/srv/training'},
   {id:'ls',label:'استعراض المجلد',command:'ls',output:'README.txt  config/  notes/'},
   {id:'readme',label:'قراءة التعليمات',command:'cat README.txt',output:'Find the application config under config/. Its service owner is documented inside the file.'},
   {id:'find',label:'البحث عن ملفات conf',command:'find . -name *.conf',output:'./config/app.conf\n./config/test.conf'},
   {id:'config',label:'قراءة إعداد التطبيق',command:'cat config/app.conf',output:'[application]\nname = training-portal\nowner = atlas\nmode = sandbox'},
   {id:'test-config',label:'قراءة إعداد الاختبار',command:'cat config/test.conf',output:'[test]\nowner = test-runner\nmode = sandbox'}],
  evidence:[{id:'request',title:'طلب الفريق',content:'ابحث عن ملف إعداد التطبيق الحقيقي app.conf. المطلوب المسار النسبي واسم owner، وليس ملف الاختبار test.conf.'}],
  hints:['ابدأ بـ ls ثم اقرأ README.txt.','استخدم find، ثم اقرأ app.conf لمعرفة owner.'],
  successConditions:{evidence:[],tools:['readme','find','config'],answers:{path:{acceptedAnswers:['config/app.conf','./config/app.conf','/srv/training/config/app.conf'],aliases:['مسار الملف config/app.conf']},owner:{acceptedAnswers:['atlas'],aliases:['owner = atlas','المالك atlas']}}},
  xpReward:150,skillRewards:[{skill:'linux',points:80},{skill:'troubleshooting',points:40}],scoreRules:rules,relatedLessons:['linux-1','linux-2'],
  answerFields:[{id:'path',label:'مسار ملف التطبيق',placeholder:'config/...'},{id:'owner',label:'اسم مالك الخدمة',placeholder:'owner = ...'}]}
];
import {bossMissions} from './boss-missions';
export const allMissions:Mission[]=[...missions,...bossMissions];
export const missionById=(id:string)=>allMissions.find(m=>m.id===id);
