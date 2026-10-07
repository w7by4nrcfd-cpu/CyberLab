import {generateIncident,type DynamicIncident} from './dynamic-incidents';
import {responseChain,responseStages,chainConsequence,type ChainContext} from './incident-chain';
import {validBoardDefinition,type BoardDecision} from './investigation-board';

export function composeResponseIncident(stage:number,rootSeed:number,previous?:DynamicIncident,previousDecision?:BoardDecision):DynamicIncident{
 const definition=responseStages[stage];if(!definition||stage>0&&(!previous||!previousDecision))throw Error('مرحلة التحقيق غير صالحة.');
 const seed=((stage<<30)|(rootSeed&0x3fffffff))>>>0;
 const incident=generateIncident(definition.templateId,seed,{employeeId:responseChain.employeeId,remote:'198.51.100.77',baseTime:['2026-09-25T10:10:00Z','2026-09-25T10:30:00Z','2026-09-25T11:00:00Z'][stage]});
 const context:ChainContext={id:responseChain.id,stage,rootSeed,sourceId:responseChain.sourceId,...(previous?{previousInstanceId:previous.instanceId,previousAction:previousDecision!.action,identityResponse:stage===1?previousDecision!.action:previous?.chain?.identityResponse}:{})};
 incident.chain=context;incident.title=definition.title;incident.brief=definition.brief;
 incident.board.title=incident.title;incident.board.subtitle=incident.brief;incident.board.sourceHref=responseChain.href+'?stage='+stage;
 if(previous){
  const raw=`previous_investigation=${previous.board.id}\naccount=layla device=WKST-02 source=198.51.100.77\nprevious_action=${previousDecision!.action}\n${chainConsequence(stage-1,previousDecision!)}`;
  incident.evidence.push({id:'handoff',type:'other',title:'تسليم التحقيق السابق',source:'SOC · تسليم محفوظ',timestamp:stage===1?'2026-09-25T10:29:00Z':'2026-09-25T10:59:00Z',raw,role:'supporting',entities:['account:layla','device:WKST-02']});
  incident.board.nodes.push({id:'evidence:handoff',kind:'evidence',label:'تسليم التحقيق السابق'});
 }
 if(stage===2){
  // Account containment produces denied retries; endpoint isolation cannot revoke a remote account session.
  const contained=previous?.chain?.identityResponse==='contain',login=incident.evidence.find(e=>e.id==='login')!,flow=incident.evidence.find(e=>e.id==='flow')!;
  login.raw=`account=layla source=198.51.100.77 failures=3 success=${contained?0:1} device=unknown\naccount_response=${previous?.chain?.identityResponse} endpoint_response=${previousDecision!.action} office_device=WKST-02`;
  flow.raw=`src=198.51.100.77 dst=IDP-01 service=identity transport=established auth=${contained?'denied':'accepted'} account=layla`;
  incident.board.hypotheses=[{id:'blocked-retry',label:'محاولات جديدة رُفضت بعد الاستجابة، دون جلسة ناجحة من المصدر'},{id:'suspicious-auth',label:'دخول غير مألوف نجح بعد التصعيد ويحتاج استجابة'},{id:'unrelated',label:'الأحداث غير مرتبطة بالحساب'}];
  incident.board.expected.hypothesis=contained?'blocked-retry':'suspicious-auth';
  incident.board.expected.actions=contained?['monitor']:['contain','escalate'];
  incident.validConclusions=[incident.board.expected.hypothesis];incident.recommendedActions=incident.board.expected.actions;
  incident.review.explanation=contained?'سجل الهوية يثبت رفض المحاولات، مع اتصال إلى الخدمة لا جلسة ناجحة. جلسة المكتب منفصلة ومعروفة؛ لا تنسب نجاحًا للمصدر لم تثبته الهوية.':'سجل الهوية يثبت دخولًا ناجحًا من المصدر نفسه بعد التصعيد. التصعيد السابق نقل المسؤولية ولم يثبت تنفيذ الاحتواء؛ يلزم إجراء متناسب مع الجلسة.';
 }
 incident.board.expected.affected=stage===1?['account:layla','device:WKST-02']:['account:layla'];
 incident.affectedEntities=incident.board.expected.affected;
 incident.board.evidence=incident.evidence;
 for(const node of incident.board.nodes)if(node.kind==='evidence'){const evidence=incident.evidence.find(e=>'evidence:'+e.id===node.id);if(evidence)node.label='دليل · '+evidence.title}
 incident.events=incident.evidence.map(e=>({id:e.id,source:e.source,time:e.timestamp,summary:e.title})).sort((a,b)=>a.time.localeCompare(b.time));incident.timeline=incident.events.map(e=>({time:e.time,summary:e.summary}));
 if(!validBoardDefinition(incident.board))throw Error('تعارض في ربط مراحل التحقيق.');
 return incident;
}
