import {responseChain} from './incident-chain';
import {firstSignal} from './campaigns';
import {missionById} from './missions';
import type {MissionSession} from './mission-engine';

// Presentation references, never a second completion or reward system.
export const coreJourney={signalHref:'/campaigns/first-signal',signalMissionId:'boss-002',socHref:'/soc/alerts/SOC-002?view=guided',socId:'SOC-002',boardHref:'/investigations/soc-SOC-002?journey=core',boardId:'soc-SOC-002'} as const;
export const signalMission=missionById(coreJourney.signalMissionId)!;
export const signalChapter=firstSignal.chapters.find(c=>c.missionIds.includes(signalMission.id))!;
export const signalSteps=['brief','evidence','decision','result'] as const;
export const socSteps=['brief','triage','evidence','investigation','decision','response','document','result'] as const;
export const boardSteps=['locker','links','decision','result'] as const;
export type SignalStep=typeof signalSteps[number];
export type SocStep=typeof socSteps[number];
export type CoreBoardStep=typeof boardSteps[number];
export function recoverSignalStep(requested:SignalStep,session:MissionSession|null,completed:boolean):SignalStep{
 if(completed&&!session?.replaying)return 'result';
 if(requested==='result')return 'brief';
 if(requested==='decision'&&(!signalMission.successConditions.evidence.every(e=>session?.inspected.includes(e))||!signalMission.successConditions.tools.every(t=>session?.usedTools.includes(t))))return 'evidence';
 return requested;
}
const referenceLessons=new Set(['network-5','network-8','network-9','security-8','security-11','sec-1','sec-2','soc-2','soc-3']);
const coreItems=new Set(['mission:003','boss:boss-002']);
export function isCoreBeginner(items:{id:string}[],activity:{id:string}[]){return items.every(i=>coreItems.has(i.id)||referenceLessons.has(i.id))&&activity.every(a=>referenceLessons.has(a.id))}
export function coreNextStep(networkDone:boolean,emailDone:boolean,signalDone:boolean,socDone:boolean,boardDone:boolean,responseDone=false){
 if(!networkDone&&!emailDone&&!signalDone&&!socDone)return {href:'/experience/nexacorp-first',title:'جهاز لا يصل إلى الخدمة',action:'افتح البلاغ',detail:'لاحظ، اختبر، ثم قرر ما الذي تستطيع إثباته.'};
 if(!emailDone&&!signalDone&&!socDone)return {href:'/experience/nexacorp-email',title:'رسالة تحتاج فحصًا',action:'افحص الرسالة',detail:'قارن هوية المرسل والوجهة قبل اتخاذ قرار.'};
 if(!signalDone&&!socDone)return {href:coreJourney.signalHref,title:'First Signal · من البريد إلى نشاط الحساب',action:'تابع القضية',detail:'اربط الرسالة بنشاط الموظفة وسجلات الدخول.'};
 if(!socDone)return {href:coreJourney.socHref,title:'تنبيه جلسة ليلى',action:'افتح التنبيه',detail:'تحقق من الجلسات والجهاز، ثم اتخذ قرار استجابة.'};
 if(!boardDone)return {href:coreJourney.boardHref,title:'وثّق علاقات التحقيق',action:'تابع التحقيق',detail:'اجمع الأدلة واربطها بالحساب والجلسة.'};
 if(!responseDone)return {href:responseChain.href,title:'تابع أثر الحادث داخل NexaCorp',action:'افتح متابعة ليلى',detail:'اربط البريد بالجهاز، ثم تحقق مما حدث بعد استجابتك.'};
 return {href:'/progress',title:'أثبتّ منهجية التحقيق الأولى',action:'راجع تقدمك',detail:'من بلاغ شبكة إلى دليل بريد وجلسة وقرار أمني.'};
}
export function coreReturnPath(value:string){
 if(!value.startsWith('/'))return null;
 try{const url=new URL(value,'https://cyberlab.invalid');if(url.origin!=='https://cyberlab.invalid')return null;
  let steps:readonly string[],base:string;
  if(url.pathname===coreJourney.signalHref&&url.searchParams.get('view')!=='full'){steps=signalSteps;base=coreJourney.signalHref+'?';}
  else if(url.pathname==='/soc/alerts/SOC-002'&&url.searchParams.get('view')==='guided'){steps=socSteps;base=coreJourney.socHref+'&';}
  else if(url.pathname==='/investigations/soc-SOC-002'&&url.searchParams.get('journey')==='core'){steps=boardSteps;base=coreJourney.boardHref+'&';}
  else return null;
  const requested=url.searchParams.get('step'),step=steps.includes(requested||'')?requested:steps[0],field=url.searchParams.get('field');
  const permitted=['email','activity','auth-log','policy','sessions','device'];
  return base+'step='+step+(field&&permitted.includes(field)?'&field='+field:'');
 }catch{return null}
}
