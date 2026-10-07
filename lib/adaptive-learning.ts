import {lessons} from './curriculum';
import {interactiveLabById} from './interactive-labs';
import {missionById} from './missions';
import {skillCatalog,type SkillId} from './skill-catalog';
import {socAlertById} from './soc-alerts';

export type MasteryBand='New'|'Developing'|'Proficient'|'Strong';
export type PracticeKind='lesson'|'mini-lab'|'full-lab'|'mission'|'review';
export type AdaptiveAttempt={id:string;score:number;total:number;createdAt:string;questions?:{index:number;correct:boolean;topic:string}[]};
export type AdaptiveRecord={id:string;score?:number;bestScore?:number;attempts:number;hintsUsed?:number;completedAt?:string|null;closedAt?:string|null;updatedAt:string;sessionJson:string};
export type AdaptiveInput={lessons:{id:string;completedAt:string}[];attempts:AdaptiveAttempt[];missions:AdaptiveRecord[];labs:AdaptiveRecord[];soc:AdaptiveRecord[];skillXp:{id:string;xp:number}[]};
export type Observation={sourceId:string;kind:'lesson'|'quiz'|'lab'|'mission'|'boss'|'soc';title:string;at:string;score:number;quality:number;weight:number;skills:SkillId[];subskills:string[];hints:number;mistakes:number;detail?:string};
export type MasteryState={id:string;name:string;xp:number;mastery:number|null;band:MasteryBand;confidence:'insufficient'|'emerging'|'established';samples:number;lastPracticed:string|null;subskills:{id:string;name:string;mastery:number|null;band:MasteryBand;samples:number}[]};
export type PracticeRecommendation={id:string;title:string;target:string;priority:'High'|'Medium'|'Review'|'Start';kind:PracticeKind;href:string;why:string[];mastery:number|null};

