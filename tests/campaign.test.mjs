import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const module=async file=>{const output=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'))};
const {allMissions}=await module('lib/missions.ts'),{firstSignal}=await module('lib/campaigns.ts'),{answerKey}=await module('lib/answer-key.ts');
assert.equal(firstSignal.chapters.length,6);assert.deepEqual(firstSignal.chapters.flatMap(c=>c.missionIds),['001','002','boss-001','003','004','boss-002','005','boss-003']);
const files=(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js'));
const modules=['index.js',...files.filter(f=>f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const directory=await mkdtemp(join(tmpdir(),'cyberlab-campaign-'));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};
let worker;const user='campaign-learner';
async function call(path,body,identity=user){const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(identity){headers['oai-authenticated-user-id']=identity;headers['oai-authenticated-user-email']=identity+'@example.test'}const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
const campaign=async(identity=user)=>{const response=await call('/api/campaigns/first-signal',undefined,identity);assert.equal(response.status,200,JSON.stringify(response.data));return response.data};
const action=async(id,kind,more={})=>{const response=await call('/api/missions',{id,action:kind,...more});assert.equal(response.status,200,JSON.stringify(response.data));return response.data};
const answers=m=>Object.fromEntries(Object.entries(m.successConditions.answers).map(([key,rule])=>[key,rule.acceptedAnswers[0]]));
async function solve(m){await action(m.id,'start');if(m.kind==='boss'){
 const done=new Set();let pending=m.objectives.filter(o=>o.kind!=='solve');for(let pass=0;pending.length&&pass<20;pass++){
  const next=[];for(const o of pending){if(o.dependsOn?.some(id=>!done.has(id))){next.push(o);continue}
   if(o.kind==='evidence')await action(m.id,'inspect',{evidenceId:o.target});
   if(o.kind==='tool'){if(o.target==='renew-a')await action(m.id,'tool',{toolId:'start-dhcp-office',command:'dhcp start'});const tool=m.tools.find(t=>t.id===o.target);await action(m.id,'tool',{toolId:o.target,command:tool.command})}
   if(o.kind==='decision'){const d=m.decisions.find(d=>d.id===o.target);const r=await action(m.id,'decide',{decisionId:d.id,response:d.rule.acceptedAnswers[0]});assert(r.state.session.decisions.includes(d.id),r.message)}done.add(o.id)
  }pending=next;
 }assert.equal(pending.length,0);
 }for(const id of m.successConditions.evidence)await action(m.id,'inspect',{evidenceId:id});for(const id of m.successConditions.tools){const tool=m.tools.find(t=>t.id===id);await action(m.id,'tool',{toolId:id,command:tool.command})}
 const r=await action(m.id,'solve',{answers:answers(m)});assert(r.state.completedAt,r.message);return r.state;
}
try{
 worker=new Miniflare(options);const db=await worker.getD1Database('DB');
 for(const migration of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+migration,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 assert.equal((await call('/api/campaigns/first-signal',undefined,null)).status,401);
 assert.equal((await call('/api/campaigns/unknown')).status,404);
 let state=await campaign();assert.equal(state.progress,0);assert.equal(state.currentChapterId,'first-day');assert.equal(state.timeline.length,1);assert.equal(state.evidence.length,0);assert(state.chapters.slice(1).every(c=>!c.unlocked));
 assert.equal((await call('/api/campaigns/first-signal',{flagId:'brief:midnight-breach'})).status,400);
 await call('/api/campaigns/first-signal',{flagId:'brief:first-day'});await call('/api/campaigns/first-signal',{flagId:'brief:first-day'});
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM campaign_flags WHERE user_id=?').bind(user).first()).n,1);
 const lesson=await call('/api/submit',{kind:'quiz',id:'net-1',answers:answerKey['net-1'].map(q=>q.answer)});assert.equal(lesson.data.saved,true);
 for(const id of firstSignal.chapters.flatMap(c=>c.missionIds)){
  const m=allMissions.find(x=>x.id===id);await solve(m);state=await campaign();assert(state.chapters.find(c=>c.missionIds.includes(id)).objectives.find(o=>o.id===id).completed);
  if(id==='001'){assert.equal(state.currentChapterId,'first-day');assert.equal(state.progress,13)}
  if(id==='boss-001'){assert.equal(state.currentChapterId,'the-message');assert(state.chapters[1].unlocked);assert(!state.timeline.some(e=>e.id==='email'))}
  if(id==='003'){assert(state.evidence.some(e=>e.id==='email-domains'));assert(state.timeline.some(e=>e.id==='email'));assert.equal(state.currentChapterId,'something-wrong')}
  if(id==='004'){assert.equal(state.currentChapterId,'phishing-incident');assert(!state.timeline.some(e=>e.id==='interaction'))}
  if(id==='boss-002'){assert(state.timeline.some(e=>e.id==='interaction'));assert.equal(state.currentChapterId,'after-hours')}
 }
 assert.equal(state.progress,100);assert(state.completed);assert.equal(state.completedChapters,6);assert.equal(state.evidence.length,6);assert.equal(state.summary.casesSolved,8);assert.equal(state.summary.bossMissionsCompleted,3);
 const xp=(await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0);const skills=(await call('/api/skills')).data.skills.map(s=>[s.id,s.xp]);
 await call('/api/campaigns/first-signal',{flagId:'evidence:email-domains'});await call('/api/campaigns/first-signal',{flagId:'debrief:midnight-breach'});
 assert.equal((await campaign()).evidence.find(e=>e.id==='email-domains').read,true);
 assert.equal((await call('/api/campaigns/first-signal',undefined,null)).status,401); // sign out
 await worker.dispose();worker=new Miniflare(options); // browser/site reopen against same D1
 state=await campaign();assert(state.completed);assert.equal(state.progress,100);assert(state.chapters.at(-1).debriefed);assert(state.evidence.find(e=>e.id==='email-domains').read);
 const refreshedXP=(await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0);assert.equal(refreshedXP,xp);
 // A legacy account with previously completed missions and no campaign flags is complete immediately.
 const persisted=await worker.getD1Database('DB');
 for(const table of ['progress','mission_progress','skill_awards','skill_progress','activity']){
  const cols=(await persisted.prepare('PRAGMA table_info('+table+')').all()).results.map(c=>c.name);
  await persisted.prepare(`INSERT INTO ${table} (${cols.join(',')}) SELECT ${cols.map(c=>c==='user_id'?'?':c).join(',')} FROM ${table} WHERE user_id=?`).bind('legacy-user',user).run();
 }
 const legacy=await campaign('legacy-user');assert.equal(legacy.progress,100);assert.equal(legacy.summary.casesSolved,8);assert.equal((await persisted.prepare('SELECT COUNT(*) AS n FROM campaign_flags WHERE user_id=?').bind('legacy-user').first()).n,0);
 assert.equal((await campaign('new-user')).progress,0);
 await action('003','replay');await solve(allMissions.find(m=>m.id==='003'));state=await campaign();assert.equal(state.progress,100);assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),xp);
 assert.deepEqual((await call('/api/skills')).data.skills.map(s=>[s.id,s.xp]),skills);
 assert.equal((await call('/api/learning')).status,200);
 console.log('PASS: six chapters/eight existing cases, progressive timeline/evidence, D1 flags and user isolation, retroactive legacy account, refresh/reopen/login, replay XP/Skill XP idempotency, learning API.');
}finally{if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true})}
