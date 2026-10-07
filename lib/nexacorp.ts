/** Stable, read-only company definition. User progress lives in the existing APIs. */
export type EntityKind='department'|'employee'|'device'|'segment'|'service'|'account'|'email'|'asset';
export type EntityRef={kind:EntityKind;id:string};
export type Department={id:string;name:string;purpose:string};
export type Employee={id:string;name:string;role:string;departmentId:string;accountId:string;emailId:string;deviceIds:string[];campaignPersonId?:string};
export type Device={id:string;kind:'workstation'|'laptop'|'server'|'appliance';departmentId:string;segmentId?:string;ip?:string;description:string};
export type Segment={id:string;name:string;cidr:string;scope:'company'|'isolated-lab';description:string};
export type Service={id:string;name:string;deviceIds:string[];description:string};
export type Account={id:string;username:string;employeeId?:string;purpose:string};
export type EmailIdentity={id:string;address:string;employeeId:string;verifiedInContent:boolean};
export type ImportantAsset={id:string;name:string;deviceIds:string[];serviceIds:string[];description:string};

export const nexaCorp={
 id:'nexacorp',name:'NexaCorp',description:'شركة افتراضية واحدة تربط سياق الدعم التقني والهوية والبريد والخوادم والتحقيقات الأمنية في CyberLab. جميع أجهزتها وعناوينها تمثيلية.',
 departments:[
  {id:'finance',name:'المالية',purpose:'عمل المكتب والحسابات وحوادث البريد.'},
  {id:'it',name:'تقنية المعلومات',purpose:'الدعم والأنظمة والهوية وإدارة الأجهزة.'},
  {id:'hr',name:'الموارد البشرية',purpose:'خدمات الموظفين والبوابة الداخلية.'},
  {id:'security',name:'العمليات الأمنية',purpose:'فرز التنبيهات والاستجابة للحوادث.'}
 ] satisfies Department[],
 employees:[
  {id:'sami',name:'سامي ناصر',role:'فني دعم تقني',departmentId:'it',accountId:'sami',emailId:'sami',deviceIds:[],campaignPersonId:'it'},
  {id:'layla',name:'ليلى حداد',role:'محاسبة',departmentId:'finance',accountId:'layla',emailId:'layla',deviceIds:['WKST-02'],campaignPersonId:'finance'},
  {id:'maya',name:'مها عادل',role:'قائدة SOC',departmentId:'security',accountId:'maya',emailId:'maya',deviceIds:['WKST-05'],campaignPersonId:'soc'},
  {id:'adam',name:'آدم يوسف',role:'مسؤول أنظمة',departmentId:'it',accountId:'adam',emailId:'adam',deviceIds:['WIN-07'],campaignPersonId:'sysadmin'},
  {id:'sara',name:'سارة',role:'موظفة بوابة داخلية',departmentId:'hr',accountId:'sara',emailId:'sara',deviceIds:['WKST-03']}
 ] satisfies Employee[],
 segments:[
  {id:'office',name:'شبكة المكتب في السجلات',cidr:'192.0.2.0/24',scope:'company',description:'عناوين التوثيق المستخدمة في سجلات الموظفين والتنبيهات.'},
  {id:'practice-50',name:'شبكة مختبر الدعم المعزولة',cidr:'192.168.50.0/24',scope:'isolated-lab',description:'لقطة تدريب لشبكة المكتب؛ لا تُدمج عناوينها مع شبكة السجلات.'},
  {id:'practice-40',name:'شبكة تحقيق المكتب المعزولة',cidr:'192.168.40.0/24',scope:'isolated-lab',description:'لقطة The Broken Office المنفصلة عن مختبر الدعم.'}
 ] satisfies Segment[],
 devices:[
  {id:'WKST-02',kind:'workstation',departmentId:'finance',segmentId:'office',ip:'192.0.2.42',description:'جلسة ليلى في مختبر السجلات.'},
  {id:'WKST-03',kind:'workstation',departmentId:'hr',segmentId:'office',ip:'192.0.2.83',description:'جهاز سارة؛ عنوان العميل في سجلات بوابة WEB-01.'},
  {id:'WKST-05',kind:'workstation',departmentId:'security',segmentId:'office',ip:'192.0.2.145',description:'جهاز مها في تنبيهات SOC.'},
  {id:'WIN-07',kind:'laptop',departmentId:'it',segmentId:'office',ip:'192.0.2.48',description:'جهاز آدم في فحص تحديث العميل.'},
  {id:'AUTH-01',kind:'server',departmentId:'it',description:'بوابة المصادقة؛ مصدر التنبيه الخارجي ليس عنوانها.'},
  {id:'IDP-01',kind:'server',departmentId:'it',description:'مزود الهوية وجلسات حساب ليلى.'},
  {id:'DC-01',kind:'server',departmentId:'it',description:'خادم الدليل في تنبيه التغيير الإداري.'},
  {id:'WEB-01',kind:'server',departmentId:'it',description:'خادم البوابة؛ عنوان سارة في سجل Web هو عنوان العميل.'},
  {id:'MAIL-01',kind:'server',departmentId:'it',description:'خادم البريد في تحقيقات التصيد.'},
  {id:'APP-02',kind:'server',departmentId:'it',description:'خادم التطبيق في حادث منتصف الليل وسجلات النشاط.'},
  {id:'APP-01',kind:'server',departmentId:'it',description:'خادم تطبيق يظهر في تنبيه SOC المستقل.'},
  {id:'FILE-01',kind:'server',departmentId:'it',description:'خادم الملفات والنسخ الاحتياطي في القضية.'},
  {id:'FIN-01',kind:'workstation',departmentId:'finance',segmentId:'practice-50',ip:'192.168.50.21',description:'عنوان متوقع بعد إصلاح DHCP داخل مختبر الشبكة فقط.'},
  {id:'IT-02',kind:'workstation',departmentId:'it',segmentId:'practice-50',ip:'192.168.50.22',description:'جهاز الدعم داخل مختبر الشبكة المعزول.'}
 ] satisfies Device[],
 services:[
  {id:'identity',name:'الهوية والمصادقة',deviceIds:['AUTH-01','IDP-01','DC-01'],description:'تسجيل الدخول وإدارة حسابات الموظفين.'},
  {id:'mail',name:'البريد المؤسسي',deviceIds:['MAIL-01'],description:'رسائل الموظفين وإشارات التصيد.'},
  {id:'portal',name:'بوابة الموظفين',deviceIds:['WEB-01'],description:'طلبات الويب الداخلية.'},
  {id:'application',name:'خدمة التطبيق',deviceIds:['APP-02'],description:'ملفات التطبيق وسجلات خادم الحادث.'},
  {id:'files',name:'الملفات والنسخ',deviceIds:['FILE-01'],description:'الملفات والنسخ المجدولة.'}
 ] satisfies Service[],
 accounts:[
  ...(['sami','layla','maya','adam','sara'] as const).map(id=>({id,username:id,employeeId:id,purpose:'حساب موظف'})),
  {id:'admin',username:'admin',employeeId:undefined,purpose:'حساب إداري مشترك؛ لا تُنسب ملكيته إلى جهاز أو موظف دون دليل.'},
  {id:'atlas',username:'atlas',employeeId:undefined,purpose:'مالك ملفات خدمة التطبيق في المختبر.'},
  {id:'backup',username:'backup',employeeId:undefined,purpose:'حساب خدمة النسخ الاحتياطي.'}
 ] satisfies Account[],
 // The address pattern is model metadata; source content establishes the identities, not real mail delivery.
 emailIdentities:(['sami','layla','maya','adam','sara'] as const).map(id=>({id,address:`${id}@nexacorp.example`,employeeId:id,verifiedInContent:false})) satisfies EmailIdentity[],
 importantAssets:[
  {id:'surface-training',name:'بيئة تقييم سطح الهجوم التدريبية',deviceIds:[],serviceIds:[],description:'ثلاثة أصول افتراضية TRAIN-PORTAL وTRAIN-METRICS وTRAIN-ADMIN، مع سجلات وردود محددة. لا أجهزة أو عناوين حقيقية ولا اتصال بخدمات الشركة.'},
  {id:'session-training',name:'تطبيق ملف الموظف التدريبي',deviceIds:[],serviceIds:[],description:'محاكاة معزولة لجلسات وهمية A وB وبيانات ملف حساب سارة التدريبية. لا بيانات دخول أو Cookies حقيقية؛ لا تغيير لأي حساب شركة.'},
  {id:'access-training',name:'تطبيق التقارير التدريبي',deviceIds:[],serviceIds:[],description:'Asset معزول ومحاكى لتقييم صلاحيات قراءة تقارير وهمية فقط. لا يعمل على WEB-01 أو أي خادم شركة، ولا يملك عنوان شبكة أو بيانات دخول حقيقية.'},
  {id:'identity',name:'هوية الموظفين',deviceIds:['AUTH-01','IDP-01','DC-01'],serviceIds:['identity'],description:'تظهر في محاولات admin وجلسة ليلى.'},
  {id:'finance',name:'نقطة عمل المالية',deviceIds:['WKST-02','FIN-01'],serviceIds:[],description:'جهاز السجلات ومحاكاة شبكة الدعم سياقان منفصلان.'},
  {id:'application',name:'التطبيق والملفات',deviceIds:['APP-02','FILE-01'],serviceIds:['application','files'],description:'أصول تحقيق منتصف الليل.'}
 ] satisfies ImportantAsset[]
} as const;

export function resolveCompanyEntity(ref:EntityRef){const collections:Record<EntityKind,readonly {id:string}[]>={department:nexaCorp.departments,employee:nexaCorp.employees,device:nexaCorp.devices,segment:nexaCorp.segments,service:nexaCorp.services,account:nexaCorp.accounts,email:nexaCorp.emailIdentities,asset:nexaCorp.importantAssets};return collections[ref.kind].find(e=>e.id===ref.id)}
export function companyEntityAnchor(ref:EntityRef){return `/operations/nexacorp#${ref.kind}-${encodeURIComponent(ref.id)}`}
