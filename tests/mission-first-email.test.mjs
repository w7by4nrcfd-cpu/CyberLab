import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry){const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const adapter=await load('lib/mission-first-email.ts'),engine=await load('lib/mission-engine.ts'),pilot=await load('lib/mission-first-pilot.ts');
const {emailExperience:experience,emailMission:mission,emailDecisionAnswers:answers}=adapter;
assert.equal(mission.id,'003');assert.equal(adapter.emailEmployee.id,adapter.emailAccount.employeeId);assert.equal(adapter.emailRecipient.employeeId,adapter.emailEmployee.id);
assert.equal(adapter.emailMessage.address,'support@cyberlab.example');
assert.deepEqual(adapter.emailInspectionFields,['sender','headers','link']);
assert(!mission.evidence.some(e=>e.content.includes(adapter.relatedLabEmail.attachment)),'never mix another email attachment into mission evidence');
assert.equal(pilot.pilotReturnPath('/experience/nexacorp-email?step=explore&field=headers'),'/experience/nexacorp-email?step=explore&field=headers');
for(const bad of ['https://evil.test/experience/nexacorp-email','//evil.test/experience/nexacorp-email','/experience/nexacorp-email-evil'])assert.equal(adapter.emailReturnPath(bad),null);
const right={classification:'malicious',reasons:['headers','link'],action:'report'};
assert(adapter.emailRecheck({...right,action:'verify'}).includes('التحقق بقناة معروفة آمن'),'safe independent verification must not be described as unsafe');
let session=engine.freshSession();for(const evidenceId of ['message','headers','link'])session=engine.applyMissionAction(mission,session,{id:'003',action:'inspect',evidenceId}).session;
session=engine.applyMissionAction(mission,session,{id:'003',action:'tool',toolId:'analyze'}).session;
for(const classification of ['legitimate','suspicious','malicious'])for(const action of ['report','verify','release','delete'])for(const reasons of [['headers'],['link'],['name','urgency'],['headers','link']]){
 const decision={classification,action,reasons};const result=engine.applyMissionAction(mission,session,{id:'003',action:'solve',answers:answers(decision)});
 assert.equal(!!result.completed,classification==='malicious'&&action==='report'&&reasons.includes('headers')&&reasons.includes('link'));
}
assert.equal(adapter.recoverEmailStep('decide',engine.freshSession(),false),'explore');
assert.equal(adapter.recoverEmailStep('brief',engine.freshSession(),true),'result');
const directory=await mkdtemp(join(tmpdir(),'cyberlab-email-'));
const modules=['index.js',...(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};let worker;
async function call(path,body,user='existing'){
 const headers={};if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test'}if(body!==undefined)headers['Content-Type']='application/json';
 const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};
}
async function act(action,more={},user='existing'){const r=await call('/api/missions',{id:'003',action,...more},user);assert.equal(r.status,200,JSON.stringify(r.data));return r.data.state}
async function finish(user='existing'){await act('start',{},user);for(const evidenceId of ['headers','link'])await act('inspect',{evidenceId},user);await act('tool',{toolId:'analyze'},user);return act('solve',{answers:answers(right)},user)}
// Exercise the actual client component's handlers and effects without a browser.
// A hook harness replaces only React hooks/context, not the workspace or its fetches.
const uiDir=await mkdtemp(resolve('.sites-runtime/email-ui-'));
const compiled=await build({entryPoints:['app/experience/nexacorp-email/workspace.tsx'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',external:['react/jsx-runtime'],plugins:[{name:'test-hooks',setup(b){
 b.onResolve({filter:/^(react|lucide-react|@\/app\/progression\/view|@\/app\/shell|@\/components\/ui\/radio-group)$/},a=>({path:a.path,namespace:'harness'}));
 b.onLoad({filter:/.*/,namespace:'harness'},a=>({loader:'js',contents:a.path==='@/app/progression/view'?`export const CompletionProgressSummary=()=>null;`:a.path==='react'?`export const useState=(v)=>globalThis.emailHooks.useState(v),useEffect=(f,d)=>globalThis.emailHooks.useEffect(f,d),useRef=(v)=>globalThis.emailHooks.useRef(v);`:a.path==='@/app/shell'?`export const useProgress=()=>globalThis.emailProgress;`:a.path==='@/components/ui/radio-group'?`import {jsx} from 'react/jsx-runtime';export const RadioGroup=p=>jsx('div',p),RadioGroupItem=p=>jsx('button',{...p,role:'radio'});`:`export const Clock3=()=>null,Target=()=>null,Signal=()=>null,CheckCircle2=()=>null,Lightbulb=()=>null,Mail=()=>null,ShieldCheck=()=>null;`}));
}}]});
const uiFile=join(uiDir,'workspace.mjs');await writeFile(uiFile,compiled.outputFiles[0].text);const Component=(await import(pathToFileURL(uiFile))).default;
const storage=new Map();globalThis.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
function locationAt(path){globalThis.location={search:new URL(path,'http://local.test').search,reload(){throw Error('unexpected reload')}};globalThis.history={replaceState(_s,_t,p){globalThis.location.search=new URL(p,'http://local.test').search}}}
let slots=[],index=0,dirty=false,effects=[],tree,pending=new Set(),uiUser=null;
const oldFetch=globalThis.fetch;
globalThis.fetch=(path,init={})=>{const headers={...init.headers};if(uiUser){headers['oai-authenticated-user-id']=uiUser;headers['oai-authenticated-user-email']=uiUser+'@example.test'}const promise=(async()=>{const r=await worker.dispatchFetch('http://local.test'+path,{...init,headers});return new Response(await r.text(),{status:r.status,headers:r.headers})})();pending.add(promise);promise.finally(()=>pending.delete(promise));return promise};
globalThis.emailHooks={useState(v){const i=index++;if(!slots[i])slots[i]={value:typeof v==='function'?v():v};return [slots[i].value,n=>{slots[i].value=typeof n==='function'?n(slots[i].value):n;dirty=true}]},useRef(v){const i=index++;if(!slots[i])slots[i]={current:v};return slots[i]},useEffect(f,deps){const i=index++;if(!slots[i]||deps.some((d,j)=>d!==slots[i].deps[j])){slots[i]?.cleanup?.();slots[i]={deps};effects.push(()=>{slots[i].cleanup=f()})}}};
function render(){index=0;dirty=false;tree=Component();const queue=effects.splice(0);for(const e of queue)e()}
async function settle(){for(let i=0;i<12;i++){if(pending.size)await Promise.all([...pending]);await new Promise(r=>setImmediate(r));if(dirty)render()}assert.equal(pending.size,0)}
function nodes(node,out=[]){if(arguments.length===0)node=tree;if(Array.isArray(node)){for(const child of node)nodes(child,out)}else if(node&&typeof node==='object'&&node.props){if(typeof node.type==='function')nodes(node.type(node.props),out);else{out.push(node);nodes(node.props.children,out)}}return out}
function textOf(node){if(node==null||typeof node==='boolean')return '';if(Array.isArray(node))return node.map(textOf).join('');if(typeof node==='string'||typeof node==='number')return String(node);return typeof node.type==='function'?textOf(node.type(node.props)):textOf(node.props?.children)}
const element=(type,label)=>{const n=nodes().find(n=>n.type===type&&textOf(n).includes(label));assert(n,`missing ${type}: ${label}`);return n};
async function click(label){const n=element('button',label);assert(!n.props.disabled,`disabled ${label}`);n.props.onClick();await settle()}
async function mount(user,path=experience.href){for(const slot of slots)slot?.cleanup?.();slots=[];uiUser=user;globalThis.emailProgress={user:user?{email:user+'@example.test',name:user}:null,loading:false,error:'',refresh:async()=>{}};locationAt(path);render();await settle()}
async function inspect(field){const select=element('select','اختر ما');select.props.onChange({target:{value:field}});await settle()}
async function choose(decision){const radios=nodes().filter(n=>n.type==='input'&&n.props.type==='radio');radios[['legitimate','suspicious','malicious'].indexOf(decision.classification)].props.onChange();await settle();
 const ids=['headers','link','name','urgency'];for(const id of ids){const checkbox=nodes().filter(n=>n.type==='input'&&n.props.type==='checkbox')[ids.indexOf(id)];if(checkbox.props.checked!==decision.reasons.includes(id))checkbox.props.onChange({target:{checked:decision.reasons.includes(id)}});await settle()}
 element('select','اختر الإجراء').props.onChange({target:{value:decision.action}});await settle();}
