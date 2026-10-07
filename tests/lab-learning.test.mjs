import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry){const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const engine=await load('lib/interactive-lab-engine.ts'),data=await load('lib/interactive-labs.ts'),learning=await load('lib/lab-learning.ts'),curriculum=await load('lib/curriculum.ts');
const scope={emailIds:data.emails.map(x=>x.id),httpIds:data.httpExchanges.map(x=>x.id),devices:data.networkCases.length,transports:data.transportScenarios.length,flows:data.networkInvestigations.length,logCases:data.logInvestigations.length};
for(const [id,meta] of Object.entries(learning.labLearning)){
 assert(data.interactiveLabById(id));assert(curriculum.lessons.some(x=>x.id===meta.reference.id));
 assert.equal(meta.transfer.choices.filter(x=>x.correct).length,1);
 const s=engine.newLabSession(),before=structuredClone(s);learning.labLearningSteps(id,s,scope);assert.deepEqual(s,before,'guidance cannot change progress or rewards');
 assert(learning.labLearningSteps(id,s,scope).every(x=>!x.done));
}
for(const scenario of data.terminalScenarios){
 const lab=data.interactiveLabById('v2-terminal');let s=engine.newLabSession();
 const act=(action,extra={})=>s=engine.applyLabAction(lab,s,{action,...extra}).session;
 if(scenario.id==='dns')act('scenario',{key:'dns'});
 act('submit',{path:scenario.acceptedAnswers.path[0],owner:scenario.acceptedAnswers.owner[0]});
 assert.equal(s.lastResult.passed,false,'known answer without investigation fails');
 for(const input of scenario.id==='dns'?['cat README.txt','cat /etc/resolv.conf','ip','ping 203.0.113.10','nslookup portal.training']:['cat README.txt','find /srv -name report.txt','cat /srv/audit/report.txt','ps'])act('command',{input});
 assert.equal(learning.labLearningSteps(lab.id,s,scope)[0].done,true);assert.equal(learning.labLearningSteps(lab.id,s,scope).at(-1).done,false);
 act('submit',{path:scenario.acceptedAnswers.path[0],owner:scenario.acceptedAnswers.owner[0]});assert(s.lastResult.passed);assert(learning.labLearningSteps(lab.id,s,scope).every(x=>x.done));
}
let emailSession=engine.newLabSession();const emailLab=data.interactiveLabById('v2-email');
const emailAct=(action,extra={})=>emailSession=engine.applyLabAction(emailLab,emailSession,{action,...extra}).session;
for(const key of scope.emailIds){for(const value of ['headers','url','replyTo'])emailAct('inspect',{key,value});emailAct('classify',{key,value:'legitimate'})}
for(const value of ['replyTo','headers'])emailAct('mark',{key:'E03',value});
assert.deepEqual(learning.labLearningSteps(emailLab.id,emailSession,scope).map(x=>x.done),[true,true,false]);
emailAct('submit');assert.equal(emailSession.lastResult.passed,false,'recorded verdicts are not validated verdicts');
emailAct('classify',{key:'E02',value:'suspicious'});emailAct('classify',{key:'E03',value:'phishing'});emailAct('submit');assert(emailSession.lastResult.passed);
assert(learning.labLearningSteps(emailLab.id,emailSession,scope).every(x=>x.done));
const uiDir=await mkdtemp(resolve('.sites-runtime/lab-learning-ui-'));
try{
 const result=await build({entryPoints:['app/labs/v2/[id]/workspace.tsx'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',external:['react/jsx-runtime'],plugins:[{name:'fixtures',setup(b){
  b.onResolve({filter:/^(react|lucide-react|@\/app\/shell|@\/components\/ui\/radio-group)$/},a=>({path:a.path,namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path==='react'?`export const useState=v=>globalThis.labUI.useState(v),useEffect=()=>{},useRef=v=>({current:v});`:a.path==='@/app/shell'?`export const useProgress=()=>({user:globalThis.labUI.user,refresh:async()=>{}});`:a.path==='lucide-react'?`export const ArrowLeft=()=>null,ArrowRight=()=>null,CheckCircle2=()=>null,FlaskConical=()=>null,Lightbulb=()=>null,ShieldCheck=()=>null,Terminal=()=>null,Building2=()=>null;`:`import {jsx} from 'react/jsx-runtime';export const RadioGroup=p=>jsx('div',p),RadioGroupItem=p=>jsx('button',{id:p.id,role:'radio'});`}));
 }}]});
 const file=join(uiDir,'workspace.mjs');await writeFile(file,result.outputFiles[0].text);const Workspace=(await import(pathToFileURL(file))).default;
 const detail={...engine.publicLabData(emailLab),state:{id:emailLab.id,session:emailSession,attempts:2,bestScore:95,hintsUsed:0,progress:100}};
 function render(session,loadedFor='learner@example.test:v2-email',returnTo='/experience/nexacorp-email?step=evidence'){
  let index=0;const slots={0:{...detail,state:{...detail.state,session}},1:false,11:returnTo,12:loadedFor};
  globalThis.labUI={user:{email:'learner@example.test'},useState(v){const slot=index++;return [Object.hasOwn(slots,slot)?slots[slot]:typeof v==='function'?v():v,()=>{}]}};
  return renderToStaticMarkup(Workspace({id:emailLab.id}));
 }
 const completed=render(emailSession);assert(completed.includes('ما الذي أثبته تدريبك؟'));assert(completed.includes('لا يغيّر إنجاز المختبر'));assert(!completed.includes('خطوتك الآن'));
 const unfinished=structuredClone(emailSession);unfinished.lastResult={passed:false,score:20,feedback:['راجع التصنيف']};
 const working=render(unfinished);assert(working.includes('خطوتك الآن'));assert(!working.includes('ما الذي أثبته تدريبك؟'));
 const href=working.match(/href="([^"]*\/learn\/security-8[^"]*)"/)[1].replaceAll('&amp;','&');
 const labReturn=new URL(href,'http://local.test').searchParams.get('return_to');assert.equal(new URL(labReturn,'http://local.test').pathname,'/labs/v2/v2-email');assert.equal(new URL(labReturn,'http://local.test').searchParams.get('return_to'),'/experience/nexacorp-email?step=evidence');
 const switched=render(emailSession,'previous@example.test:v2-email');assert(switched.includes('جارٍ استعادة المختبر'));assert(!switched.includes('مختبر مكتمل'),'previous account result is hidden before effects run');
 console.log('PASS: read-only learning guidance, valid curriculum references, both terminal scenarios require evidence, recorded email decisions cannot bypass grading, post-success independent practice, nested return context and pre-effect account masking. Compiled rendering only; not browser QA.');
}finally{delete globalThis.labUI;await rm(uiDir,{recursive:true,force:true})}