// Explicit curricular relationships, not aliases for Skill XP. New content can extend this catalog.
export const subskillCatalog=[
 {id:'network.dns',name:'تشخيص DNS',skills:['networking','troubleshooting'],lesson:'net-2',lab:'v2-terminal',mission:'002',labKind:'mini-lab',href:'/labs/v2/v2-terminal'},
 {id:'network.dhcp',name:'تشخيص DHCP',skills:['networking','troubleshooting'],lesson:'net-2',lab:'v2-network',mission:'001',labKind:'full-lab',href:'/labs/v2/v2-network'},
 {id:'network.ip',name:'عنونة IP',skills:['networking'],lesson:'net-2',lab:'v2-network',mission:'001',labKind:'full-lab',href:'/labs/v2/v2-network'},
 {id:'network.gateway',name:'البوابة والاتصال',skills:['networking','troubleshooting'],lesson:'net-2',lab:'v2-network',mission:'boss-001',labKind:'full-lab',href:'/labs/v2/v2-network'},
 {id:'linux.files',name:'البحث في الملفات',skills:['linux'],lesson:'linux-6',lab:'v2-terminal',mission:'005',labKind:'mini-lab',href:'/labs/v2/v2-terminal'},
 {id:'linux.permissions',name:'صلاحيات Linux',skills:['linux'],lesson:'linux-8',lab:'v2-terminal',mission:'005',labKind:'mini-lab',href:'/labs/v2/v2-terminal'},
 {id:'soc.logs',name:'تحليل السجلات',skills:['logs'],lesson:'soc-2',lab:'v2-logs',mission:'004',labKind:'full-lab',href:'/labs/v2/v2-logs'},
 {id:'soc.triage',name:'فرز التنبيهات',skills:['logs','cybersecurity'],lesson:'soc-7',lab:'v2-logs',mission:'004',labKind:'full-lab',href:'/labs/v2/v2-logs'},
 {id:'soc.response',name:'الاستجابة للحوادث',skills:['incident'],lesson:'response-1',lab:'v2-logs',mission:'boss-003',labKind:'full-lab',href:'/labs/v2/v2-logs'},
 {id:'security.phishing',name:'تحليل التصيّد',skills:['phishing','cybersecurity'],lesson:'sec-1',lab:'v2-email',mission:'003',labKind:'full-lab',href:'/labs/v2/v2-email'},
 {id:'web.http',name:'فحص HTTP',skills:['cybersecurity'],lesson:'web-2',lab:'v2-http',mission:'',labKind:'full-lab',href:'/labs/v2/v2-http'}
] as const;
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
const unique=<T>(items:T[])=>[...new Set(items)];
function parseSession(json:string):Record<string,unknown>{try{const v=JSON.parse(json);return v&&typeof v==='object'?v:{}}catch{return {}}}
function number(v:unknown){return typeof v==='number'&&Number.isFinite(v)?v:0}
function textDate(v:string|null|undefined){return v&&Number.isFinite(Date.parse(v))?v:''}
function lessonSkills(id:string):SkillId[]{const lesson=lessons.find(l=>l.id===id);if(lesson?.interaction&&lesson.skills?.length)return lesson.skills.filter((s):s is SkillId=>skillCatalog.some(entry=>entry.id===s));const track=lesson?.track;switch(track){case 'network':return ['networking','troubleshooting'];case 'linux':return ['linux'];case 'windows':return ['windows'];case 'security':case 'web-security':case 'network-security':case 'iam':return ['cybersecurity'];case 'web':return ['cybersecurity'];case 'soc':case 'forensics':return ['logs'];case 'response':return ['incident'];case 'it':return ['troubleshooting'];default:return []}}
function lessonSubskills(id:string):string[]{const focused:Record<string,string[]>={'network-5':['network.ip'],'network-8':['network.dns'],'network-9':['network.dhcp'],'security-8':['security.phishing'],'security-11':['soc.response'],'soc-2':['soc.logs'],'soc-7':['soc.triage'],'soc-10':['soc.response']};if(focused[id])return focused[id];if(id==='net-2')return [];if(id==='linux-8')return ['linux.permissions'];if(id==='linux-6'||id==='linux-4'||id==='linux-10')return ['linux.files'];if(id==='soc-7')return ['soc.triage'];if(id==='soc-2'||id==='soc-3'||id==='soc-4')return ['soc.logs'];if(id.startsWith('response-'))return ['soc.response'];if(id==='sec-1')return ['security.phishing'];if(id.startsWith('web-'))return ['web.http'];return []}
function questionSubskill(id:string,index:number,topic:string):string|null{
 if(id==='net-2')return ['network.dns','network.ip','network.dhcp'][index]||null;
 const t=topic.toLowerCase();if(/dns|النطاق|حل الاسم/.test(t))return 'network.dns';if(/dhcp|تأجير/.test(t))return 'network.dhcp';if(/gateway|بوابة/.test(t))return 'network.gateway';if(/\bip\b|ipv4|عنونة/.test(t))return 'network.ip';if(/chmod|صلاحيات|أذونات linux/.test(t))return 'linux.permissions';if(/فرز|triage/.test(t))return 'soc.triage';return null;
}
function missionSubskills(id:string):string[]{switch(id){case '001':return ['network.dhcp','network.ip'];case '002':return ['network.dns'];case '003':return ['security.phishing'];case '004':return ['soc.logs','soc.triage'];case '005':return ['linux.files'];case 'boss-001':return ['network.dhcp','network.ip','network.gateway','network.dns'];case 'boss-002':return ['security.phishing','soc.logs','soc.response'];case 'boss-003':return ['soc.logs','soc.triage','soc.response'];default:return []}}
function labSubskills(id:string,session:Record<string,unknown>){switch(id){case 'v2-terminal':return session.terminalScenarioId==='dns'?['network.dns']:['linux.files'];case 'v2-network':return ['network.ip','network.dhcp','network.gateway','network.dns'];case 'v2-logs':return ['soc.logs','soc.triage'];case 'v2-email':return ['security.phishing'];case 'v2-http':return ['web.http'];default:return []}}
function socSubskills(id:string,session:Record<string,unknown>):string[]{const alert=socAlertById(id);if(!alert)return [];return unique(['soc.triage',...(alert.type==='Email'?['security.phishing']:['soc.logs']),...(alert.skillRewards.some(r=>r.skill==='incident')||number(session.prematureDecisions)>0?['soc.response']:[])]);
}
function quality(score:number,hints:number,mistakes:number,retakes:number){return clamp(Math.round(score-Math.min(9,hints*3)-Math.min(12,mistakes*3)-Math.min(7,Math.max(0,retakes)*2)))}
export function buildObservations(input:AdaptiveInput):Observation[]{const list:Observation[]=[];
 const attempts=new Map<string,AdaptiveAttempt[]>();for(const a of input.attempts){if(a.total<=0||!lessons.some(l=>l.id===a.id))continue;attempts.set(a.id,[...(attempts.get(a.id)||[]),a])}
 for(const rows of attempts.values())rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 for(const [id,rows] of attempts){const latest=rows[0],title=lessons.find(l=>l.id===id)?.title||id,score=clamp(Math.round(latest.score/latest.total*100)),previousFailures=rows.slice(1).filter(r=>r.score/r.total<2/3).length,at=textDate(latest.createdAt);if(!at)continue;
  list.push({sourceId:'lesson:'+id,kind:'quiz',title:'اختبار '+title,at,score,quality:quality(score,0,Math.min(2,previousFailures),0),weight:.95,skills:lessonSkills(id),subskills:lessonSubskills(id),hints:0,mistakes:previousFailures});
  for(const q of latest.questions||[]){const sub=questionSubskill(id,q.index,q.topic);if(sub)list.push({sourceId:'lesson:'+id,kind:'quiz',title:'سؤال '+q.topic+' في '+title,at,score:q.correct?100:0,quality:q.correct?100:0,weight:.75,skills:[],subskills:[sub],hints:0,mistakes:q.correct?0:1,detail:q.correct?'إجابة صحيحة':'إجابة تحتاج مراجعة'});}
 }
 for(const r of input.missions){const m=missionById(r.id),s=parseSession(r.sessionJson),result=(s.lastResult&&typeof s.lastResult==='object'?s.lastResult:{}) as Record<string,unknown>,at=textDate(typeof result.score==='number'?r.updatedAt:r.completedAt)||textDate(r.completedAt);if(!m||!r.completedAt||!at)continue;const mistakes=Array.isArray(result.mistakes)?result.mistakes.length:Array.isArray(s.mistakes)?s.mistakes.length:0,hints=number(result.hintsUsed)||Math.min(number(s.hintsUsed),m.hints.length),score=clamp(typeof result.score==='number'?result.score:number(r.score));
  list.push({sourceId:'mission:'+r.id,kind:m.kind==='boss'?'boss':'mission',title:(m.kind==='boss'?'Boss Mission ':'مهمة ')+m.title,at,score,quality:quality(score,hints,mistakes,Math.max(0,r.attempts-1)),weight:m.kind==='boss'?1.45:1.2,skills:unique(m.skillRewards.map(x=>x.skill).filter((x):x is SkillId=>skillCatalog.some(s=>s.id===x))),subskills:missionSubskills(r.id),hints,mistakes});}
 for(const r of input.labs){const lab=interactiveLabById(r.id),s=parseSession(r.sessionJson),result=(s.lastResult&&typeof s.lastResult==='object'?s.lastResult:{}) as Record<string,unknown>,passed=result.passed===true,failed=result.passed===false,previous=!!r.completedAt,attempted=r.attempts>0,at=textDate(passed||failed?r.updatedAt:r.completedAt)||textDate(r.updatedAt);if(!lab||!at||(!previous&&!attempted))continue;const score=clamp(passed||failed?number(result.score):number(r.bestScore)),hints=previous&&!passed&&!failed?0:number(s.hintsUsed),mistakes=previous&&!passed&&!failed?0:number(s.mistakes);
  list.push({sourceId:'lab:'+r.id,kind:'lab',title:'مختبر '+lab.title+(r.id==='v2-terminal'&&s.terminalScenarioId==='dns'?' · DNS':''),at,score,quality:quality(score,hints,mistakes,Math.max(0,r.attempts-1)),weight:1.15,skills:lab.skills,subskills:labSubskills(r.id,s),hints,mistakes});}
 for(const r of input.soc){const alert=socAlertById(r.id),s=parseSession(r.sessionJson),result=(s.lastResult&&typeof s.lastResult==='object'?s.lastResult:{}) as Record<string,unknown>,at=textDate(r.closedAt)||textDate(r.updatedAt);if(!alert||(!r.closedAt&&!r.bestScore)||!at)continue;const score=clamp(typeof result.score==='number'?result.score:typeof r.score==='number'?r.score:number(r.bestScore)),mistakes=number(s.prematureDecisions)+(result.classificationCorrect===false?1:0)+(result.responseCorrect===false?1:0),subskills=socSubskills(r.id,s),skills=unique(alert.skillRewards.map(x=>x.skill).filter((x):x is SkillId=>skillCatalog.some(s=>s.id===x)));
  list.push({sourceId:'soc:'+r.id,kind:'soc',title:'تحقيق SOC '+alert.title,at,score,quality:quality(score,0,mistakes,Math.max(0,r.attempts-1)),weight:1.3,skills,subskills,hints:0,mistakes});
  if(result.priorityCorrect===false)list.push({sourceId:'soc:'+r.id,kind:'soc',title:'فرز '+alert.title,at,score:25,quality:25,weight:.6,skills:[],subskills:['soc.triage'],hints:0,mistakes:1,detail:'أولوية الفرز لم تطابق الأدلة'});
  if(result.responseCorrect===false)list.push({sourceId:'soc:'+r.id,kind:'soc',title:'استجابة '+alert.title,at,score:25,quality:25,weight:.6,skills:[],subskills:['soc.response'],hints:0,mistakes:1,detail:'إجراء الاستجابة يحتاج مراجعة'});
 }
 return list;
}
function summarize(records:Observation[],now:Date){if(!records.length)return {mastery:null,band:'New' as MasteryBand,confidence:'insufficient' as const,samples:0,lastPracticed:null};const sources=unique(records.map(r=>r.sourceId)),kinds=unique(records.map(r=>r.kind)),prior=3.2;let weighted=prior*60,total=prior;
 for(const r of records){const age=Math.max(0,(now.getTime()-Date.parse(r.at))/86400000),recency=Math.max(.55,1-Math.min(365,age)/365*.45),weight=Math.min(1.5,r.weight)*recency;weighted+=r.quality*weight;total+=weight}
 const cap=Math.min(38,9+sources.length*4),mastery=Math.round(clamp(weighted/total,60-cap,60+cap)),band:MasteryBand=sources.length<2?'New':mastery>=79&&sources.length>=4&&kinds.length>=2?'Strong':mastery>=69?'Proficient':'Developing';
 return {mastery,band,confidence:sources.length<2?'insufficient' as const:sources.length<4||kinds.length<2?'emerging' as const:'established' as const,samples:sources.length,lastPracticed:records.map(r=>r.at).sort().at(-1)||null};}
