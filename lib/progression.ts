import {rankForXp,tiers} from './ranks';
export const rankTitles:Record<string,string>={core:'الأساس',vector:'الاتجاه',circuit:'الترابط',protocol:'المنهج',signal:'الإشارة',sentinel:'الحارس',horizon:'الأفق'};
export const skillTitles:Record<string,string>={networking:'الشبكات',linux:'Linux',windows:'Windows',cybersecurity:'أساسيات الأمن السيبراني',phishing:'تحليل التصيد',logs:'تحليل السجلات',incident:'الاستجابة للحوادث',troubleshooting:'التشخيص بالأدلة'};
export const careerTitles:Record<string,string>={beginner:'بداية الرحلة','it-support-trainee':'أساسيات التشخيص','it-technician':'أساسيات الأنظمة','network-technician':'أساسيات الشبكات','cybersecurity-trainee':'متدرب الأمن السيبراني','junior-soc-analyst':'التأهب للتحليل الأمني','soc-analyst':'التأهب للاستجابة الأمنية'};
export const points=(n:number)=>`${n} ${Number.isInteger(n)&&n>=3&&n<=10?'نقاط':'نقطة'}`;
export const progressionCopy=(s:string)=>s.replace(/(\d+)\/(\d+)/g,'$1 من $2');
export const completedLessonText=(n:number)=>n===0?'لا دروس مكتملة بعد':n===1?'درس واحد مكتمل':n===2?'درسان مكتملان':`${n} ${n<=10?'دروس مكتملة':'درسًا مكتملًا'}`;
export function levelPath(xp:number){const r=rankForXp(xp),within=r.xp%200;const levels=[...new Set([Math.max(1,r.level-1),r.level,r.level+1,...(r.next&&r.next.minLevel>r.level+1?[r.next.minLevel]:[])])];return {...r,within,required:200,percent:within/2,toNext:200-within,nextLevel:r.level+1,path:levels.map(level=>({level,current:level===r.level,milestone:tiers.find(t=>t.minLevel===level)||null}))};}
export type AchievementDefinition={id:string;title:string;description:string;icon:'mission'|'investigation'|'soc'|'correlation'|'phishing'|'offensive'|'chain'|'mastery'|'level'|'legacy';thresholds:number[];legacy?:boolean};
// Extends the existing six badge IDs; awards never carry currency or XP.
export const achievementCatalog:AchievementDefinition[]=[
 {id:'first-mission',title:'أول قرار ميداني',description:'أكمل مهمة داخل المحاكاة.',icon:'mission',thresholds:[1]},
 {id:'investigator',title:'المحقق',description:'أغلق تحقيقات باستنتاج صحيح وأدلة مترابطة؛ يُحسب كل تحقيق مختلف مرة واحدة.',icon:'investigation',thresholds:[1,3,6]},
 {id:'soc-response',title:'مستجيب التنبيهات',description:'أكمل تحليل تنبيهات SOC بقرار واستجابة صحيحين.',icon:'soc',thresholds:[1,3,6]},
 {id:'correlation',title:'حلقة الأدلة',description:'اربط كيانين بعلاقة صحيحة، مع دليلين مطلوبين من مصدرين مختلفين واستنتاج صحيح.',icon:'correlation',thresholds:[1]},
 {id:'phishing',title:'قراءة ما وراء الرسالة',description:'أكمل مهمة الرسالة المشبوهة وأثبت قرارك بالأدلة.',icon:'phishing',thresholds:[1]},
 {id:'offensive-foundations',title:'التقييم الآمن',description:'أكمل تقييمات سطح الهجوم والتحكم بالوصول والجلسات. إنجاز تدريبي، وليس تأهيلًا مهنيًا.',icon:'offensive',thresholds:[1,3]},
 {id:'incident-chain',title:'متابعة أثر الحادث',description:'أكمل المراحل الثلاث المترابطة في متابعة ليلى باستنتاجات صحيحة.',icon:'chain',thresholds:[1]},
 {id:'mastery',title:'مهارة مثبتة',description:'حقق إتقان «متمكن» أو «قوي» في مهارة بناءً على أدلة الأداء.',icon:'mastery',thresholds:[1]},
 {id:'level-milestone',title:'محطات التقدم',description:'ارفع مستواك للوصول إلى الرتبة التالية.',icon:'level',thresholds:tiers.slice(1).map(t=>t.minLevel)},
 ...[{id:'first',title:'الخطوة الأولى',description:'أكمل درسًا واحدًا.',thresholds:[1]},{id:'five',title:'مواظب',description:'أكمل خمسة دروس.',thresholds:[5]},{id:'explorer',title:'مستكشف المسارات',description:'تعلم في ثلاثة مسارات.',thresholds:[3]},{id:'labs',title:'مجرّب آمن',description:'أكمل مختبرًا آمنًا.',thresholds:[1]},{id:'streak',title:'عادة التعلم',description:'سجل تعلمًا في ثلاثة أيام متتالية في أي وقت؛ لا تحتاج للحفاظ على سلسلة يومية.',thresholds:[3]},{id:'track',title:'مسار مكتمل',description:'أكمل مسارًا كاملًا.',thresholds:[1]}].map(a=>({...a,icon:'legacy' as const,legacy:true}))
];
export type AchievementUnlock={id:string;tier:number;earnedAt:string;proof:string[]};
export type AchievementState=AchievementDefinition&{value:number;target:number;earnedTier:number;earnedAt:string|null;state:'locked'|'progress'|'earned';percent:number;complete:boolean};
export function achievementStates(values:Record<string,number>,unlocks:AchievementUnlock[]):AchievementState[]{return achievementCatalog.map(a=>{const earned=unlocks.filter(u=>u.id===a.id&&Number.isInteger(u.tier)&&u.tier>0&&u.tier<=a.thresholds.length);const earnedTier=Math.max(0,...earned.map(u=>u.tier)),complete=earnedTier===a.thresholds.length,value=Math.max(values[a.id]||0,earnedTier?a.thresholds[earnedTier-1]:0),target=a.thresholds[complete?earnedTier-1:earnedTier];return {...a,value,target,earnedTier,earnedAt:earned.find(u=>u.tier===earnedTier)?.earnedAt||null,state:earnedTier?'earned':value?'progress':'locked',percent:Math.min(100,value/target*100),complete}})}
export type ProgressionData={xp:number;level:ReturnType<typeof levelPath>;achievements:AchievementState[];goal:{href:string;title:string;detail:string;action:string};mastery:{id:string;mastery:number|null;samples:number;band:string;xp:number}[];career:{id:string;title:string;readiness:number;next:string|null};newUnlocks:AchievementUnlock[]};
