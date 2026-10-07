// Built Worker + disposable D1. No Production credentials, targets or database.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wr.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function source(path){const b=await build({entryPoints:[path],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const {offensiveCases,offensiveCaseIds}=await source('lib/offensive-expansion.ts');
const {nexaCorp}=await source('lib/nexacorp.ts');
for(const c of Object.values(offensiveCases))assert(nexaCorp.importantAssets.some(a=>a.id===c.assetId));
const rules={
 'v2-attack-surface':{required:['policy','external','internal'],hypothesis:'zone',finding:'config',impact:'metadata',patch:'restrict',bad:'close',retests:['external','internal','portal']},
 'v2-access-control':{required:['own','guest','other'],hypothesis:'object',finding:'read',impact:'confidentiality',patch:'server',bad:'hide',retests:['own','guest','other']},
 'v2-auth-session':{required:['old','current','anonymous'],hypothesis:'revocation',finding:'revocation',impact:'continued',patch:'revoke',bad:'cookie',retests:['old','current','anonymous']}
};
const dir=await mkdtemp(join(tmpdir(),'cyberlab-offensive-v2-'));
const modules=['index.js',...(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const configuration={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:dir,cf:false};let worker=new Miniflare(configuration),db;
const api=id=>'/api/interactive-labs/'+id;
async function call(path,body,user='learner') {const headers={'Content-Type':'application/json'};if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test'}const r=await worker.dispatchFetch('http://local.test'+path,{headers,method:body===undefined?'GET':'POST',body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
async function state(id,user='learner'){const r=await call(api(id),undefined,user);assert.equal(r.status,200);return r.data}
async function act(id,action,more={},user='learner'){const r=await call(api(id),{action,...more},user);assert.equal(r.status,200,JSON.stringify(r));return r.data.state}
const p=s=>s.assessment||s.minimum;
async function prepare(id,{replay=false,user='learner',negative=true}={}){
 const c=offensiveCases[id],r=rules[id];
 if(!replay){await act(id,'start',{},user);await act(id,'assessment-upgrade',{},user)}
 if(negative){await act(id,'scope-check',{scope:['WEB-01']},user);assert.equal((await state(id,user)).state.session.offensive.scopeApproved,false);assert.equal((await call(api(id),{action:'authorize',accepted:true},user)).status,400);assert.equal((await call(api(id),{action:'scope-check',scope:['https://external.invalid']},user)).status,400);}
 await act(id,'scope-check',{scope:[...c.scope]},user);await act(id,'authorize',{accepted:true},user);
 assert.equal((await call(api(id),{action:'probe',key:'WEB-01'},user)).status,400);
 assert.equal((await call(api(id),{action:'probe',key:r.required[0],ip:'8.8.8.8'},user)).status,400);
 assert.equal((await call(api(id),{action:'submit'},user)).status,400);
 if(id==='v2-attack-surface'){
  for(const key of ['portal','metrics','admin'])await act(id,'inspect',{key},user);
  await act(id,'classify-start',{},user);
  for(const [key,value] of [['portal','present'],['metrics','vulnerability'],['admin','present']])await act(id,'classify',{key,value},user);
  if(negative){await act(id,'prioritize',{},user);assert.equal(p((await state(id,user)).state.session).step,'classify');assert(p((await state(id,user)).state.session).feedback)}
  await act(id,'classify',{key:'metrics',value:'review'},user);await act(id,'prioritize',{},user);
  if(negative){await act(id,'priority',{key:'portal'},user);assert.equal(p((await state(id,user)).state.session).step,'prioritize')}
  await act(id,'priority',{key:'metrics'},user);
 }else if(id==='v2-access-control'){
  for(const key of ['account','reports'])await act(id,'page',{key},user);await act(id,'observe',{},user);await act(id,'hypothesis',{},user);
  await act(id,'choose',{key:negative?'ui':r.hypothesis},user);
 }else{
  await act(id,'login',{},user);await act(id,'logout',{},user);await act(id,'login-again',{},user);await act(id,'hypothesis',{},user);await act(id,'choose',{key:negative?'browser':r.hypothesis},user);
 }
 for(const key of r.required)await act(id,'probe',{key},user);
 if(id==='v2-attack-surface')await act(id,'choose',{key:negative?'port':r.hypothesis},user);
 assert.equal((await call(api(id),{action:'evaluate'},user)).status,400); // seeing is not collecting
 for(const key of r.required){await act(id,'mark',{key},user);await act(id,'mark',{key},user)}
 assert.equal((await state(id,user)).state.session.evidence.length,3);
 if(negative){await act(id,'evaluate',{},user);assert.notEqual(p((await state(id,user)).state.session).step,'impact');assert.equal((await state(id,user)).state.completedAt,null);await act(id,'recheck',{},user);}
 if(negative||id==='v2-attack-surface')await act(id,'choose',{key:r.hypothesis},user);await act(id,'evaluate',{},user);assert.equal(p((await state(id,user)).state.session).step,'impact');
 if(negative){await act(id,'report',{report:{finding:r.finding,impact:r.impact,evidence:r.required,asset:'WEB-01'}},user);assert.equal(p((await state(id,user)).state.session).step,'impact');assert.equal((await call(api(id),{action:'report',report:{finding:r.finding,impact:r.impact,evidence:['not-collected'],asset:c.affected}},user)).status,400);}
 await act(id,'report',{report:{finding:r.finding,impact:r.impact,evidence:r.required,asset:c.affected}},user);
 assert.equal(p((await state(id,user)).state.session).step,'remediation');
 if(negative){
  await act(id,'patch',{key:r.bad},user);for(const key of r.retests)await act(id,'retest',{key},user);
  await act(id,'finding-report',{key:'verified',value:c.handoff},user);assert.equal((await state(id,user)).state.session.offensive.reportReady,false);assert.equal((await call(api(id),{action:'submit'},user)).status,400);
 }
 await act(id,'patch',{key:r.patch},user);assert.equal((await call(api(id),{action:'finding-report',key:'verified',value:c.handoff},user)).status,400);
 for(const key of r.retests)await act(id,'retest',{key},user);
 if(negative){await act(id,'finding-report',{key:'incomplete',value:c.handoff},user);assert.equal((await state(id,user)).state.session.offensive.reportReady,false);await act(id,'finding-report',{key:'verified',value:c.handoff==='exposure'?'session':'exposure'},user);assert.equal((await state(id,user)).state.session.offensive.reportReady,false);}
 await act(id,'finding-report',{key:'verified',value:c.handoff},user);assert.equal((await state(id,user)).state.session.offensive.reportReady,true);
 return (await state(id,user)).state;
}
async function rewards(user='learner'){const out={};for(const table of ['progress','skill_awards','skill_progress','achievement_unlocks'])out[table]=(await db.prepare('SELECT * FROM '+table+' WHERE user_id=? ORDER BY rowid').bind(user).all()).results;return out}
try{
 db=await worker.getD1Database('DB');for(const f of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 const now='2026-10-01T12:00:00Z';
 assert.equal((await call(api(offensiveCaseIds[0]),undefined,null)).status,401);
 assert.equal((await state(offensiveCaseIds[0])).access.locked,true);assert.equal((await call(api(offensiveCaseIds[0]),{action:'start'})).status,400);
 // Fulfil existing prerequisites only; no new thresholds or bypass flags.
 for(const user of ['learner','other']){await db.prepare('INSERT INTO activity(user_id,lesson_id,started_at,last_at,completed_at) VALUES(?,?,?,?,?)').bind(user,'security-6',now,now,now).run();await db.prepare('INSERT INTO interactive_lab_progress(user_id,lab_id,started_at,updated_at,completed_at) VALUES(?,?,?,?,?)').bind(user,'v2-http',now,now,now).run()}
 for(const id of offensiveCaseIds){
  if(id==='v2-auth-session')assert.equal((await state(id)).access.locked,false);
  const ready=await prepare(id);
  // Refresh and Worker restart recover exact scope, evidence, finding and retest state.
  assert.deepEqual((await state(id)).state,ready);await worker.dispose();worker=new Miniflare(configuration);db=await worker.getD1Database('DB');assert.deepEqual((await state(id)).state,ready);
  assert.equal((await state(id,'other')).state,null);assert.equal((await call(api(id),{action:'mark',key:rules[id].required[0],userId:'learner'},'other')).status,400);
  const responses=await Promise.all([call(api(id),{action:'submit'}),call(api(id),{action:'submit'})]);assert(responses.some(r=>r.status===200));assert(responses.every(r=>[200,400].includes(r.status)));
  assert((await state(id)).state.completedAt);assert.equal((await state(id)).state.session.lastResult.passed,true);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM progress WHERE user_id=? AND item_id=?').bind('learner',id).first()).n,1);
  await call('/api/progression');const first=await rewards();
  await act(id,'replay');await prepare(id,{replay:true,negative:false});await act(id,'submit');await call('/api/progression');assert.deepEqual(await rewards(),first);
  assert.equal((await state(id)).state.session.lastResult.xpGranted,false);
 }
 const all=await call('/api/progression');assert.equal(all.data.achievements.find(a=>a.id==='offensive-foundations').earnedTier,2);
 assert.equal((await state('v2-auth-session','other')).access.locked,true);
 // Old in-flight attempt stays old; upgrading cannot silently destroy it.
 await act('v2-access-control','start',{},'other');await act('v2-access-control','authorize',{accepted:true},'other');
 const old=await state('v2-access-control','other');assert.equal((await call(api('v2-access-control'),{action:'assessment-upgrade',accepted:true},'other')).status,400);assert.deepEqual((await state('v2-access-control','other')).state,old.state);
 // Existing completion without prerequisite rows remains readable and replayable, no duplicate reward.
 const legacy='legacy',id='v2-access-control',legacySession={assessment:{step:'result'},lastResult:{passed:true}};
 await db.prepare('INSERT INTO interactive_lab_progress(user_id,lab_id,started_at,updated_at,completed_at,best_score,session_json) VALUES(?,?,?,?,?,100,?)').bind(legacy,id,now,now,now,JSON.stringify(legacySession)).run();
 await db.prepare('INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,?,?,?,?,?)').bind(legacy,id,'lab',100,75,now).run();
 assert.equal((await state(id,legacy)).access.locked,false);assert.deepEqual((await state(id,legacy)).state.session,legacySession);
 await act(id,'assessment-upgrade',{accepted:true},legacy);const completedAt=(await state(id,legacy)).state.completedAt;await prepare(id,{replay:true,user:legacy,negative:false});await act(id,'submit',{},legacy);assert.equal((await state(id,legacy)).state.completedAt,completedAt);assert.equal((await state(id,legacy)).state.session.lastResult.xpGranted,false);assert.equal((await db.prepare('SELECT SUM(xp) AS xp FROM progress WHERE user_id=?').bind(legacy).first()).xp,75);
 for(const id of offensiveCaseIds)assert.equal((await worker.dispatchFetch('http://local.test/labs/v2/'+id)).status,200);
 console.log('PASS: three expanded existing assessments on actual built Worker/D1; scope enforcement, discovery, wrong/revised hypotheses, collected evidence gates, bounded asset/impact, wrong/correct fixes, interpreted retest/report before completion, refresh/restart, locked/legacy users, same existing IDs and achievements, replay/concurrent reward dedupe and local ownership isolation.');
}finally{await worker.dispose();await rm(dir,{recursive:true,force:true})}
