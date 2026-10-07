import {networkCases,interactiveLabById} from './interactive-labs';
import {nexaCorp} from './nexacorp';
import {emailReturnPath} from './mission-first-email';
import {responseReturnPath} from './incident-chain';
import {coreReturnPath} from './mission-first-core';

// A presentation of one existing lab case. The lab remains the authority for
// its device, observations, actions and saved progress.
export const firstPilot={
 id:'nexacorp-first',
 href:'/experience/nexacorp-first',
 labId:'v2-network',
 caseId:'wrong-ip',
 nextMissionId:'003',
 knowledge:{ip:{lessonId:'network-5',classification:'Cyber Core'},dhcp:{lessonId:'network-9',classification:'Supporting'},dns:{lessonId:'network-8',classification:'Supporting'}}
} as const;
export const pilotGuestKey='cyberlab-first-pilot-guest';

export const firstPilotLab=interactiveLabById(firstPilot.labId)!;
export const firstPilotCase=networkCases.find(item=>item.id===firstPilot.caseId)!;
export const firstPilotDevice=nexaCorp.devices.find(item=>item.id===firstPilotCase.host)!;
export const firstPilotSegment=nexaCorp.segments.find(item=>item.id===firstPilotDevice.segmentId)!;

export type PilotStep='brief'|'explore'|'inspect'|'try'|'decide'|'result';
export const pilotSteps:PilotStep[]=['brief','explore','inspect','try','decide','result'];
export function pilotReturnPath(value:string){
 const response=responseReturnPath(value);if(response)return response;
 const core=coreReturnPath(value);if(core)return core;
 const email=emailReturnPath(value);if(email)return email;
 if(!value.startsWith(firstPilot.href))return null;
 try{const url=new URL(value,'https://cyberlab.invalid');
  if(url.pathname!==firstPilot.href||url.origin!=='https://cyberlab.invalid')return null;
  const step=url.searchParams.get('step');
  return step&&pilotSteps.includes(step as PilotStep)?`${firstPilot.href}?step=${step}`:firstPilot.href;
 }catch{return null}
}
export function isPilotBeginner(items:{id:string}[],activity:{id:string;completedAt:string|null}[]){
 const referenceIds=new Set<string>(Object.values(firstPilot.knowledge).map(entry=>entry.lessonId));
 return items.length===0&&!activity.some(entry=>entry.completedAt||!referenceIds.has(entry.id));
}
