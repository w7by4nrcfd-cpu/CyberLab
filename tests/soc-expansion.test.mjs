import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(file){const r=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'))}
const {defensiveBoards,defensiveReturnPath}=await load('lib/soc-expansion.ts');
const {validBoardDefinition,validRelationship}=await load('lib/investigation-board.ts');
for(const board of defensiveBoards){assert(validBoardDefinition(board));assert.equal(new Set(board.evidence.map(e=>e.id)).size,board.evidence.length);for(const l of board.expected.requiredLinks)assert(validRelationship(board,l.fromId,l.relation,l.toId));}
assert.equal(defensiveReturnPath('//external.example/path'),null);assert.equal(defensiveReturnPath('/soc/alerts/SOC-004?view=defensive&step=verify'),'/soc/alerts/SOC-004?view=defensive&step=verify');
const {Miniflare}=await import(createRequire(require.resolve('wrangler/package.json')).resolve('miniflare'));
const files=(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js'));
const dir=await mkdtemp(join(tmpdir(),'cyberlab-response-'));
const options={modules:['index.js',...files.filter(f=>f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f})),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:dir,cf:false};
let worker=new Miniflare(options);let user='response-a';
async function call(path,body,identity=user){const h={};if(identity){h['oai-authenticated-user-id']=identity;h['oai-authenticated-user-email']=identity+'@example.test'}if(body!==undefined)h['Content-Type']='application/json';const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers:h,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
const soc=id=>'/api/soc/alerts/'+id,locker=id=>'/api/investigations/soc-'+id;
async function ok(path,body){const r=await call(path,body);assert.equal(r.status,200,JSON.stringify(r.data));return r.data}
async function action(id,kind,data={}){return ok(soc(id),{action:kind,...data})}
async function prepare(id,{wrong=false}={}){
 const b=defensiveBoards.find(b=>b.sourceId===id);
 await action(id,'start');await action(id,'defensive');
 await action(id,'triage',{priority:id==='SOC-004'?'Critical':'Low',reason:'أولوية مستندة إلى حساسية الخادم ونطاق النشاط المرصود.'});
 await action(id,'tool',{toolId:id==='SOC-004'?'process-tree':'signature'});
 const initial=await ok(locker(id));assert(initial.board.evidence.every(e=>e.role==='unclassified'&&e.raw===''));assert(!('expected' in initial.board));assert(!('allowedLinks' in initial.board));
 assert.equal((await call(locker(id),{action:'collect',evidenceId:b.evidence[0].id})).status,400);
 for(const e of b.evidence){await ok(locker(id),{action:'review',evidenceId:e.id});await ok(locker(id),{action:'collect',evidenceId:e.id});await ok(locker(id),{action:'collect',evidenceId:e.id});}
 assert.equal((await ok(locker(id))).evidence.length,b.evidence.length);
 assert.equal((await call(locker(id),{action:'link',fromId:b.nodes[0].id,toId:b.nodes[0].id,relation:'RELATED_TO',reason:'رابط غير صالح للاختبار.'})).status,400);
 for(const l of b.expected.requiredLinks){await ok(locker(id),{action:'link',...l,reason:'تطابق الكيان والتوقيت بين مصادر الأدلة المجموعة.'});await ok(locker(id),{action:'link',...l,reason:'تطابق الكيان والتوقيت بين مصادر الأدلة المجموعة.'});}
 const decision={hypothesis:b.expected.hypothesis,affected:b.expected.affected,evidenceIds:b.expected.requiredEvidenceIds,action:b.expected.actions[0]};
 assert.equal((await call(locker(id),{action:'decide',decision})).status,400); // No premature completion/achievement through board API.
 if(wrong){const r=await action(id,'assess',{decision:{...decision,hypothesis:id==='SOC-004'?'quarantine-only':'incident'}});assert.equal(r.state.closedAt,null);assert.equal(r.state.session.defensive.phase,'evidence');assert(r.state.session.defensive.feedback);assert.equal(r.state.session.verdict,null);assert.equal(r.state.session.lastResult,null);}
 const result=await action(id,'assess',{decision});assert.equal(result.state.session.defensive.phase,'respond');assert.equal((await ok(locker(id))).workspace.status,'open');
 return b;
}
async function finish(id,{badResponse=false}={}){
 if(badResponse){await action(id,'response-test',{plan:id==='SOC-004'?'file-only':'disable'});const seen=await ok(soc(id));assert.equal(seen.responseObservations.length,2);let r=await action(id,'verify',{checks:seen.responseObservations.map(o=>o.id),verification:'effective'});assert.equal(r.state.session.defensive.phase,'respond');assert.equal(r.state.closedAt,null);assert(r.state.session.defensive.feedback);}
 const tested=await action(id,'response-test',{plan:id==='SOC-004'?'complete':'scoped-close'});assert.equal(tested.state.session.defensive.phase,'verify');assert.equal((await call(soc(id),{action:'close'})).status,400);
 assert.equal((await call(soc(id),{action:'verify',checks:[tested.responseObservations[0].id],verification:'effective'})).status,400);
 await action(id,'verify',{checks:tested.responseObservations.map(o=>o.id),verification:'effective'});
 assert.equal((await call(soc(id),{action:'close'})).status,400);
 await action(id,'report',{reportNext:id==='SOC-004'?'follow-up':'baseline'});
 const results=await Promise.all([call(soc(id),{action:'close'}),call(soc(id),{action:'close'})]);assert(results.some(r=>r.status===200),JSON.stringify(results));assert(results.every(r=>[200,400].includes(r.status)));
 const finished=await ok(soc(id));assert(finished.state.closedAt);assert.equal(finished.state.score,100);assert.equal(finished.state.session.lastResult.correct,true);assert.equal(finished.state.session.defensive.verified,true);assert.notEqual((await ok(locker(id))).workspace.status,'open');return finished;
}
try{
 let db=await worker.getD1Database('DB');for(const f of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 assert.equal((await call(soc('SOC-004'),undefined,null)).status,401);
 assert.equal((await ok(soc('SOC-004'))).defensiveUnlocked,false);await action('SOC-004','start');assert.equal((await call(soc('SOC-004'),{action:'defensive'})).status,400);assert.equal((await call(locker('SOC-004'))).status,403);
 const now='2026-09-24T12:00:00Z';await db.prepare("INSERT INTO soc_investigations(user_id,alert_id,status,started_at,updated_at,closed_at,session_json) VALUES(?,'SOC-002','Resolved',?,?,?,?)").bind(user,now,now,now,JSON.stringify({lastResult:{correct:true}})).run();
 await db.prepare("INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,'legacy-lesson','lesson',100,50,?)").bind(user,now).run();
 const progressBefore=await ok('/api/progress');
 await prepare('SOC-004',{wrong:true});assert.equal((await call(soc('SOC-004'),{action:'decide',verdict:'true_positive',conclusion:'محاولة تجاوز مسار التقييم والتحقق الحالي.'})).status,400);
 // Worker restart proves persisted evidence, correlations and server phase, not just local UI draft.
 const before=await ok(locker('SOC-004'));await worker.dispose();worker=new Miniflare(options);db=await worker.getD1Database('DB');assert.deepEqual((await ok(locker('SOC-004'))).links,before.links);assert.equal((await ok(soc('SOC-004'))).state.session.defensive.phase,'respond');
 await finish('SOC-004',{badResponse:true});const awards=await db.prepare("SELECT * FROM skill_awards WHERE user_id=? AND source_kind='soc' AND source_id='SOC-004' ORDER BY skill_id").bind(user).all();assert(awards.results.length>0);
 const completion=await ok(soc('SOC-004'));await action('SOC-004','start');assert.deepEqual((await ok(soc('SOC-004'))).state,completion.state); // existing completion not reset on read/start
 await action('SOC-004','reopen');await ok(locker('SOC-004'),{action:'reopen'});
 // Replay keeps evidence/links; only the existing SOC attempt is restarted.
 await action('SOC-004','defensive');await action('SOC-004','triage',{priority:'Critical',reason:'الخادم حساس ويستدعي فحص الأثر على الحساب والشبكة.'});await action('SOC-004','tool',{toolId:'process-tree'});
 const b=defensiveBoards[0];await action('SOC-004','assess',{decision:{hypothesis:b.expected.hypothesis,affected:b.expected.affected,evidenceIds:b.expected.requiredEvidenceIds,action:'contain'}});await finish('SOC-004');
 assert.deepEqual((await db.prepare("SELECT * FROM skill_awards WHERE user_id=? AND source_kind='soc' AND source_id='SOC-004' ORDER BY skill_id").bind(user).all()).results,awards.results);
 await prepare('SOC-010',{wrong:true});await finish('SOC-010',{badResponse:true});assert.equal((await ok(soc('SOC-010'))).state.status,'False Positive');assert.equal((await ok(soc('SOC-010'))).caseId,null);
 assert.deepEqual((await ok('/api/progress')).items,progressBefore.items);assert.equal((await ok('/api/progression')).achievements.some(a=>a.id==='soc-response'&&a.value>=2),true);
 // A second synthetic account cannot borrow either ownership or prerequisite identifiers.
 assert.equal((await call(soc('SOC-004'),undefined,'response-b')).data.state,null);assert.equal((await call(locker('SOC-004'),undefined,'response-b')).status,403);
 assert.equal((await call(soc('SOC-004'),{action:'verify',userId:user,checks:['network','identity'],verification:'effective'},'response-b')).status,400);
 const original=await ok(soc('SOC-004'));user='response-b';await db.prepare("INSERT INTO soc_investigations(user_id,alert_id,status,started_at,updated_at,closed_at,session_json) VALUES(?,'SOC-002','Resolved',?,?,?,?)").bind(user,now,now,now,JSON.stringify({lastResult:{correct:true}})).run();
 assert.equal((await call(locker('SOC-004'),{action:'review',evidenceId:'hash',userId:'response-a'})).status,400);await ok(locker('SOC-004'),{action:'review',evidenceId:'hash'});assert.equal((await ok(locker('SOC-004'))).evidence.length,1);assert.equal((await ok(locker('SOC-004'))).links.length,0);
 assert.deepEqual((await call(soc('SOC-004'),undefined,'response-a')).data.state,original.state);
 // Previously completed legacy target without the new prerequisite remains accessible, without retroactive verification claims.
 user='legacy';await db.prepare("INSERT INTO soc_investigations(user_id,alert_id,status,started_at,updated_at,closed_at,session_json) VALUES(?,'SOC-010','False Positive',?,?,?,?)").bind(user,now,now,now,JSON.stringify({lastResult:{correct:true}})).run();
 const legacy=await ok(soc('SOC-010'));assert.equal(legacy.defensiveUnlocked,true);assert.equal(legacy.state.session.defensive,undefined);await action('SOC-010','reopen');await action('SOC-010','defensive');assert.equal((await ok(soc('SOC-010'))).defensiveUnlocked,true);
 console.log('PASS: two existing SOC response adapters, locked/deep API guards, private answer masking, independent evidence correlation, wrong assessment/recheck, incomplete/overbroad response retry, verification/report close gate, atomic board/SOC completion, legacy access, restart persistence, replay/concurrent Skill XP dedupe, unchanged general XP, current achievements and cross-account local isolation.');
}finally{await worker.dispose();await rm(dir,{recursive:true,force:true})}