function evidenceReasons(records:Observation[]){const ranked=[...records].sort((a,b)=>a.quality-b.quality||b.at.localeCompare(a.at)),hinted=[...records].filter(r=>r.hints).sort((a,b)=>b.hints-a.hints)[0],question=ranked.find(r=>r.detail&&r.quality<70),scored=ranked.find(r=>r.score<78&&r!==hinted&&r!==question&&r.kind!=='quiz')||ranked.find(r=>r.score<78&&r!==hinted&&r!==question),reasons:string[]=[];
 if(hinted)reasons.push(`استخدمت ${hinted.hints} ${hinted.hints===2?'تلميحين':'تلميحات'} في ${hinted.title}.`);
 if(question)reasons.push(`${question.detail} في ${question.title}.`);
 if(scored)reasons.push(`كانت النتيجة ${scored.score}/100 في ${scored.title}.`);
 if(!reasons.length&&ranked[0]?.mistakes)reasons.push(`سُجلت ${ranked[0].mistakes} أخطاء أثناء ${ranked[0].title}.`);
 return unique(reasons).slice(0,3);
}
function actionFor(sub:typeof subskillCatalog[number],input:AdaptiveInput){const lessonDone=input.lessons.some(l=>l.id===sub.lesson),labDone=input.labs.some(l=>l.id===sub.lab&&!!l.completedAt),missionDone=input.missions.some(m=>m.id===sub.mission&&!!m.completedAt),unlock=missionById(sub.mission)?.unlock,unlocked=!unlock||(!unlock.lessons?.some(id=>!input.lessons.some(l=>l.id===id))&&!unlock.missions?.some(id=>!input.missions.some(m=>m.id===id&&!!m.completedAt))&&!unlock.skills?.some(s=>Math.floor((input.skillXp.find(x=>x.id===s.id)?.xp||0)/200)+1<s.level));
 if(!lessonDone)return {kind:'lesson' as PracticeKind,title:'راجع درس '+(lessons.find(l=>l.id===sub.lesson)?.title||sub.name),href:'/learn/'+sub.lesson};
 if(!labDone)return {kind:sub.labKind as PracticeKind,title:sub.id==='network.dns'?'جرّب سيناريو DNS في الطرفية':'جرّب '+(interactiveLabById(sub.lab)?.title||sub.name),href:sub.href};
 if(sub.mission&&!missionDone&&unlocked)return {kind:'mission' as PracticeKind,title:'طبّق في '+(missionById(sub.mission)?.title||sub.name),href:(sub.mission.startsWith('boss-')?'/bosses/':'/missions/')+sub.mission};
 return {kind:sub.labKind as PracticeKind,title:'أعد تدريب '+sub.name,href:sub.href};}
