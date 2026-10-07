import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const bundled=await build({entryPoints:['lib/adaptive-learning.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {evaluateAdaptive,subskillCatalog}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const now=new Date('2026-09-25T10:00:00Z'),at='2026-09-24T10:00:00Z',old='2026-06-01T10:00:00Z';
const empty=()=>({lessons:[],attempts:[],missions:[],labs:[],soc:[],skillXp:[]});
const lesson=(id,when=at)=>({id,completedAt:when});
const attempt=(id,score=3,when=at,questions=[])=>({id,score,total:3,createdAt:when,questions});
const mission=(id,score=95,hints=0,mistakes=[],when=at)=>({id,score,attempts:1,hintsUsed:hints,completedAt:when,updatedAt:when,sessionJson:JSON.stringify({hintsUsed:hints,mistakes,lastResult:{score,hintsUsed:hints,mistakes}})});
const lab=(id,score=95,hints=0,scenario='audit',when=at)=>({id,score,bestScore:score,attempts:1,hintsUsed:hints,completedAt:when,updatedAt:when,sessionJson:JSON.stringify({hintsUsed:hints,mistakes:0,terminalScenarioId:scenario,lastResult:{passed:true,score}})});
const soc=(id,score=95,when=at)=>({id,score,bestScore:score,attempts:1,closedAt:when,updatedAt:when,sessionJson:JSON.stringify({prematureDecisions:0,lastResult:{score,classificationCorrect:true,responseCorrect:true,priorityCorrect:true}})});
const skill=(result,id)=>result.mastery.find(s=>s.id===id);
{
 const newbie=evaluateAdaptive(empty(),now);assert.equal(newbie.mastery.every(s=>s.mastery===null&&s.band==='New'),true);assert.equal(newbie.needsPractice.length,0);assert.equal(newbie.recommendations.length,1);assert.equal(newbie.recommendations[0].priority,'Start');
 const input=empty();input.skillXp=[{id:'networking',xp:620},{id:'linux',xp:200}];input.lessons=[lesson('net-2'),lesson('linux-8')];input.attempts=[attempt('net-2',3,at,[{index:0,correct:true,topic:'DNS'},{index:1,correct:true,topic:'IP'},{index:2,correct:true,topic:'DHCP'}])];input.missions=[mission('001'),mission('002'),mission('boss-001'),mission('005',42,1,['أمر غير دقيق'])];input.labs=[lab('v2-network'),lab('v2-terminal',35,2)];
 const result=evaluateAdaptive(input,now);assert.equal(skill(result,'networking').band,'Strong');assert(skill(result,'networking').mastery>skill(result,'linux').mastery);assert(result.recommendations.some(r=>r.target==='البحث في الملفات'&&r.href==='/learn/linux-6'));assert(!result.recommendations.some(r=>r.target==='تشخيص DNS'));assert.equal(skill(result,'networking').xp,620);
}
{
 const input=empty();input.lessons=[lesson('net-2')];input.attempts=[attempt('net-2',2,at,[{index:0,correct:false,topic:'DNS'},{index:1,correct:true,topic:'IP'},{index:2,correct:true,topic:'DHCP'}])];input.missions=[mission('002',65,2,['راجع DNS']),mission('boss-001',65,2,['قرار DNS غير دقيق'])];input.labs=[lab('v2-terminal',63,2,'dns')];const result=evaluateAdaptive(input,now),dns=result.recommendations.find(r=>r.id==='network.dns');assert(dns);assert.equal(dns.priority,'High');assert(dns.why.some(w=>w.includes('تلميح')));assert(dns.why.some(w=>w.includes('نتيجة')||w.includes('إجابة')));assert(result.needsPractice.some(s=>s.id==='network.dns'));
}
{
 const input=empty();input.skillXp=[{id:'networking',xp:2500}];input.lessons=[lesson('net-2')];input.missions=[mission('001',40,2,['DHCP']),mission('boss-001',42,2,['DNS'])];input.labs=[lab('v2-network',45,2)];const result=evaluateAdaptive(input,now);assert.equal(skill(result,'networking').xp,2500);assert(skill(result,'networking').mastery<65);assert(result.recommendations.some(r=>r.priority==='High'));
}
{
 const input=empty();input.lessons=['net-2','linux-1','linux-8','sec-1','soc-2'].map(id=>lesson(id));input.attempts=['net-2','linux-1','linux-8','sec-1','soc-2'].map(id=>attempt(id,3));input.missions=['001','002','003','004','005','boss-001','boss-002','boss-003'].map(id=>mission(id,98));input.labs=['v2-terminal','v2-network','v2-logs','v2-email','v2-http'].map(id=>lab(id,98));input.soc=['SOC-001','SOC-002','SOC-006'].map(id=>soc(id,98));const result=evaluateAdaptive(input,now);assert(result.strongSkills.length>=2);assert(!result.recommendations.some(r=>r.priority==='High'));assert.equal(result.needsPractice.length,0);
 const stale=structuredClone(input);for(const group of [stale.lessons,stale.attempts,stale.missions,stale.labs,stale.soc])for(const row of group){if('completedAt'in row)row.completedAt=old;if('closedAt'in row)row.closedAt=old;if('updatedAt'in row)row.updatedAt=old;if('createdAt'in row)row.createdAt=old;}const reviewed=evaluateAdaptive(stale,now);assert(reviewed.recommendations.some(r=>r.priority==='Review'&&r.why[0].includes('يومًا')));
}
// A single result cannot grant Strong, and re-reading is deterministic.
 {const input=empty();input.missions=[mission('002',100)];const one=evaluateAdaptive(input,now);assert.notEqual(skill(one,'networking').band,'Strong');assert(Math.abs(skill(one,'networking').mastery-60)<=13);assert(!one.recommendations.some(r=>r.id==='network.dns'));assert.deepEqual(evaluateAdaptive(input,now),one);input.missions=[mission('002',42,2,['تشخيص خاطئ'])];const changed=evaluateAdaptive(input,now);assert(changed.recommendations.some(r=>r.id==='network.dns'));assert(skill(changed,'networking').mastery<skill(one,'networking').mastery)}
assert.equal(subskillCatalog.every(s=>s.lesson&&s.lab&&s.href.startsWith('/')),true);

const modules=['index.js',...(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const directory=await mkdtemp(join(tmpdir(),'cyberlab-adaptive-'));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};let worker;
async function call(path,user='learner'){const headers=user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}:{};const r=await worker.dispatchFetch('http://local.test'+path,{headers});return {status:r.status,data:await r.json()}}
try{const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));worker=new Miniflare(options);const db=await worker.getD1Database('DB');for(const migration of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+migration,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 assert.equal((await call('/api/adaptive',null)).status,401);let result=await call('/api/adaptive');assert.equal(result.status,200);assert.equal(result.data.observations,0);assert.equal(result.data.recommendations[0].priority,'Start');
 await db.prepare('INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES(?,?,?,?,?,?)').bind('learner','net-2','quiz',2,100,at).run();
 await db.prepare('INSERT INTO activity(user_id,lesson_id,started_at,last_at,seconds,completed_at) VALUES(?,?,?,?,?,?)').bind('learner','net-2',at,at,0,at).run();
 await db.prepare('INSERT INTO attempts(user_id,lesson_id,score,total,answers,created_at) VALUES(?,?,?,?,?,?)').bind('learner','net-2',2,3,JSON.stringify([1,1,2]),at).run();
 await db.prepare('INSERT INTO mission_progress(user_id,mission_id,started_at,updated_at,completed_at,score,stars,hints_used,attempts,session_json) VALUES(?,?,?,?,?,?,?,?,?,?)').bind('learner','002',at,at,at,65,1,2,1,JSON.stringify({hintsUsed:2,mistakes:['راجع DNS'],lastResult:{score:65,hintsUsed:2,mistakes:['راجع DNS']}})).run();
 await db.prepare('INSERT INTO skill_progress(user_id,skill_id,xp,level,progress,updated_at) VALUES(?,?,?,?,?,?)').bind('learner','networking',620,4,10,at).run();
 const before=await db.prepare("SELECT COUNT(*) AS n FROM skill_awards WHERE user_id='learner'").first();result=await call('/api/adaptive');assert.equal(result.status,200);assert.equal(result.data.mastery.find(s=>s.id==='networking').xp,620);assert(result.data.recommendations.some(r=>r.id==='network.dns'&&r.why.some(w=>w.includes('تلميح'))));assert.equal((await call('/api/adaptive','other')).data.observations,0);assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM skill_awards WHERE user_id='learner'").first()).n,before.n);
 await worker.dispose();worker=new Miniflare(options);assert.equal((await call('/api/adaptive')).data.mastery.find(s=>s.id==='networking').xp,620);assert.equal((await call('/api/progress')).data.items.reduce((n,i)=>n+i.xp,0),100);assert.equal((await call('/api/learning')).status,200);assert.equal((await call('/api/missions')).status,200);assert.equal((await call('/api/soc')).status,200);assert.equal((await call('/api/interactive-labs')).status,200);
 console.log('PASS: five adaptive profiles, subskills, explainable hints/score reasons, high XP versus weak mastery, prior for small samples, quick review, live D1 projection, account isolation, no writes, Worker restart and existing routes.');
}finally{if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true})}
