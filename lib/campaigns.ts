/** Narrative metadata only. All cases point to existing mission IDs. */
export type CampaignPerson={id:string;name:string;role:string;department:string;initial:string};
export type CampaignEvent={id:string;time:string;title:string;detail:string;chapterId:string;afterMission?:string};
export type CampaignEvidence={id:string;title:string;detail:string;sourceMission:string;chapterId:string};
export type CampaignChapter={id:string;number:number;title:string;subtitle:string;briefing:{time:string;label:string;text:string;speaker:string};debrief:string;missionIds:string[];people:string[]};
export type Campaign={id:string;title:string;description:string;company:string;prerequisites:string[];people:CampaignPerson[];chapters:CampaignChapter[];events:CampaignEvent[];evidence:CampaignEvidence[]};

export const firstSignal:Campaign={
 id:'first-signal',title:'First Signal',company:'NexaCorp',description:'من بلاغات الدعم الأولى إلى تحقيق أمني ليلي. ستعيد فحص قضايا أنجزتها بالفعل في سياق حادث واحد يتكشف تدريجيًا.',prerequisites:[],
 people:[
  {id:'it',name:'سامي ناصر',role:'فني IT',department:'الدعم التقني',initial:'سن'},
  {id:'finance',name:'ليلى حداد',role:'محاسبة',department:'المالية',initial:'لح'},
  {id:'soc',name:'مها عادل',role:'SOC Lead',department:'الأمن',initial:'مع'},
  {id:'sysadmin',name:'آدم يوسف',role:'System Administrator',department:'الأنظمة',initial:'أي'}
 ],
 chapters:[
  {id:'first-day',number:1,title:'First Day',subtitle:'يومك الأول في فريق الدعم',briefing:{time:'08:42',label:'Help Desk Ticket',text:'ورد بلاغ من المالية: جهاز لا يتصل بالشبكة. ابدأ بعنوان IP وتأجير DHCP، ثم افحص حل الأسماء وبقية أجهزة المكتب.',speaker:'it'},debrief:'عاد الاتصال للمكتب. احتفظ بتفاصيل DNS؛ لا نعرف بعد إن كانت جميع الإشارات مجرد أعطال اعتيادية.',missionIds:['001','002','boss-001'],people:['it','finance']},
  {id:'the-message',number:2,title:'The Message',subtitle:'رسالة خارج سياق اليوم',briefing:{time:'10:16',label:'Inbox Escalation',text:'أرسلت ليلى رسالة تطلب رمز تحقق. افحص الترويسة والرابط داخل المحاكاة قبل إصدار قرار.',speaker:'finance'},debrief:'أظهرت الترويسة Return-Path على account-review.example ورابطًا على login-check.example. سُجل النطاقان في ملف القضية؛ تحقق مما إذا تبع الرسالة نشاط دخول غير معتاد.',missionIds:['003'],people:['finance','soc']},
  {id:'something-wrong',number:3,title:'Something Is Wrong',subtitle:'تتسارع محاولات الدخول',briefing:{time:'13:12',label:'Authentication Alert',text:'رصد فريق الأمن فشل دخول متكررًا على admin من 198.51.100.24. قارن النمط بإشارة البريد، ولا تفترض أن العنوان نفسه هو مرسل الرسالة.',speaker:'soc'},debrief:'عُزل المصدر 198.51.100.24 في التدريب. لا يثبت التشابه الزمني أنه مصدر رسالة التصيّد؛ لدى الفريق الآن فرضية تحتاج إلى أدلة إضافية.',missionIds:['004'],people:['soc','sysadmin']},
  {id:'phishing-incident',number:4,title:'The Phishing Incident',subtitle:'أحد الموظفين تفاعل مع الرسالة',briefing:{time:'14:08',label:'Incident Brief',text:'تبيّن أن موظفة تفاعلت مع رسالة مشابهة. اجمع البريد وسجلات المصادقة ونشاط المستخدم على خط زمني قبل قرار الاحتواء.',speaker:'soc'},debrief:'ظهرت جلسة غير اعتيادية لحساب ليلى من 198.51.100.77. هذا عنوان مختلف عن 198.51.100.24 في بلاغ admin؛ قارن الأدلة ولا تدمج المصدرين دون سند.',missionIds:['boss-002'],people:['finance','soc']},
  {id:'after-hours',number:5,title:'After Hours',subtitle:'جولة في ملفات الخادم',briefing:{time:'20:34',label:'Systems Check',text:'راجع بيئة ملفات التدريب الخاصة بالخدمة. ابحث عن config/app.conf ومالكها، ووثّق ما تستطيع إثباته قبل تسليم النوبة الليلية.',speaker:'sysadmin'},debrief:'حُفظ مسار config/app.conf واسم المالك atlas في ملاحظات القضية. هذه معلومات بيئة الخدمة وليست وحدها دليل اختراق؛ ستساعد على مقارنة سياق الجهاز في التحقيق التالي.',missionIds:['005'],people:['sysadmin','soc']},
  {id:'midnight-breach',number:6,title:'Midnight Breach',subtitle:'تجميع الخيوط في تحقيق SOC',briefing:{time:'02:51',label:'SOC Escalation',text:'وصل تنبيه جديد بعد دخول غير معتاد عند 02:37. افحص الحساب والأجهزة والأوقات والـIP؛ استعن بسجل البريد ومحاولات الدخول السابقة كسياق، واحكم فقط من الأدلة الجديدة.',speaker:'soc'},debrief:'اكتمل ملف First Signal. ربطت مراحل الدعم والرسائل ومحاولات الدخول والتنبيهات ضمن تسلسل تحقيق واحد، مع الحفاظ على التمييز بين المؤشرات المختلفة.',missionIds:['boss-003'],people:['soc','sysadmin']}
 ],
 events:[
  {id:'network',time:'08:42',title:'Network issue reported',detail:'بلاغ اتصال من المالية، وفحص إعدادات DHCP وDNS.',chapterId:'first-day'},
  {id:'office',time:'09:20',title:'Office network restored',detail:'عولجت أعطال عدة أجهزة في The Broken Office.',chapterId:'first-day',afterMission:'boss-001'},
  {id:'email',time:'10:16',title:'Suspicious email received',detail:'Return-Path: account-review.example؛ الرابط: login-check.example.',chapterId:'the-message',afterMission:'003'},
  {id:'interaction',time:'10:41',title:'Employee interaction recorded',detail:'كشف تحقيق البريد تفاعل ليلى وجلسة من 198.51.100.77.',chapterId:'phishing-incident',afterMission:'boss-002'},
  {id:'attempts',time:'13:12',title:'Failed login attempts detected',detail:'تكررت المحاولات على admin من 198.51.100.24؛ عنوان مستقل عن جلسة ليلى.',chapterId:'something-wrong',afterMission:'004'},
  {id:'systems',time:'20:34',title:'Service configuration checked',detail:'config/app.conf، مالك الخدمة atlas.',chapterId:'after-hours',afterMission:'005'},
  {id:'login',time:'02:37',title:'Successful unusual login',detail:'يعرض التحقيق الليلي تفاصيل الحساب والمصدر بعد إنجاز Midnight Breach.',chapterId:'midnight-breach',afterMission:'boss-003'},
  {id:'alert',time:'02:51',title:'Security alert triggered',detail:'تسلسل APP-02 وFILE-01 في تحقيق SOC.',chapterId:'midnight-breach',afterMission:'boss-003'}
 ],
 evidence:[
  {id:'network-settings',title:'ملاحظات الشبكة',detail:'DHCP وDNS وبوابة المكتب من تحقيقات الدعم.',sourceMission:'boss-001',chapterId:'first-day'},
  {id:'email-domains',title:'نطاقات الرسالة',detail:'account-review.example وlogin-check.example؛ مؤشرات رسالة تدريب افتراضية.',sourceMission:'003',chapterId:'the-message'},
  {id:'admin-ip',title:'مصدر محاولات admin',detail:'198.51.100.24 · محاولات فاشلة متكررة.',sourceMission:'004',chapterId:'something-wrong'},
  {id:'layla-session',title:'جلسة ليلى',detail:'198.51.100.77 · عنوان مختلف، ظهر في تحقيق التصيّد.',sourceMission:'boss-002',chapterId:'phishing-incident'},
  {id:'service-owner',title:'ملف إعداد الخدمة',detail:'config/app.conf · مالك الخدمة atlas.',sourceMission:'005',chapterId:'after-hours'},
  {id:'soc-trace',title:'مسار التنبيه الليلي',detail:'حساب maya · 203.0.113.86 · APP-02 وFILE-01 وفق أدلة التحقيق.',sourceMission:'boss-003',chapterId:'midnight-breach'}
 ]
};
export const campaigns=[firstSignal];
export function campaignById(id:string){return campaigns.find(c=>c.id===id)}
export function campaignMissionPath(id:string){return (id.startsWith('boss-')?'/bosses/':'/missions/')+encodeURIComponent(id)}
export function campaignChapterForMission(id:string){return firstSignal.chapters.find(c=>c.missionIds.includes(id))}
