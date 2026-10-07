import {missionById,type Mission} from './missions';
import {acceptsAnswer} from './answer-evaluation';
export type InvestigationEvent={at:string;label:string;kind:'evidence'|'tool'|'decision'|'mistake'};
export type InvestigationReport={objectives:string[];evidence:string[];decisions:string[];mistakes:string[];hintsUsed:number;skillsDemonstrated:string[];skillsNeedingPractice:string[]};
export type MissionSession={inspected:string[];usedTools:string[];decisions:string[];timeline:InvestigationEvent[];transcript:{input:string;output:string}[];hintsUsed:number;mistakes:string[];replaying:boolean;lastResult?:{score:number;stars:number;xpGranted:boolean;hintsUsed:number;mistakes:string[];report?:InvestigationReport}};
export const freshSession=():MissionSession=>({inspected:[],usedTools:[],decisions:[],timeline:[],transcript:[],hintsUsed:0,mistakes:[],replaying:false});
export type MissionAction={action:'start'|'inspect'|'tool'|'hint'|'solve'|'replay'|'decide';id:string;evidenceId?:string;toolId?:string;decisionId?:string;response?:string;command?:string;answers?:Record<string,string>};
export function objectiveDone(mission:Mission,session:MissionSession,completed:boolean,id:string):boolean{const o=mission.objectives.find(o=>o.id===id);return !!o&&(o.kind==='solve'?completed&&!session.replaying:o.kind==='tool'?session.usedTools.includes(o.target):o.kind==='decision'?session.decisions.includes(o.target):session.inspected.includes(o.target))}
export function objectiveReady(mission:Mission,session:MissionSession,id:string){const o=mission.objectives.find(o=>o.id===id);return !o?.dependsOn?.some(required=>!objectiveDone(mission,session,false,required))}
export function progressFor(mission:Mission,session:MissionSession,completed:boolean){
 const count=mission.objectives.filter(o=>objectiveDone(mission,session,completed,o.id)).length;
 return Math.round(count/mission.objectives.length*100);
}
export function applyMissionAction(mission:Mission,previous:MissionSession,action:MissionAction):{session:MissionSession;message:string;completed?:{score:number;stars:number}}{
 const session:MissionSession={...previous,inspected:[...previous.inspected],usedTools:[...previous.usedTools],decisions:[...(previous.decisions||[])],timeline:[...(previous.timeline||[])],transcript:[...previous.transcript],mistakes:[...previous.mistakes]};
 const event=(kind:InvestigationEvent['kind'],label:string)=>{session.timeline.push({at:new Date().toISOString(),kind,label});session.timeline=session.timeline.slice(-60)};
 const premature=(label:string)=>{session.mistakes.push(label);event('mistake',label);return {session,message:'اجمع الأدلة وأنجز الأهداف السابقة قبل هذا الإجراء.'}};
 if(action.action==='replay')return {session:{...freshSession(),replaying:true},message:'بدأت إعادة المهمة. لن تُمنح النقاط مرة أخرى.'};
 if(action.action==='start')return {session,message:'بدأت المهمة. افحص الأدلة واستخدم الأدوات.'};
 if(action.action==='inspect'){
  const evidence=mission.evidence.find(e=>e.id===action.evidenceId);
  if(!evidence)throw Error('الدليل غير موجود.');
  const objective=mission.objectives.find(o=>o.kind==='evidence'&&o.target===evidence.id);
  if(objective&&!objectiveReady(mission,session,objective.id))return premature('فحص دليل قبل إنجاز أهدافه السابقة');
  if(!session.inspected.includes(evidence.id)){session.inspected.push(evidence.id);event('evidence',evidence.title)}
  return {session,message:`فُتح الدليل: ${evidence.title}`};
 }
 if(action.action==='hint'){
  if(session.hintsUsed>=mission.hints.length)return {session,message:'استُخدمت كل التلميحات.'};
  return {session:{...session,hintsUsed:session.hintsUsed+1},message:mission.hints[session.hintsUsed]};
 }
 if(action.action==='tool'){
  const command=typeof action.command==='string'?action.command.trim().replace(/\s+/g,' '):'';
  if(command.length>120)throw Error('الأمر طويل جدًا.');
  const tool=mission.tools.find(t=>t.id===action.toolId || (command&&t.command===command));
  if(!tool || (command&&tool.command!==command)){
   session.mistakes.push('أمر خارج أدوات المحاكاة');
   event('mistake','أمر خارج أدوات المحاكاة');
   session.transcript.push({input:command||'أداة غير معروفة',output:'الأمر غير متاح في المحاكاة. استخدم الأدوات المدرجة فقط.'});
   return {session,message:'الأمر غير متاح في المحاكاة.'};
  }
  const objective=mission.objectives.find(o=>o.kind==='tool'&&o.target===tool.id);
  if(objective&&!objectiveReady(mission,session,objective.id))return premature('استخدام أداة قبل استكمال متطلبات التحقيق');
  const prerequisite=tool.after&&session.usedTools.includes(tool.after.toolId);
  const output=prerequisite?tool.after!.output:tool.output;
  const unsuccessful=(tool.id==='renew'||tool.id==='renew-a')&&!prerequisite;
  if(unsuccessful){session.mistakes.push('حاول تجديد العنوان قبل تشغيل خدمة DHCP');event('mistake','حاول تجديد العنوان قبل تشغيل DHCP')}
  if(!unsuccessful&&!session.usedTools.includes(tool.id)){session.usedTools.push(tool.id);event('tool',tool.label)}
  session.transcript.push({input:tool.command||tool.label,output});
  session.transcript=session.transcript.slice(-24);
  return {session,message:output};
 }
 if(action.action==='decide'){
  if(mission.kind!=='boss')throw Error('القرار غير متاح لهذه المهمة.');
  const decision=mission.decisions?.find(d=>d.id===action.decisionId);
  if(!decision)throw Error('القرار غير موجود.');
  if(session.decisions.includes(decision.id))return {session,message:'سُجل هذا القرار بالفعل.'};
  if(decision.dependsOn.some(id=>!session.inspected.includes(id)&&!session.usedTools.includes(id)&&!session.decisions.includes(id)))return premature(`قرار مبكر: ${decision.label}`);
  const response=action.response;
  if(typeof response!=='string'||response.length>200)throw Error('أدخل قرارًا قصيرًا وصالحًا.');
  if(!acceptsAnswer(response,decision.rule)){session.mistakes.push(`قرار غير دقيق: ${decision.label}`);event('mistake',`قرار غير دقيق: ${decision.label}`);return {session,message:'القرار لا يتوافق مع الأدلة. راجع السجلات ثم حاول مجددًا.'}}
  session.decisions.push(decision.id);event('decision',decision.label);
  return {session,message:decision.feedback};
 }
 if(action.action==='solve'){
  const required=mission.successConditions;
  const missingEvidence=required.evidence.filter(id=>!session.inspected.includes(id));
  const missingTools=required.tools.filter(id=>!session.usedTools.includes(id));
  const missingDecisions=mission.decisions?.filter(d=>!session.decisions.includes(d.id))||[];
  const missingObjectives=mission.kind==='boss'?mission.objectives.filter(o=>!o.optional&&o.kind!=='solve'&&!objectiveDone(mission,session,false,o.id)):[];
  if(missingEvidence.length||missingTools.length||missingDecisions.length||missingObjectives.length){
   session.mistakes.push('حاول الحل قبل استكمال التحقيق');
   event('mistake','حاول الحل قبل استكمال التحقيق');
   return {session,message:'أكمل فحص الأدلة واستخدام الأدوات المطلوبة قبل تقديم الحل.'};
  }
  const answers=action.answers;
  if(!answers||typeof answers!=='object'||Object.values(answers).some(v=>typeof v!=='string'||v.length>160))throw Error('أدخل إجابات قصيرة وصالحة.');
  const incorrect=Object.entries(required.answers).filter(([field,rule])=>!acceptsAnswer(answers[field]||'',rule));
  if(incorrect.length){
   session.mistakes.push(`راجع: ${incorrect.map(([id])=>mission.answerFields.find(f=>f.id===id)?.label||id).join('، ')}`);
   event('mistake','تقرير نهائي غير دقيق');
   return {session,message:'لم يكتمل التشخيص. راجع حقول الحل والأدلة ثم حاول مرة أخرى.'};
  }
  const r=mission.scoreRules;
  const optionalMissed=mission.kind==='boss'?mission.objectives.filter(o=>o.optional&&!objectiveDone(mission,session,false,o.id)).length:0;
  const score=Math.max(r.minimum,r.base-session.hintsUsed*r.hintPenalty-session.mistakes.length*r.mistakePenalty-optionalMissed*4);
  const stars=score>=r.threeStars?3:score>=r.twoStars?2:1;
  event('decision','اكتمل تقرير التحقيق');
  return {session,message:'أُنجزت المهمة.',completed:{score,stars}};
 }
 throw Error('الإجراء غير معروف.');
}
export function validateMission(id:string){const mission=missionById(id);if(!mission)throw Error('المهمة غير موجودة.');return mission}
