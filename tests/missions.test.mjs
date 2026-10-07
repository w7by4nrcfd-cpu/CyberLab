import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const output=await build({entryPoints:['lib/missions.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {missions}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const files=(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js'));
const modules=['index.js',...files.filter(f=>f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const directory=await mkdtemp(join(tmpdir(),'cyberlab-missions-'));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};
let worker;
async function call(path,body,user='test-learner'){
 const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test'}
 const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};
}
const action=async(id,kind,more={})=>{const r=await call('/api/missions',{id,action:kind,...more});assert.equal(r.status,200,JSON.stringify(r.data));return r.data};
try{
 worker=new Miniflare(options);const db=await worker.getD1Database('DB');
 for(const migration of ['0000_busy_norrin_radd.sql','0001_supreme_viper.sql','0002_puzzling_lord_tyger.sql','0003_icy_morg.sql','0004_glamorous_ser_duncan.sql','0005_tiresome_mach_iv.sql'])for(const sql of (await readFile('drizzle/'+migration,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 assert.equal((await call('/api/missions',undefined,null)).status,401);
 assert.equal((await call('/api/missions',{id:'001',action:'start'},null)).status,401);
 assert.equal((await call('/api/missions')).data.states.length,0);
 for(const mission of missions){
  const id=mission.id;
  let state=(await action(id,'start')).state;assert.equal(state.progress,0);assert(state.startedAt);
  // Correct final text alone is insufficient; the investigation has to happen first.
  const answers=Object.fromEntries(Object.entries(mission.successConditions.answers).map(([key,values])=>[key,values.acceptedAnswers[0]]));
  const early=await action(id,'solve',{answers});assert.equal(early.state.completedAt,null);
  for(const evidenceId of mission.successConditions.evidence)await action(id,'inspect',{evidenceId});
  for(const toolId of mission.successConditions.tools){const tool=mission.tools.find(t=>t.id===toolId);await action(id,'tool',{toolId,command:tool.command})}
  if(id==='001'){
   const transcript=(await call('/api/missions')).data.states.find(s=>s.id===id).session.transcript;
   assert.match(transcript.at(-1).output,/192\.168\.50\.24/);
  }
  if(id==='003'){
   const hinted=await action(id,'hint');assert.equal(hinted.state.session.hintsUsed,1);
  }
  const won=await action(id,'solve',{answers});assert(won.state.completedAt);assert(won.state.stars>=1&&won.state.stars<=3);assert.equal(won.state.progress,100);assert.equal(won.state.session.lastResult.xpGranted,true);
  const duplicate=await action(id,'solve',{answers});assert.equal(duplicate.state.attempts,won.state.attempts);
 }
 const expected=missions.reduce((sum,m)=>sum+m.xpReward,0);
 let items=(await call('/api/progress')).data.items;
 assert.equal(items.filter(i=>i.kind==='mission').length,5);assert.equal(items.reduce((s,i)=>s+i.xp,0),expected);
 assert.equal((await call('/api/missions',undefined,'other-learner')).data.states.length,0);
 const replay=await action('001','replay');assert.equal(replay.state.progress,0);assert(replay.state.completedAt);
 await action('001','inspect',{evidenceId:'lease'});
 for(const toolId of ['ipconfig','start-dhcp','renew']){const tool=missions[0].tools.find(t=>t.id===toolId);await action('001','tool',{toolId,command:tool.command})}
 const again=await action('001','solve',{answers:{cause:'dhcp',action:'تشغيل dhcp'}});
 assert.equal(again.state.session.lastResult.xpGranted,false);
 assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),expected);
 for(const mission of missions){
  const id=mission.id,aliasAnswers=Object.fromEntries(Object.entries(mission.successConditions.answers).map(([field,rule])=>[field,rule.aliases?.[0]||rule.acceptedAnswers[0]]));
  await action(id,'replay');
  for(const evidenceId of mission.successConditions.evidence)await action(id,'inspect',{evidenceId});
  for(const toolId of mission.successConditions.tools){const tool=mission.tools.find(t=>t.id===toolId);await action(id,'tool',{toolId,command:tool.command})}
  const firstField=Object.keys(aliasAnswers)[0];
  const wrong=await action(id,'solve',{answers:{...aliasAnswers,[firstField]:'إجابة خاطئة تمامًا'}});
  assert.equal(wrong.state.session.replaying,true);assert.equal(wrong.state.session.lastResult,undefined);
  const valid=await action(id,'solve',{answers:aliasAnswers});
  assert.equal(valid.state.session.lastResult.xpGranted,false);
 }
 assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),expected);
 // The lesson and its XP retain the same API contract after missions are added.
 const {answerKey}=await import('data:text/javascript;base64,'+Buffer.from((await build({entryPoints:['lib/answer-key.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})).outputFiles[0].text).toString('base64'));
 const lesson=await call('/api/submit',{kind:'quiz',id:'net-1',answers:answerKey['net-1'].map(q=>q.answer)});assert.equal(lesson.data.saved,true);
 assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),expected+100);
 await worker.dispose();worker=new Miniflare(options);
 const persisted=(await call('/api/missions')).data.states;assert.equal(persisted.filter(s=>s.completedAt).length,5);
 assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),expected+100);
 console.log('PASS: five complete investigations, hints, replay without XP, user isolation, lesson regression, and D1 persistence across Worker restart.');
}finally{if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true})}
