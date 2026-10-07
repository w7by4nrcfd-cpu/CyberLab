// A built Worker and a disk-backed, isolated D1 database. No production data is touched.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url);
const wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function source(entry){const r=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'))}
const {answerKey}=await source('lib/answer-key.ts');
const {lessons}=await source('lib/curriculum.ts');
const {completedIds,learningMetrics}=await source('lib/metrics.ts');
const {levelFor}=await source('lib/simulations.ts');
const files=(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js'));
const modules=['index.js',...files.filter(f=>f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const directory=await mkdtemp(join(tmpdir(),'cyberlab-persistence-'));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};
let worker;
async function call(path,data,user){const headers={};if(data!==undefined)headers['Content-Type']='application/json';if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test';}const r=await worker.dispatchFetch('http://local.test'+path,{method:data===undefined?'GET':'POST',headers,body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,data:await r.json()}}
async function state(user){const progress=await call('/api/progress',undefined,user),learning=await call('/api/learning',undefined,user);assert.equal(progress.status,200);assert.equal(learning.status,200);return {items:progress.data.items,learning:learning.data}}
async function pass(id,user){const answers=id==='net-3'?[0,[0,1],'UDP']:answerKey[id]?.map(q=>q.answer) ?? (id==='it-1'?[0,1,0]:undefined);assert(answers);const result=await call('/api/submit',{kind:'quiz',id,answers},user);assert.equal(result.status,200);assert.equal(result.data.passed,true);assert.equal(result.data.saved,true);return result}
try {
 worker=new Miniflare(options);
 const db=await worker.getD1Database('DB');
 for(const migration of ['0000_busy_norrin_radd.sql','0001_supreme_viper.sql','0002_puzzling_lord_tyger.sql','0003_icy_morg.sql','0004_glamorous_ser_duncan.sql','0005_tiresome_mach_iv.sql'])for(const sql of (await readFile('drizzle/'+migration,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 assert.equal((await state('new-user')).items.length,0);
 assert.equal((await call('/api/progress')).status,401);
 await pass('net-1','learner-a');
 let first=await state('learner-a');
 assert.deepEqual([...completedIds(first.items,first.learning)],['net-1']);
 assert.equal(learningMetrics(first.items,first.learning).xp,100);
 assert.equal(lessons.filter(l=>l.track==='network'&&!completedIds(first.items,first.learning).has(l.id))[0].id,'network-1');
 await Promise.all([pass('net-2','learner-a'),pass('net-3','learner-a'),pass('net-4','learner-a')]);
 await pass('it-1','learner-a');
 let multi=await state('learner-a');
 const done=completedIds(multi.items,multi.learning);
 assert.equal(multi.items.length,5);
 assert.equal(learningMetrics(multi.items,multi.learning).xp,500);
 assert.equal(levelFor(500),3);
 assert.equal(lessons.filter(l=>l.track==='network'&&done.has(l.id)).length,4);
 assert.equal(lessons.filter(l=>l.track==='it'&&done.has(l.id)).length,1);
 const remainingLevelOne=lessons.filter(l=>l.track==='network'&&l.level===1&&!done.has(l.id));
 for(const lesson of remainingLevelOne)assert.equal((await call('/api/learning',{action:'complete',id:lesson.id},'learner-a')).status,200);
 const levelDone=completedIds((await state('learner-a')).items,(await state('learner-a')).learning);
 assert.equal(lessons.filter(l=>l.track==='network'&&!levelDone.has(l.id))[0].level,2);
 assert.equal(lessons.filter(l=>l.track==='it'&&!done.has(l.id))[0].id,'it-2');
 await pass('net-1','learner-a');
 assert.equal(learningMetrics((await state('learner-a')).items,(await state('learner-a')).learning).xp,500);
 assert.equal((await state('learner-b')).items.length,0);
 assert.equal((await call('/api/learning',undefined)).status,401); // Signed out.
 await worker.dispose(); worker=undefined; // Simulates closing the site and starting a fresh session.
 worker=new Miniflare(options);
 const reopened=await state('learner-a');
 assert.equal(reopened.items.length,5);
 assert.equal(learningMetrics(reopened.items,reopened.learning).xp,500);
 assert.equal(levelFor(learningMetrics(reopened.items,reopened.learning).xp),3);
 assert.equal(lessons.filter(l=>l.track==='network'&&completedIds(reopened.items,reopened.learning).has(l.id)).length,4+remainingLevelOne.length);
 assert.equal(lessons.filter(l=>l.track==='network'&&!completedIds(reopened.items,reopened.learning).has(l.id))[0].level,2);
 assert.equal((await state('learner-b')).items.length,0);
 // A failed completion write must not leave XP without a corresponding completion row.
 await (await worker.getD1Database('DB')).prepare('DROP TABLE activity').run();
 const failed=await call('/api/submit',{kind:'quiz',id:'net-1',answers:answerKey['net-1'].map(q=>q.answer)},'transaction-failure');
 assert.equal(failed.status,503);
 assert.equal((await call('/api/progress',undefined,'transaction-failure')).data.items.length,0);
 console.log('PASS: new user, one/multiple lessons, full level, two independent tracks, duplicate XP, refresh, sign-out/in, and D1 persistence after Worker restart.');
}finally{if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true})}