try{
 worker=new Miniflare(options);const db=await worker.getD1Database('DB');
 for(const file of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 await db.prepare('INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,?,?,?,?,?)').bind('existing','net-1','quiz',3,100,'2026-09-20T10:00:00Z').run();
 const oldItems=(await call('/api/progress')).data.items;
 const oldSkills=(await call('/api/skills')).data.skills.map(s=>[s.id,s.xp]);
 assert.equal((await call('/api/missions',{id:'003',action:'start'},null)).status,401);
 // New learner: real workspace events, progressive disclosure, Knowledge Card and lesson return.
 await mount('new-user');assert(textOf(tree).includes('وصلت رسالة غير معتادة'));assert(!textOf(tree).includes('Return-Path'));
 assert.equal(nodes().filter(n=>n.type==='button'&&n.props.className==='primary-button').length,1);
 assert(nodes().some(n=>n.type==='bdi'&&n.props.dir==='ltr'&&textOf(n)==='support@cyberlab.example'));
 const briefLesson=element('a','راجع طريقة فحص الرسائل').props.href;
 assert.equal(new URL(briefLesson,'http://local.test').searchParams.get('return_to'),experience.href+'?step=brief');
 await click('افحص الرسالة');
 assert.equal(element('select','اختر ما').props.value,'sender');
 assert.deepEqual(nodes(element('select','اختر ما')).filter(n=>n.type==='option'&&n.props.value).map(n=>n.props.value),['sender','headers','link'],'only useful evidence views belong in the main selector');
 assert(!nodes().some(n=>n.type==='button'&&textOf(n).includes('ابنِ قرارك')),'the next action leads to missing evidence, not a disabled decision');
 await click('افحص مصدر الإرسال');const returnHref=element('a','اقرأ الشرح الكامل').props.href;assert(returnHref.includes('/learn/security-8'));
 const lessonResponse=await worker.dispatchFetch('http://local.test'+returnHref);assert.equal(lessonResponse.status,200);const lessonHtml=await lessonResponse.text();assert(lessonHtml.includes('العودة إلى البلاغ'));
 const returnPath=decodeURIComponent(returnHref.split('return_to=')[1]);await mount('new-user',returnPath);assert(textOf(tree).includes('Return-Path وSPF'));
 await mount('new-user',experience.href+'?step=explore&field=attachment');assert(textOf(tree).includes('لا توجد بيانات مرفق'),'old field deep links remain readable without promoting missing evidence');
 await click('عاين وجهة الرابط');
 assert(nodes().some(n=>n.type==='bdi'&&n.props.dir==='ltr'&&textOf(n).includes('https://login-check.example')));
 await click('ابنِ قرارك');await choose({classification:'legitimate',reasons:['name','urgency'],action:'release'});await click('أرسل القرار');assert(textOf(tree).includes('عد للتحقيق'));assert(textOf(tree).includes('الاسم المألوف والمهلة لا يثبتان هوية المرسل'));assert(!nodes().some(n=>n.type==='table'&&n.props.className==='email-result-evidence'));
 await click('عد للتحقيق');await inspect('headers');await inspect('link');await click('ابنِ قرارك');await choose(right);
 const beforeRefresh=location.search;await mount('new-user',experience.href+beforeRefresh);assert.equal(nodes().filter(n=>n.type==='input'&&n.props.type==='checkbox'&&n.props.checked).length,2);
 await click('أرسل القرار');assert(textOf(tree).includes('الرسالة محاولة تصيّد'));
 const evidenceTable=element('table','كيف دعمت الأدلة قرارك؟');assert.equal(nodes(evidenceTable).filter(n=>n.type==='tr').length,4);
 assert(textOf(evidenceTable).includes('SPF fail')&&textOf(evidenceTable).includes('login-check.example')&&textOf(evidenceTable).includes('إدخال رمز التحقق'));
 assert(textOf(tree).includes('لا يوجد في هذا البلاغ دليل'));
 assert.equal(nodes().filter(n=>['button','a'].includes(n.type)&&n.props.className==='primary-button').length,1);
 const next=element('a','خطوتك التالية');assert.equal(next.props.href,'/campaigns/first-signal');
 const campaign=await worker.dispatchFetch('http://local.test'+next.props.href);assert.equal(campaign.status,200);
 const newXP=(await call('/api/progress',undefined,'new-user')).data.items;assert.equal(newXP.reduce((n,i)=>n+i.xp,0),140);
 const newSkillXP=(await call('/api/skills',undefined,'new-user')).data.skills.map(s=>[s.id,s.xp]);
 await mount('new-user');assert(textOf(tree).includes('الرسالة محاولة تصيّد'));
 await click('إعادة التحقيق');await click('افحص الرسالة');await inspect('headers');await inspect('link');await click('ابنِ قرارك');await choose(right);await click('أرسل القرار');
 assert.deepEqual((await call('/api/progress',undefined,'new-user')).data.items.map(({score,...i})=>i),newXP.map(({score,...i})=>i));assert.deepEqual((await call('/api/skills',undefined,'new-user')).data.skills.map(s=>[s.id,s.xp]),newSkillXP);
 // Existing account: reading/opening the new interface cannot grant or lose progress.
 await mount('existing');await click('افحص الرسالة');await inspect('headers');await inspect('link');
 assert.deepEqual((await call('/api/progress')).data.items,oldItems);assert.deepEqual((await call('/api/skills')).data.skills.map(s=>[s.id,s.xp]),oldSkills);
 const saved=(await call('/api/missions')).data.states.find(s=>s.id==='003');
 await worker.dispose();worker=new Miniflare(options);assert.deepEqual((await call('/api/missions')).data.states.find(s=>s.id==='003'),saved);
 assert.equal((await call('/api/missions',undefined,'isolated')).data.states.length,0);
 // Legacy completed mission with an empty old session still opens as complete.
 const date='2026-09-20T10:00:00Z';
 const restartedDb=await worker.getD1Database('DB');
 await restartedDb.prepare('INSERT INTO mission_progress(user_id,mission_id,started_at,updated_at,completed_at,score,stars,hints_used,attempts,session_json) VALUES(?,?,?,?,?,?,?,?,?,?)').bind('legacy','003',date,date,date,85,2,1,1,'{}').run();
 await restartedDb.prepare('INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,?,?,?,?,?)').bind('legacy','mission:003','mission',85,140,date).run();
 const legacySkills=(await call('/api/skills',undefined,'legacy')).data.skills.map(s=>[s.id,s.xp]);const legacyItems=(await call('/api/progress',undefined,'legacy')).data.items;
 await mount('legacy');assert(textOf(tree).includes('هذا الإنجاز محفوظ سابقًا'));assert.deepEqual((await call('/api/progress',undefined,'legacy')).data.items,legacyItems);
 await act('replay',{},'legacy');assert.equal((await finish('legacy')).session.lastResult.xpGranted,false);assert.deepEqual((await call('/api/skills',undefined,'legacy')).data.skills.map(s=>[s.id,s.xp]),legacySkills);
 assert.equal((await call('/api/progress',undefined,'legacy')).data.items.reduce((n,i)=>n+i.xp,0),140);
 // Guest route uses the same grader and cannot write account rewards; replay completes.
 await mount(null);await click('افحص الرسالة');await inspect('headers');await inspect('link');await click('ابنِ قرارك');await choose(right);await click('أرسل القرار');assert(textOf(tree).includes('لم تُمنح XP'));
 await click('إعادة التحقيق');await click('افحص الرسالة');await inspect('headers');await inspect('link');await click('ابنِ قرارك');await choose(right);await click('أرسل القرار');assert(textOf(tree).includes('الرسالة محاولة تصيّد'));
 const networkSource=await readFile('app/experience/nexacorp-first/workspace.tsx','utf8');assert(networkSource.includes('href="/experience/nexacorp-email"'));
 console.log('PASS: actual workspace handlers/effects (non-browser), progressive email/card/lesson return, wrong/recheck/correct, refresh, guest replay, legacy completion, XP/Skill XP idempotence, canonical IDs, account isolation and D1 restart.');
}finally{globalThis.fetch=oldFetch;for(const slot of slots)slot?.cleanup?.();if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true});await rm(uiDir,{recursive:true,force:true})}
