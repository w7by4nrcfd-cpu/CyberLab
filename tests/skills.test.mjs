import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const built=await build({entryPoints:['lib/missions.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {missions}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const modules=['index.js',...(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const directory=await mkdtemp(join(tmpdir(),'cyberlab-skills-'));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};
let worker;
async function call(path,body,user='legacy'){
 const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test'}
 const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};
}
function award(state,id){return state.skills.find(s=>s.id===id)}
try{
 worker=new Miniflare(options);const db=await worker.getD1Database('DB');
 for(const filename of ['0000_busy_norrin_radd.sql','0001_supreme_viper.sql','0002_puzzling_lord_tyger.sql','0003_icy_morg.sql'])for(const sql of (await readFile('drizzle/'+filename,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 // Fixture is a real existing account: a quiz, reading completion, and mission result before skills existed.
 const before='2026-09-20T10:00:00.000Z';
 await db.prepare('INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,?,?,?,?,?)').bind('legacy','net-1','quiz',3,100,before).run();
 await db.prepare('INSERT INTO activity(user_id,lesson_id,started_at,last_at,seconds,completed_at) VALUES(?,?,?,?,?,?)').bind('legacy','linux-1',before,before,20,before).run();
 await db.prepare('INSERT INTO mission_progress(user_id,mission_id,started_at,updated_at,completed_at,score,stars,hints_used,attempts,session_json) VALUES(?,?,?,?,?,?,?,?,?,?)').bind('legacy','003',before,before,before,85,2,1,1,'{}').run();
 await db.prepare('INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,?,?,?,?,?)').bind('legacy','mission:003','mission',85,140,before).run();
 for(const filename of ['0004_glamorous_ser_duncan.sql','0005_tiresome_mach_iv.sql'])for(const sql of (await readFile('drizzle/'+filename,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 assert.equal((await call('/api/skills',undefined,null)).status,401);
 let state=(await call('/api/skills')).data;assert.equal(state.skills.length,8);
 assert.equal(award(state,'networking').xp,25);assert.equal(award(state,'linux').xp,25);
 assert.equal(award(state,'phishing').xp,80);assert.equal(award(state,'cybersecurity').xp,40);
 assert.equal(award(state,'troubleshooting').xp,10);
 assert.equal(award(state,'phishing').contributions[0].id,'003');
 assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),240);
 assert.equal((await call('/api/missions')).data.states.find(s=>s.id==='003').stars,2);
 await call('/api/skills');assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM skill_awards WHERE user_id=?').bind('legacy').first()).count,5);
 assert.equal((await call('/api/skills',undefined,'new-learner')).data.skills.every(s=>s.xp===0),true);
 const read=await call('/api/learning',{action:'complete',id:'windows-1'});assert.equal(read.status,200,JSON.stringify(read.data));
 await call('/api/learning',{action:'complete',id:'windows-1'});
 state=(await call('/api/skills')).data;assert.equal(award(state,'windows').xp,25);assert.equal(award(state,'windows').contributions.length,1);
 const m=missions[0],answers={cause:'خدمة DHCP متوقفة عن العمل',action:'إعادة تشغيل خدمة DHCP وتجديد IP'};
 async function mission(action,more={}){const r=await call('/api/missions',{id:'001',action,...more});assert.equal(r.status,200,JSON.stringify(r.data));return r.data.state}
 await mission('start');for(const evidenceId of m.successConditions.evidence)await mission('inspect',{evidenceId});for(const toolId of m.successConditions.tools){const tool=m.tools.find(t=>t.id===toolId);await mission('tool',{toolId,command:tool.command})}
 const first=await mission('solve',{answers});assert(first.completedAt);assert.equal(first.stars,3);
 state=(await call('/api/skills')).data;assert.equal(award(state,'networking').xp,105);assert.equal(award(state,'troubleshooting').xp,50);
 const xp=(await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0);assert.equal(xp,360);
 await mission('replay');for(const evidenceId of m.successConditions.evidence)await mission('inspect',{evidenceId});for(const toolId of m.successConditions.tools){const tool=m.tools.find(t=>t.id===toolId);await mission('tool',{toolId,command:tool.command})}
 const second=await mission('solve',{answers});assert.equal(second.session.lastResult.xpGranted,false);
 state=(await call('/api/skills')).data;assert.equal(award(state,'networking').xp,105);assert.equal(award(state,'troubleshooting').xp,50);
 assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),xp);
 const phishing=missions.find(m=>m.id==='003');
 await call('/api/missions',{id:'003',action:'replay'});
 for(const evidenceId of phishing.successConditions.evidence)await call('/api/missions',{id:'003',action:'inspect',evidenceId});
 for(const toolId of phishing.successConditions.tools)await call('/api/missions',{id:'003',action:'tool',toolId});
 const improved=await call('/api/missions',{id:'003',action:'solve',answers:{clues:'فشل SPF مع رابط تصيد',action:'حجر الرسالة والتبليغ عنها'}});
 assert.equal(improved.data.state.stars,3);assert.equal(improved.data.state.session.lastResult.xpGranted,false);
 state=(await call('/api/skills')).data;assert.equal(award(state,'phishing').xp,80);assert.equal(award(state,'cybersecurity').xp,40);
 assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),xp);
 const rows=await db.prepare('SELECT skill_id AS id,xp,level,progress FROM skill_progress WHERE user_id=?').bind('legacy').all();assert(rows.results.some(x=>x.id==='networking'&&x.xp===105&&x.level===1&&x.progress===52));
 await worker.dispose();worker=new Miniflare(options);
 state=(await call('/api/skills')).data;assert.equal(award(state,'networking').xp,105);assert.equal(award(state,'windows').xp,25);
 assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),xp);
 console.log('PASS: preexisting account backfill; stored totals/levels; lesson idempotency; mission replay; user isolation; XP and stars regression; D1 restart.');
}finally{if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true})}
