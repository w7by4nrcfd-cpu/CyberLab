import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry,plugins=[]){const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',plugins});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const engine=await load('lib/interactive-lab-engine.ts'),labs=await load('lib/interactive-labs.ts'),{labReport,labBriefs,missionBriefs}=await load('lib/practical-training.ts');
const missions=await load('lib/missions.ts'),{practicalChecks}=await load('lib/practical-checks.ts');
for(const id of Object.keys(labBriefs)){assert(labs.interactiveLabById(id));assert(practicalChecks[id]);assert.equal(practicalChecks[id].choices.filter(c=>c.correct).length,1)}
for(const id of Object.keys(missionBriefs))assert(missions.missionById(id));
for(const scenario of labs.terminalScenarios){let s=engine.newLabSession();const lab=labs.interactiveLabById('v2-terminal'),act=(action,data={})=>s=engine.applyLabAction(lab,s,{action,...data}).session;
 assert.equal(labReport(lab.id,lab.title,s),null);
 if(scenario.id==='dns')act('scenario',{key:'dns'});
 act('submit',{path:scenario.acceptedAnswers.path[0],owner:scenario.acceptedAnswers.owner[0]});assert.equal(labReport(lab.id,lab.title,s),null,'failed known answer cannot produce successful report');
 for(const input of scenario.id==='dns'?['cat README.txt','cat /etc/resolv.conf','ip','ping 203.0.113.10','nslookup portal.training']:['cat README.txt','find /srv -name report.txt','cat /srv/audit/report.txt','ps'])act('command',{input});
 act('submit',{path:scenario.acceptedAnswers.path[0],owner:scenario.acceptedAnswers.owner[0]});assert(s.lastResult.passed);
 const before=structuredClone(s),report=labReport(lab.id,lab.title,s);assert(report.includes(s.terminal.at(-1).output));assert(report.includes(s.visited[0]));assert(report.includes('ليس تقرير فحص لنظام حقيقي'));assert.deepEqual(s,before,'export is read-only');
 act('replay');assert.equal(labReport(lab.id,lab.title,s),null,'replayed incomplete session cannot reuse earlier success report');
}
const jsx=pathToFileURL(require.resolve('react/jsx-runtime')).href;
const module=await load('components/operations-desk.tsx',[{name:'hooks',setup(b){b.onResolve({filter:/^react\/jsx-runtime$/},()=>({path:jsx,external:true}));b.onResolve({filter:/^(react|@\/app\/shell)$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path==='react'?'export const useState=v=>globalThis.hooks.state(v),useRef=v=>globalThis.hooks.ref(v),useEffect=f=>globalThis.hooks.effects.push(f);':'export const useProgress=()=>({user:globalThis.hooks.user});'}))}}]);
const hooks={user:null,slots:[],index:0,effects:[],state(v){const i=this.index++;if(!(i in this.slots))this.slots[i]=v;return [this.slots[i],next=>this.slots[i]=typeof next==='function'?next(this.slots[i]):next]},ref(v){const i=this.index++;return this.slots[i]??=( {current:v})}};globalThis.hooks=hooks;
const Desk=module.default,render=()=>{hooks.index=0;hooks.effects=[];return Desk()};
function text(n){if(n==null||typeof n==='boolean')return '';if(Array.isArray(n))return n.map(text).join('');if(typeof n==='string'||typeof n==='number')return String(n);return text(n.props?.children)}
function nodes(n,out=[]){if(Array.isArray(n))n.forEach(x=>nodes(x,out));else if(n?.props){out.push(n);nodes(n.props.children,out)}return out}
const requests=[];globalThis.fetch=(_,options)=>new Promise(resolve=>requests.push({resolve,options}));
assert(text(render()).includes('First Signal'));for(const effect of hooks.effects)effect();assert.equal(requests.length,0,'guest never fetches private queue');
hooks.user={email:'a@example.test'};render();let cleanup=hooks.effects[0]();assert.equal(requests.length,1);
const reply=(i,data,ok=true)=>requests[i].resolve({ok,json:async()=>data});const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve()};
reply(0,{alerts:[{id:'SOC-002',title:'الحساب الأول',status:'Investigating',severity:'High',closedAt:null},{id:'SOC-001',title:'منتهٍ',status:'Resolved',severity:'Low',closedAt:'today'}],cases:[{id:'C-1',title:'القضية الأولى',status:'Investigating',severity:'High'}]});await flush();
let tree=render();assert(text(tree).includes('القضية الأولى'));assert(!text(tree).includes('منتهٍ'));assert(nodes(tree).some(n=>n.props.href==='/soc/alerts/SOC-002?view=guided'));
hooks.user={email:'b@example.test'};assert(!text(render()).includes('القضية الأولى'),'previous account masked before effect');cleanup();cleanup=hooks.effects[0]();
hooks.user={email:'c@example.test'};render();cleanup();hooks.effects[0]();reply(1,{alerts:[],cases:[{id:'secret',title:'بيانات متأخرة',status:'Investigating'}]});await flush();assert(!text(render()).includes('بيانات متأخرة'),'late old response ignored');
reply(2,{error:'فشل الاتصال'},false);await flush();assert(text(render()).includes('فشل الاتصال'));assert(!text(render()).includes('لا توجد قضايا'),'error is not empty queue');
assert.equal(module.alertTrainingHref('SOC-004'),'/soc/alerts/SOC-004?view=defensive');
delete globalThis.hooks;
console.log('PASS: real terminal engine success/failure/replay report gating, read-only saved facts; valid case references; operations guest, account masking, late response, errors, real case and guided/defensive routing.');
