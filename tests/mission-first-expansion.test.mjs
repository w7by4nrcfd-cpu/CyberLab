// Real built Worker + disposable D1. No Production credentials or writes.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry){const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const {composeResponseIncident}=await load('lib/incident-chain-definition.ts');
const {responseReturnPath,responseStages,responseChain}=await load('lib/incident-chain.ts'),{pilotReturnPath}=await load('lib/mission-first-pilot.ts'),{lessons}=await load('lib/curriculum.ts');
for(const stage of responseStages)for(const card of Object.values(stage.knowledge))assert(lessons.some(l=>l.id===card.lessonId),'existing reference '+card.lessonId);
for(const p of ['//outside.test/experience/nexacorp-response','https://outside.test/experience/nexacorp-response','/experience/nexacorp-response?stage=9','/experience/nexacorp-response-other'])assert.equal(responseReturnPath(p),null);
assert.equal(pilotReturnPath('/experience/nexacorp-response?stage=1&step=observe&field=process'),'/experience/nexacorp-response?stage=1&step=observe&field=process');
for(let seed=1;seed<40;seed++){
 const a=composeResponseIncident(0,seed),d={hypothesis:a.validConclusions[0],action:'contain',affected:['account:layla'],evidenceIds:a.successConditions.requiredEvidenceIds};
 const b=composeResponseIncident(1,seed,a,d),c=composeResponseIncident(2,seed,b,{...d,action:'escalate'});
 assert.deepEqual(a,composeResponseIncident(0,seed));assert.deepEqual(b,composeResponseIncident(1,seed,a,d));
 for(const instance of [a,b,c]){assert(instance.board.nodes.some(n=>n.id==='employee:layla'));assert(instance.board.nodes.some(n=>n.id==='device:WKST-02'&&n.companyRef.id==='WKST-02'));assert(instance.evidence.some(e=>e.role==='distractor'));assert.equal(new Set(instance.evidence.map(e=>e.id)).size,instance.evidence.length);const times=instance.timeline.map(e=>e.time);assert.deepEqual(times,[...times].sort())}
 assert(c.evidence.find(e=>e.id==='login').raw.includes('success=0'),'endpoint escalation cannot undo prior account containment');
 const alt=composeResponseIncident(1,seed,a,{...d,action:'escalate'}),follow=composeResponseIncident(2,seed,alt,{...d,action:'contain'});
 assert(follow.evidence.find(e=>e.id==='login').raw.includes('success=1'),'endpoint isolation must not imply remote account session revocation');
 assert(a.timeline.at(-1).time<b.timeline[0].time);assert(b.timeline.at(-1).time<c.timeline[0].time);
}
const directory=await mkdtemp(join(tmpdir(),'cyberlab-expansion-'));
const modules=['index.js',...(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};let worker;
async function call(path,body,user='legacy',extra={}){const headers={...extra};if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test'}if(body!==undefined)headers['Content-Type']='application/json';const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),headers:r.headers}}
async function ok(path,body,user){const r=await call(path,body,user);assert.equal(r.status,200,JSON.stringify(r.data));return r.data}
async function retained(user){const db=await worker.getD1Database('DB'),out={};for(const t of ['progress','skill_awards','skill_progress','career_promotions','mission_progress','interactive_lab_progress','soc_investigations','notes','preferences','dynamic_active'])out[t]=(await db.prepare('SELECT * FROM '+t+' WHERE user_id=? ORDER BY rowid').bind(user).all()).results;return out}
async function seedExisting(user){const db=await worker.getD1Database('DB'),now='2026-09-24T12:00:00Z';await db.prepare("INSERT INTO soc_investigations(user_id,alert_id,status,started_at,updated_at,closed_at,session_json) VALUES(?,?,'Closed',?,?,?,?)").bind(user,'SOC-002',now,now,now,JSON.stringify({lastResult:{correct:true}})).run();await db.prepare("INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,'boss:boss-002','boss',100,340,?)").bind(user,now).run();await db.prepare("INSERT INTO investigation_workspaces(user_id,investigation_id,status,created_at,updated_at) VALUES(?,'soc-SOC-002','closed',?,?)").bind(user,now,now).run()}
async function prepare(instance,user='legacy'){
 const path='/api/investigations/'+instance.board.id;
 for(const eid of instance.successConditions.requiredEvidenceIds){await ok(path,{action:'review',evidenceId:eid},user);await Promise.all([1,2,3].map(()=>ok(path,{action:'collect',evidenceId:eid},user)))}
 for(const link of instance.successConditions.requiredLinks)await ok(path,{action:'link',...link,reason:'تطابق الكيانان في المصدر المحفوظ والتوقيت نفسه.'},user);
 return {path,answer:{hypothesis:instance.validConclusions[0],affected:instance.affectedEntities,evidenceIds:instance.successConditions.requiredEvidenceIds,action:instance.recommendedActions[0]}};
}
async function privateInstance(user,id){const db=await worker.getD1Database('DB');return JSON.parse((await db.prepare('SELECT snapshot_json AS snapshot FROM dynamic_incidents WHERE user_id=? AND instance_id=?').bind(user,id).first()).snapshot)}
try{
 worker=new Miniflare(options);const db=await worker.getD1Database('DB');for(const f of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 for(const method of [undefined,{stage:0}])assert.equal((await call('/api/incident-chains',method,null)).status,401);
 assert((await ok('/api/incident-chains',undefined,'zero')).locked);for(let stage=0;stage<3;stage++)assert.equal((await call('/api/incident-chains',{stage},'zero')).status,403);
 for(const b of [{stage:-1},{stage:3},{stage:'0'},{stage:0,userId:'another'},{stage:0,xp:100},null])assert.equal((await call('/api/incident-chains',b)).status,400);
 assert.equal((await call('/api/incident-chains',{stage:0},'legacy',{Origin:'https://outside.test'})).status,403);
 await seedExisting('legacy');await seedExisting('escalated');
 const old=await retained('legacy'),oldBoard=await ok('/api/investigations/soc-SOC-002');
 let chain=await ok('/api/incident-chains');assert.equal(chain.locked,false);assert.equal(chain.stages[0].status,'available');assert.equal(chain.stages[1].status,'locked');assert.equal((await call('/api/incident-chains',{stage:1})).status,403);
 const starts=await Promise.all(Array.from({length:6},()=>ok('/api/incident-chains',{stage:0})));assert.equal(new Set(starts.map(s=>s.instanceId)).size,1);assert.equal(starts.filter(s=>s.created).length,1,'only one concurrent start creates a snapshot');
 const firstId=starts[0].instanceId,first=await privateInstance('legacy',firstId),firstPath='/api/investigations/'+first.board.id;
 let state=await ok(firstPath);assert.equal(state.review,null);assert(!Object.hasOwn(state.board,'expected'));assert(state.board.evidence.every(e=>e.role==='unclassified'));
 assert.equal((await call(firstPath,undefined,'zero')).status,404);assert.equal((await call(firstPath,{action:'review',evidenceId:'message'},'zero')).status,404);
 await ok(firstPath,{action:'review',evidenceId:'normal-mail'});await ok(firstPath,{action:'collect',evidenceId:'normal-mail'});
 const prepared=await prepare(first);assert.equal((await ok(firstPath)).evidence.filter(e=>e.evidenceId==='message').length,1);
 assert.equal((await call(firstPath,{action:'link',fromId:'account:layla',toId:'account:layla',relation:'USES',reason:'Self-reference is not a supported relationship.'})).status,400);
 assert.equal((await call(firstPath,{action:'link',fromId:'account:another-user',toId:'email:message',relation:'RECEIVED',reason:'Unknown entity must not be accepted into this board.'})).status,400);
 await ok(firstPath,{action:'annotate',evidenceId:'message',note:'ربط البريد بوقت دخول الحساب.',classification:'relevant'});
 assert.equal((await ok(firstPath)).evidence.find(e=>e.evidenceId==='message').note,'ربط البريد بوقت دخول الحساب.');
 state=await ok(firstPath,{action:'decide',decision:{...prepared.answer,hypothesis:'routine'}});assert.equal(state.workspace.status,'open');assert.equal(state.review,null,'failed hypothesis must not reveal the solution');assert(state.feedback.observation);assert.equal((await call('/api/incident-chains',{stage:1})).status,403);
 assert.equal((await call(firstPath,{action:'decide',decision:{...prepared.answer,evidenceIds:[...prepared.answer.evidenceIds,'normal-mail']}})).status,400,'distractor does not substitute for proof');
 state=await ok(firstPath,{action:'decide',decision:prepared.answer});assert.equal(state.workspace.status,'contained');assert(state.consequence);assert(state.review.explanation);
 assert.deepEqual(await retained('legacy'),old);assert.deepEqual(await ok('/api/investigations/soc-SOC-002'),oldBoard);
 const secondStart=await ok('/api/incident-chains',{stage:1}),second=await privateInstance('legacy',secondStart.instanceId);assert.equal(second.chain.previousInstanceId,firstId);assert.equal(second.chain.identityResponse,'contain');const secondReady=await prepare(second);
 state=await ok(secondReady.path,{action:'decide',decision:{...secondReady.answer,affected:['account:layla']}});assert.equal(state.workspace.status,'open','device impact requires the affected device too');assert.equal(state.review,null);
 state=await ok(secondReady.path,{action:'decide',decision:secondReady.answer});assert.equal(state.workspace.status,'contained');
 const thirdStart=await ok('/api/incident-chains',{stage:2}),third=await privateInstance('legacy',thirdStart.instanceId);assert(third.evidence.find(e=>e.id==='login').raw.includes('success=0'));const thirdReady=await prepare(third);
 state=await ok(thirdReady.path,{action:'decide',decision:{...thirdReady.answer,hypothesis:'suspicious-auth',action:'contain'}});assert.equal(state.workspace.status,'open');assert(state.feedback.observation.includes('اتصال الشبكة'));assert.equal(state.review,null);
 state=await ok(thirdReady.path,{action:'decide',decision:thirdReady.answer});assert.equal(state.workspace.status,'closed');assert.equal((await ok('/api/incident-chains')).completed,true);
 // Opposite account response changes the later evidence; endpoint containment is not account containment.
 for(let stage=0;stage<3;stage++){const start=await ok('/api/incident-chains',{stage},'escalated'),incident=await privateInstance('escalated',start.instanceId),p=await prepare(incident,'escalated');if(stage===0)p.answer.action='escalate';if(stage===2)assert(incident.evidence.find(e=>e.id==='login').raw.includes('success=1'));await ok(p.path,{action:'decide',decision:p.answer},'escalated')}
 const beforeReplay=await retained('legacy'),snapshots=[];
 for(const incident of [first,second,third]){const p='/api/investigations/'+incident.board.id;snapshots.push(await ok(p));await ok(p,{action:'reopen'});const start=await ok('/api/incident-chains',{stage:incident.chain.stage});assert.equal(start.instanceId,incident.instanceId);const prepared=await prepare(incident);await ok(p,{action:'decide',decision:prepared.answer})}
 assert.deepEqual(await retained('legacy'),beforeReplay,'no old completion, XP, Skill XP, career, SOC, notes or active variant is changed');
 const count=await db.prepare('SELECT COUNT(*) AS n FROM dynamic_incidents WHERE user_id=?').bind('legacy').first();assert.equal(count.n,3);
 assert.equal((await call(firstPath,undefined,'escalated')).status,404);assert.equal((await call(firstPath,{action:'review',evidenceId:'message'},'escalated')).status,404);
 const restored=await ok(thirdReady.path),restoredFirst=await ok(firstPath);await worker.dispose();worker=new Miniflare(options);assert.deepEqual(await ok(thirdReady.path),restored);assert.deepEqual(await ok(firstPath),restoredFirst);assert((await ok('/api/incident-chains')).completed);
 for(const path of [responseChain.href,responseChain.href+'?stage=2&step=decide','/learn/security-8?return_to='+encodeURIComponent(responseChain.href+'?stage=0&step=observe&field=message')]){const r=await worker.dispatchFetch('http://local.test'+path);assert.equal(r.status,200,path);if(path.startsWith('/learn'))assert((await r.text()).includes('العودة إلى البلاغ'))}
 console.log('PASS: 39 deterministic connected chains, staged unlocks, legacy progress, account/device/source continuity, temporal consistency, evidence and link correlation, wrong/recheck without answer reveal, containment vs escalation consequences, lesson return, concurrent starts, replay/restart, cross-account local API isolation, unchanged reward ledgers and legacy investigations. Production OAuth/WAF/Safari NOT tested.');
}finally{if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true})}