export function evaluateAdaptive(input:AdaptiveInput,now=new Date()){const evidence=buildObservations(input),substates=new Map(subskillCatalog.map(sub=>[sub.id,summarize(evidence.filter(e=>e.subskills.includes(sub.id)),now)])),mastery:MasteryState[]=skillCatalog.map(skill=>{const state=summarize(evidence.filter(e=>e.skills.includes(skill.id)),now);return {id:skill.id,name:skill.name,xp:input.skillXp.find(x=>x.id===skill.id)?.xp||0,...state,subskills:subskillCatalog.filter(sub=>(sub.skills as readonly string[]).includes(skill.id)).map(sub=>({id:sub.id,name:sub.name,...((s)=>({mastery:s.mastery,band:s.band,samples:s.samples}))(substates.get(sub.id)!)}))}});
 const candidates:{item:PracticeRecommendation;rank:number}[]=[];
 for(const sub of subskillCatalog){const state=substates.get(sub.id)!,records=evidence.filter(e=>e.subskills.includes(sub.id));if(state.mastery===null||state.mastery>=72||!records.some(r=>r.quality<73||r.hints>0||r.mistakes>0))continue;const hints=records.reduce((n,r)=>n+r.hints,0),mistakes=records.reduce((n,r)=>n+r.mistakes,0),multi=state.samples>=2,priority:PracticeRecommendation['priority']=state.mastery<63&&multi?'High':'Medium',action=actionFor(sub,input),why=evidenceReasons(records);
  if(!why.length)why.push('تظهر نتائج التدريب المحفوظة فرصة لممارسة إضافية.');if(sub.id==='network.dns'&&action.kind==='mini-lab')why.push('اختر سيناريو تشخيص DNS داخل الطرفية.');
  candidates.push({item:{id:sub.id,title:action.title,target:sub.name,priority,kind:action.kind,href:action.href,why,mastery:state.mastery},rank:(priority==='High'?90:55)+(72-state.mastery)+Math.min(15,hints*3+mistakes*2)+Math.min(6,state.samples)});
 }
 for(const skill of mastery){if(skill.mastery===null||skill.mastery<69||!skill.lastPracticed)continue;const days=(now.getTime()-Date.parse(skill.lastPracticed))/86400000;if(days<45)continue;const lesson=evidence.filter(e=>e.skills.some(id=>id===skill.id)&&e.kind==='quiz').sort((a,b)=>b.at.localeCompare(a.at))[0];const id=lesson?.sourceId.replace('lesson:','')||subskillCatalog.find(s=>(s.skills as readonly string[]).includes(skill.id))?.lesson;if(!id)continue;candidates.push({item:{id:'review:'+skill.id,title:'مراجعة سريعة · '+skill.name,target:skill.name,priority:'Review',kind:'review',href:'/learn/'+id,why:[`مر ${Math.floor(days)} يومًا منذ آخر ممارسة محفوظة لهذه المهارة.`],mastery:skill.mastery},rank:30+Math.min(30,days/10)});}
 candidates.sort((a,b)=>b.rank-a.rank||a.item.id.localeCompare(b.item.id));const recommendations:PracticeRecommendation[]=[],links=new Set<string>();for(const {item} of candidates){if(links.has(item.href))continue;recommendations.push(item);links.add(item.href);if(recommendations.length===4)break;}
 if(!evidence.length)recommendations.push({id:'start:network',title:'ابدأ أساسيات الشبكات',target:'خطوتك الأولى',priority:'Start',kind:'lesson',href:'/learn/net-1',why:['لا توجد نتائج محفوظة كافية لتقدير إتقانك بعد؛ ابدأ بدرس قصير ثم جرّب مختبرًا.'],mastery:null});
 const needsPractice=subskillCatalog.map(sub=>({id:sub.id,name:sub.name,...substates.get(sub.id)!})).filter(s=>s.mastery!==null&&s.mastery<69&&evidence.some(e=>e.subskills.includes(s.id)&&(e.quality<73||e.hints>0||e.mistakes>0))).sort((a,b)=>(a.mastery??0)-(b.mastery??0)).slice(0,3).map(({id,name,mastery,samples})=>({id,name,mastery,samples}));
 const strongSkills=mastery.filter(s=>s.band==='Strong').sort((a,b)=>(b.mastery||0)-(a.mastery||0)).slice(0,3).map(({id,name,mastery,samples})=>({id,name,mastery,samples}));
 return {mastery,recommendations,needsPractice,strongSkills,observations:evidence.length};
}
