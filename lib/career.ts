import {lessons} from './curriculum';
import {interactiveLabById} from './interactive-labs';
import {missionById} from './missions';
import {skillCatalog} from './skill-catalog';
import {subskillCatalog,type MasteryState,type PracticeRecommendation} from './adaptive-learning';

export type CareerInput={lessons:string[];labs:string[];missions:string[];soc:{id:string;score:number}[];mastery:MasteryState[];recommendations:PracticeRecommendation[]};
export type CareerRequirement={kind:'lesson'|'lab'|'mission'|'boss'|'mastery'|'subskill'|'soc-count'|'soc-quality';id:string;minimum?:number;weight?:number};
export type CareerStage={id:string;title:string;description:string;requirements:CareerRequirement[]};
export type CareerTrack={id:string;title:string;stages:CareerStage[]};
export type RequirementState=CareerRequirement&{label:string;done:boolean;current:number|null;href:string};
export type CareerPractice={title:string;href:string;reason:string};
export type StageState=CareerStage&{readiness:number;eligible:boolean;requirementsState:RequirementState[];careerPractice:CareerPractice|null};

// Each stage is a training milestone, never a certification or employment claim.
// New career branches can be added as independent tracks with the same evaluator.
export const careerTracks:CareerTrack[]=[{id:'foundation',title:'رحلة تقنية المعلومات والأمن',stages:[
 {id:'beginner',title:'Beginner',description:'بداية التدريب العملي في CyberLab.',requirements:[]},
 {id:'it-support-trainee',title:'IT Support Trainee',description:'فهم بيئة الدعم الفني ومبادئ تشخيص المشكلات.',requirements:[{kind:'lesson',id:'it-1'},{kind:'mastery',id:'troubleshooting',minimum:65}]},
 {id:'it-technician',title:'IT Technician',description:'التحقيق في الملفات والأعطال عبر أدوات عملية.',requirements:[{kind:'lab',id:'v2-terminal'},{kind:'mission',id:'005'},{kind:'mastery',id:'linux',minimum:68}]},
 {id:'network-technician',title:'Network Technician',description:'تشخيص الاتصال وDNS عبر أكثر من نوع تدريب.',requirements:[{kind:'lesson',id:'net-1'},{kind:'lab',id:'v2-network'},{kind:'mission',id:'001'},{kind:'mission',id:'002'},{kind:'mastery',id:'networking',minimum:70},{kind:'subskill',id:'network.dns',minimum:68}]},
 {id:'cybersecurity-trainee',title:'Cybersecurity Trainee',description:'تحليل البريد المشبوه وربط الأدلة الأمنية.',requirements:[{kind:'lesson',id:'sec-1'},{kind:'lab',id:'v2-email'},{kind:'mission',id:'003'},{kind:'mastery',id:'cybersecurity',minimum:69},{kind:'mastery',id:'phishing',minimum:69}]},
 {id:'junior-soc-analyst',title:'Junior SOC Analyst',description:'فرز التنبيهات وربط الأدلة واتخاذ قرار الاستجابة.',requirements:[{kind:'lab',id:'v2-logs'},{kind:'mission',id:'004'},{kind:'boss',id:'boss-002'},{kind:'soc-count',id:'closed',minimum:2},{kind:'mastery',id:'cybersecurity',minimum:72},{kind:'mastery',id:'logs',minimum:72},{kind:'mastery',id:'incident',minimum:70},{kind:'subskill',id:'soc.triage',minimum:68}]},
 {id:'soc-analyst',title:'SOC Analyst',description:'تحقيقات متعددة بجودة متسقة واحتواء حادث مركب.',requirements:[{kind:'boss',id:'boss-003'},{kind:'soc-count',id:'closed',minimum:4},{kind:'soc-quality',id:'score-70',minimum:3},{kind:'mastery',id:'logs',minimum:79},{kind:'mastery',id:'incident',minimum:78},{kind:'subskill',id:'soc.response',minimum:70}]}
]}];

function labelOf(r:CareerRequirement){switch(r.kind){
 case 'lesson':return 'أكمل درس '+(lessons.find(x=>x.id===r.id)?.title||r.id);
 case 'lab':return 'أكمل مختبر '+(interactiveLabById(r.id)?.title||r.id);
 case 'mission':case 'boss':return 'أكمل '+(r.kind==='boss'?'Boss Mission ':'مهمة ')+(missionById(r.id)?.title||r.id);
 case 'mastery':return 'إتقان '+(skillCatalog.find(x=>x.id===r.id)?.name||r.id)+' ≥ '+r.minimum+'%';
 case 'subskill':return 'إتقان '+(subskillCatalog.find(x=>x.id===r.id)?.name||r.id)+' ≥ '+r.minimum+'%';
 case 'soc-count':return 'أكمل '+r.minimum+' تحقيقات SOC';
 case 'soc-quality':return 'أنهِ '+r.minimum+' تحقيقات SOC بنتيجة 70% أو أكثر';
 }}
