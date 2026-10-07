import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const module=async file=>{const output=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'))};
const {allMissions,missions}=await module('lib/missions.ts'),{bossMissions}=await module('lib/boss-missions.ts'),{answerKey}=await module('lib/answer-key.ts');
assert.equal(missions.length,5);assert.equal(bossMissions.length,3);assert.equal(allMissions.length,8);
const files=(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js'));
const modules=['index.js',...files.filter(f=>f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const directory=await mkdtemp(join(tmpdir(),'cyberlab-boss-'));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};
let worker;const user='boss-learner';
async function call(path,body,identity=user){const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(identity){headers['oai-authenticated-user-id']=identity;headers['oai-authenticated-user-email']=identity+'@example.test'}const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
const action=async(id,kind,more={})=>{const r=await call('/api/missions',{id,action:kind,...more});assert.equal(r.status,200,JSON.stringify(r.data));return r.data};
const answers=m=>Object.fromEntries(Object.entries(m.successConditions.answers).map(([key,rule])=>[key,rule.acceptedAnswers[0]]));
async function normal(m){await action(m.id,'start');for(const id of m.successConditions.evidence)await action(m.id,'inspect',{evidenceId:id});for(const id of m.successConditions.tools){const tool=m.tools.find(t=>t.id===id);await action(m.id,'tool',{toolId:id,command:tool.command})}const result=await action(m.id,'solve',{answers:answers(m)});assert(result.state.completedAt)}
async function boss(m){
 await action(m.id,'start');let state=(await call('/api/missions')).data.states.find(s=>s.id===m.id);assert(state.progress>=0&&state.progress<100);
 // Each objective is fulfilled through the same API and engine used by standard missions.
 const done=new Set();let pending=m.objectives.filter(o=>o.kind!=='solve');
 for(let pass=0;pending.length&&pass<20;pass++){
  const next=[];for(const o of pending){if(o.dependsOn?.some(id=>!done.has(id))){next.push(o);continue}
   if(o.kind==='evidence')await action(m.id,'inspect',{evidenceId:o.target});
   if(o.kind==='tool'){if(o.target==='renew-a')await action(m.id,'tool',{toolId:'start-dhcp-office',command:'dhcp start'});const tool=m.tools.find(t=>t.id===o.target);await action(m.id,'tool',{toolId:o.target,command:tool.command})}
   if(o.kind==='decision'){const d=m.decisions.find(d=>d.id===o.target);const result=await action(m.id,'decide',{decisionId:d.id,response:d.rule.acceptedAnswers[0]});assert(result.state.session.decisions.includes(d.id),result.message)}done.add(o.id)
  }pending=next;
 }
 assert.equal(pending.length,0,'objective dependencies should resolve');
 for(const id of m.successConditions.evidence)if(!state.session.inspected.includes(id))await action(m.id,'inspect',{evidenceId:id});
 for(const id of m.successConditions.tools){const tool=m.tools.find(t=>t.id===id);await action(m.id,'tool',{toolId:id,command:tool.command})}
 const result=await action(m.id,'solve',{answers:answers(m)});assert(result.state.completedAt,result.message);assert.equal(result.state.progress,100);assert.equal(result.state.session.lastResult.report.decisions.length,m.decisions.length);assert.equal(result.state.session.lastResult.report.objectives.length,m.objectives.length);return result.state;
}
try{
 worker=new Miniflare(options);const db=await worker.getD1Database('DB');
 for(const migration of ['0000_busy_norrin_radd.sql','0001_supreme_viper.sql','0002_puzzling_lord_tyger.sql','0003_icy_morg.sql','0004_glamorous_ser_duncan.sql','0005_tiresome_mach_iv.sql'])for(const sql of (await readFile('drizzle/'+migration,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 assert.equal((await call('/api/missions',undefined,null)).status,401);
 let locks=(await call('/api/missions')).data.locks;assert(locks.every(l=>l.reasons.length));
 const locked=await call('/api/missions',{id:'boss-001',action:'start'});assert.equal(locked.status,400);assert.match(locked.data.error,/مقفلة/);
 const firstLesson=await call('/api/submit',{kind:'quiz',id:'net-1',answers:answerKey['net-1'].map(q=>q.answer)});assert.equal(firstLesson.data.saved,true);
 for(const m of missions.slice(0,4))await normal(m);
 locks=(await call('/api/missions')).data.locks;assert.equal(locks.find(l=>l.id==='boss-001').reasons.length,0);assert.equal(locks.find(l=>l.id==='boss-002').reasons.length,0);assert(locks.find(l=>l.id==='boss-003').reasons.length);
 const premature=await action('boss-001','decide',{decisionId:'gateway-fix',response:'تعيين البوابة 192.168.40.1'});assert.equal(premature.state.session.mistakes.length,1);
 const early=await action('boss-001','solve',{answers:answers(bossMissions[0])});assert.equal(early.state.completedAt,null);
 const hint=await action('boss-001','hint');assert.equal(hint.state.session.hintsUsed,1);
 const before=(await call('/api/progress')).data.items.reduce((a,b)=>a+b.xp,0);
 for(const m of bossMissions){const won=await boss(m);assert.equal(won.session.lastResult.xpGranted,true);if(m.id==='boss-001'){assert.equal(won.session.lastResult.report.hintsUsed,1);assert(won.session.lastResult.report.mistakes.length>=2)}const duplicate=await action(m.id,'solve',{answers:answers(m)});assert.equal(duplicate.state.attempts,won.attempts);const count=(await call('/api/progress')).data.items.filter(i=>i.kind==='boss').length;assert(count>=1)}
 const expected=before+bossMissions.reduce((n,m)=>n+m.xpReward,0);let items=(await call('/api/progress')).data.items;assert.equal(items.reduce((s,i)=>s+i.xp,0),expected);assert.equal(items.filter(i=>i.kind==='boss').length,3);
 let skills=(await call('/api/skills')).data.skills;const snapshot=Object.fromEntries(skills.map(s=>[s.id,s.xp]));assert(skills.find(s=>s.id==='networking').contributions.some(c=>c.kind==='boss'));
 let records=(await call('/api/missions')).data.states;assert.equal(records.filter(s=>s.id.startsWith('boss-')&&s.completedAt).length,3);assert.equal((await call('/api/missions',undefined,'another-learner')).data.states.length,0);
 const first=records.find(s=>s.id==='boss-001'),best=first.score;
 await action('boss-001','replay');await action('boss-001','inspect',{evidenceId:'inventory'});
 await worker.dispose();worker=new Miniflare(options);
 const resumed=(await call('/api/missions')).data.states.find(s=>s.id==='boss-001');assert.equal(resumed.session.replaying,true);assert(resumed.session.inspected.includes('inventory'));assert.equal(resumed.score,best);
 await boss(bossMissions[0]);const replayed=(await call('/api/missions')).data.states.find(s=>s.id==='boss-001');assert.equal(replayed.session.lastResult.xpGranted,false);assert(replayed.score>=best);assert(replayed.stars>=first.stars);
 items=(await call('/api/progress')).data.items;assert.equal(items.reduce((s,i)=>s+i.xp,0),expected);skills=(await call('/api/skills')).data.skills;for(const s of skills)assert.equal(s.xp,snapshot[s.id],s.id);
 assert.equal((await call('/api/missions',undefined,null)).status,401);assert.equal((await call('/api/missions')).data.states.filter(s=>s.id.startsWith('boss-')).length,3);
 console.log('PASS: three Boss investigations, locks, objective dependencies, decisions, report, D1 resume/restart, replay best score, no repeated general or Skill XP, account isolation, normal mission and lesson regressions.');
}finally{if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true})}
