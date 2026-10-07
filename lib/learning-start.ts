export type StartPreference={experience:'new'|'foundation'|'practiced';goal:'support'|'defense'|'explore'};
export function parseStartPreference(value:unknown):StartPreference|null{
 if(!value||typeof value!=='object')return null;
 const p=value as Record<string,unknown>;
 return typeof p.experience==='string'&&typeof p.goal==='string'&&['new','foundation','practiced'].includes(p.experience)&&['support','defense','explore'].includes(p.goal)?{experience:p.experience as StartPreference['experience'],goal:p.goal as StartPreference['goal']}:null;
}
export function startingActivity(p:StartPreference){
 if(p.experience!=='new'&&p.goal==='defense')return {href:'/experience/nexacorp-email',title:'رسالة تحتاج فحصًا',action:'افحص الرسالة',detail:'لديك أساس وتريد التحليل الأمني؛ ابدأ بمقارنة هوية المرسل والرابط قبل الانتقال إلى تحقيق متعدد المصادر.'};
 return {href:'/experience/nexacorp-first',title:'جهاز لا يصل إلى الخدمة',action:'افتح البلاغ',detail:p.goal==='support'?'هدفك الدعم والشبكات؛ ابدأ بتشخيص إعداد الجهاز واختبار نتيجة الإصلاح.':p.experience==='new'?'تبدأ من الصفر؛ تشخيص اتصال بسيط يبني أساس قراءة الإعدادات والأدلة قبل التحقيق الأمني.':'ابدأ بتجربة قصيرة على اتصال الشبكة، ثم استكشف البريد والتحقيقات حسب تقدمك.'};
}
