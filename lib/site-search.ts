import {scopeForHref,scopeOrder,type ContentScope} from './content-scope';
import {tracks,lessons,labs} from './curriculum';
import {interactiveLabs} from './interactive-labs';
import {missions} from './missions';
import {bossMissions} from './boss-missions';
import {socAlerts} from './soc-alerts';

export type SearchResult={href:string;title:string;description:string;section:'التعلّم'|'التدريب'|'العمليات'|'التقدم'|'حسابي';kind:string;level?:string;relatedTo?:string;scope?:ContentScope};
const originalSearchResults:SearchResult[]=[
 ...tracks.map(t=>({href:'/tracks/'+t.id,title:t.name,description:t.description,section:'التعلّم' as const,kind:'مسار'})),
 ...lessons.map(l=>({href:'/learn/'+l.id,title:l.title,description:`${tracks.find(t=>t.id===l.track)?.name||''} · ${l.module||'الأساسيات'} · ${l.intro}`,section:'التعلّم' as const,kind:'درس',level:String(l.level||1)})),
 ...interactiveLabs.map(l=>({href:'/labs/v2/'+l.id,title:l.title,description:l.description,section:'التدريب' as const,kind:'مختبر',level:l.difficulty})),
 ...labs.map(l=>({href:'/labs/'+l.id,title:l.title,description:l.description,section:'التدريب' as const,kind:'تدريب أساسي'})),
 ...missions.map(m=>({href:'/missions/'+m.id,title:m.title,description:m.description,section:'التدريب' as const,kind:'مهمة',level:m.difficulty})),
 ...bossMissions.map(m=>({href:'/bosses/'+m.id,title:m.title,description:m.description,section:'التدريب' as const,kind:'تحقيق متقدم',level:m.difficulty})),
 ...socAlerts.map(a=>({href:'/soc/alerts/'+a.id,title:a.title,description:a.summary,section:'العمليات' as const,kind:'تحقيق SOC'})),
 {href:'/soc',title:'مركز العمليات SOC',description:'قائمة التنبيهات والقضايا والتحقيقات التدريبية',section:'العمليات',kind:'بيئة عمليات'},
 {href:'/operations/nexacorp',title:'NexaCorp',description:'الشركة الافتراضية والأقسام والموظفون والأجهزة والخوادم وشبكات التدريب',section:'العمليات',kind:'سياق الشركة'},
 {href:'/campaigns/first-signal',title:'First Signal',description:'الحملة القصصية داخل NexaCorp',section:'العمليات',kind:'حملة'},
 {href:'/skills',title:'المهارات والإتقان',description:'Skill XP وMastery وتطور مهاراتك',section:'التقدم',kind:'تقدم'},
 {href:'/career',title:'المسار المهني',description:'الجاهزية ومتطلبات مراحل التدريب',section:'التقدم',kind:'تقدم'},
 {href:'/profile#ranks',title:'الرتبة والمستوى',description:'شارة إنجازك وتقدم المستوى والرتبة التالية',section:'التقدم',kind:'تقدم'},
 {href:'/achievements',title:'الإنجازات',description:'الشارات المكتسبة من نشاطك',section:'التقدم',kind:'تقدم'},
 {href:'/history',title:'سجل التعلم',description:'محاولاتك ونشاطك السابق',section:'حسابي',kind:'حساب'},
];

export const searchResults:SearchResult[]=originalSearchResults.map(result=>({...result,scope:scopeForHref(result.href)}));
const normalize=(s:string)=>s.toLocaleLowerCase().normalize('NFKC').replace(/[\u064b-\u065f]/g,'').trim();
export function searchSite(input:string){
 const q=normalize(input).slice(0,100);if(!q)return [];
 const direct=searchResults.map(result=>({result,weight:normalize(result.title).includes(q)?2:normalize(result.description).includes(q)?1:0})).filter(x=>x.weight).sort((a,b)=>scopeOrder[a.result.scope||'CYBER_CORE']-scopeOrder[b.result.scope||'CYBER_CORE']||b.weight-a.weight||a.result.title.localeCompare(b.result.title,'ar'));
 const related=new Map<string,string>();
 for(const match of direct){
  const lesson=lessons.find(l=>match.result.href==='/learn/'+l.id);if(!lesson)continue;
  const labs=interactiveLabs.filter(l=>l.relatedLessons.includes(lesson.id)||(lesson.relatedLabs||[]).includes(l.id));
  const missionIds=new Set([...(lesson.relatedMissions||[]),...(lesson.relatedBossMissions||[])]);
  const alertIds=new Set(lesson.relatedAlerts||[]);
  for(const lab of labs)related.set('/labs/v2/'+lab.id,lesson.title);
  for(const id of missionIds)related.set((id.startsWith('boss-')?'/bosses/':'/missions/')+id,lesson.title);
  for(const id of alertIds)related.set('/soc/alerts/'+id,lesson.title);
 }
 const seen=new Set<string>();
 return [...direct.map(x=>x.result),...searchResults.filter(r=>related.has(r.href)).map(r=>({...r,relatedTo:related.get(r.href)}))].filter(r=>{if(seen.has(r.href))return false;seen.add(r.href);return true}).sort((a,b)=>scopeOrder[a.scope||'CYBER_CORE']-scopeOrder[b.scope||'CYBER_CORE']).slice(0,80);
}