function hrefOf(r:CareerRequirement){switch(r.kind){case 'lesson':return '/learn/'+r.id;case 'lab':return '/labs/v2/'+r.id;case 'mission':return '/missions/'+r.id;case 'boss':return '/bosses/'+r.id;case 'soc-count':case 'soc-quality':return '/soc';case 'subskill':return subskillCatalog.find(x=>x.id===r.id)?.href||'/skills';case 'mastery':return '/skills'}}
export function evaluateCareer(input:CareerInput,track=careerTracks[0],reachedIndex=0){
 const lessonSet=new Set(input.lessons),labSet=new Set(input.labs),missionSet=new Set(input.missions);
 const stages:StageState[]=track.stages.map(stage=>{const requirementsState=stage.requirements.map(r=>{
  const skill=input.mastery.find(s=>s.id===r.id),sub=input.mastery.flatMap(s=>s.subskills).find(s=>s.id===r.id);
  const current=r.kind==='mastery'?skill?.mastery??null:r.kind==='subskill'?sub?.mastery??null:r.kind==='soc-count'?input.soc.length:r.kind==='soc-quality'?input.soc.filter(s=>s.score>=70).length:null;
  const done=r.kind==='lesson'?lessonSet.has(r.id):r.kind==='lab'?labSet.has(r.id):r.kind==='mission'||r.kind==='boss'?missionSet.has(r.id):r.kind==='mastery'?skill?.mastery!==null&&skill?.mastery!==undefined&&(skill?.samples||0)>=2&&skill.mastery>=(r.minimum||0):r.kind==='subskill'?sub?.mastery!==null&&sub?.mastery!==undefined&&(sub?.samples||0)>=2&&sub.mastery>=(r.minimum||0):(current||0)>=(r.minimum||0);
  return {...r,label:labelOf(r),href:hrefOf(r),done,current};
 });
 const readiness=requirementsState.length?Math.round(requirementsState.reduce((sum,r)=>sum+(r.done?1:r.kind==='mastery'||r.kind==='subskill'?Math.min(.85,Math.max(0,(r.current||0)/(r.minimum||1))*.7):r.kind==='soc-count'||r.kind==='soc-quality'?Math.min(.85,(r.current||0)/(r.minimum||1)*.7):0)*(r.weight||1),0)/requirementsState.reduce((sum,r)=>sum+(r.weight||1),0)*100):100;
 const gap=requirementsState.filter(r=>!r.done),practice=gap.find(r=>r.kind==='subskill'||r.kind==='mastery');
 const related=practice?.kind==='mastery'?subskillCatalog.find(s=>(s.skills as readonly string[]).includes(practice.id)):undefined;
 const adaptiveMatch=practice&&input.recommendations.find(rec=>rec.id===practice.id||rec.id===related?.id||rec.target===subskillCatalog.find(s=>s.id===practice.id)?.name);
 const careerPractice=practice?{title:adaptiveMatch?.title||('تدريب '+(practice.kind==='subskill'?subskillCatalog.find(s=>s.id===practice.id)?.name:skillCatalog.find(s=>s.id===practice.id)?.name||practice.id)),href:adaptiveMatch?.href||related?.href||practice.href,reason:'موصى به لهدفك المهني '+stage.title+': '+practice.label+(practice.current!==null?' · حاليًا '+practice.current+'%':' · يلزم تقييم عملي')+'.'}:gap[0]?{title:gap[0].label,href:gap[0].href,reason:'المتطلب التالي للوصول إلى '+stage.title+'.'}:null;
 return {...stage,requirementsState,readiness,eligible:requirementsState.every(r=>r.done),careerPractice};
 });
 // Promotion is strictly sequential, even when a later stage has been satisfied.
 let index=Math.max(0,Math.min(stages.length-1,reachedIndex));while(index+1<stages.length&&stages[index+1].eligible)index++;
 const current=stages[index],next=stages[index+1]||null;
 return {trackId:track.id,trackTitle:track.title,stages,current,next,currentIndex:index,careerPractice:next?.careerPractice||null};
}
