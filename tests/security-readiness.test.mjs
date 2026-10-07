// Security boundaries against the actual built Worker and disposable local D1.
// Trusted dispatcher headers are simulated here; this is NOT a hosted OAuth/spoof-resistance test.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry,plugins=[]){const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',plugins});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))}
 const validation=await load('lib/request-validation.ts');
const auth=await load('app/chatgpt-auth.ts',[{name:'platform-stub',setup(b){b.onResolve({filter:/^next\/(headers|navigation)$/},a=>({path:a.path,namespace:'auth-stub'}));b.onLoad({filter:/.*/,namespace:'auth-stub'},a=>({contents:a.path.endsWith('headers')?'export const headers=async()=>globalThis.securityHeaders;':'export const redirect=p=>{throw Error(p)};'}))}}]);
for(const returnTo of ['https://outside.test','//outside.test','/\\outside.test','/callback','/signin-with-chatgpt','/signout-with-chatgpt'])assert.equal(new URL(auth.chatGPTSignInPath(returnTo),'http://local.test').searchParams.get('return_to'),'/');
assert.equal(new URL(auth.chatGPTSignInPath('/learn/security-5?return_to=%2Fexperience%2Fnexacorp-email'),'http://local.test').searchParams.get('return_to'),'/learn/security-5?return_to=%2Fexperience%2Fnexacorp-email');
for(const headers of [{},{'oai-authenticated-user-id':'a'},{'oai-authenticated-user-email':'a@example.test'}]){globalThis.securityHeaders=new Headers(headers);assert.equal(await auth.getChatGPTUser(),null)}
globalThis.securityHeaders=new Headers({'oai-authenticated-user-id':'a','oai-authenticated-user-email':'a@example.test'});assert.equal((await auth.getChatGPTUser()).userId,'a');
const originalError=console.error,logs=[];try{console.error=(...args)=>logs.push(args);validation.reportServerError('Local test',Error('SQL password=private-token note=private-note'));}finally{console.error=originalError}
assert(!JSON.stringify(logs).includes('private-'));assert(!JSON.stringify(logs).includes('password'));assert.equal(logs[0][1].category,'operation');
for(const [kind,input] of [['learning',null],['learning',[]],['learning',{action:'settings',dailyGoal:15,theme:['dark']}],['submit',{kind:'quiz',id:'py-1',answers:[1,0,2],xp:999999}],['board',{action:'review',evidenceId:'../other'}],['lab',{action:'filter',filters:{ip:[],unknown:'x'}}]])assert.equal(validation.validPayload(kind,input),false);
const directory=await mkdtemp(join(tmpdir(),'cyberlab-security-'));
const modules=['index.js',...(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};let worker;
async function call(path,body,user='a',extra={}){const headers={...extra};if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test'}if(body!==undefined&&!headers['Content-Type'])headers['Content-Type']='application/json';const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),headers:r.headers}}
async function ok(path,body,user='a'){const r=await call(path,body,user);assert.equal(r.status,200,JSON.stringify(r.data));return r.data}
async function snapshot(user){const db=await worker.getD1Database('DB'),tables=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all()).results,out={};for(const {name} of tables){const fields=(await db.prepare('PRAGMA table_info('+name+')').all()).results;if(fields.some(f=>f.name==='user_id'))out[name]=(await db.prepare('SELECT * FROM '+name+' WHERE user_id=? ORDER BY rowid').bind(user).all()).results}return out}
try{
 worker=new Miniflare(options);let db=await worker.getD1Database('DB');for(const f of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 for(const path of ['/','/search?q=NAT','/api/progress']){const r=await worker.dispatchFetch('http://local.test'+path);assert.equal(r.headers.get('X-Content-Type-Options'),'nosniff',path);assert.equal(r.headers.get('Referrer-Policy'),'strict-origin-when-cross-origin',path);assert.equal(r.headers.get('Permissions-Policy'),'camera=(), microphone=(), geolocation=()',path)}
 const protectedReads=['/api/progress','/api/learning','/api/skills','/api/career','/api/adaptive','/api/missions','/api/incidents','/api/campaigns/first-signal','/api/soc','/api/soc/alerts/SOC-002','/api/soc/cases/anything','/api/investigations/soc-SOC-002','/api/interactive-labs/v2-logs'];
 for(const path of protectedReads)assert.equal((await call(path,undefined,null)).status,401,path);
 const protectedWrites=['/api/learning','/api/missions','/api/incidents','/api/campaigns/first-signal','/api/soc/alerts/SOC-002','/api/soc/cases/anything','/api/investigations/soc-SOC-002','/api/interactive-labs/v2-logs'];
 for(const path of protectedWrites)assert.equal((await call(path,{},null)).status,401,path);
 // Guest grading and public catalogs intentionally exist, and cannot persist rewards.
 const guest=await ok('/api/submit',{kind:'quiz',id:'py-1',answers:[1,0,2]},null);assert.equal(guest.saved,false);assert.equal(guest.guest,true);assert.equal((await call('/api/interactive-labs',undefined,null)).status,200);
 for(const path of protectedWrites.filter(p=>!p.endsWith('anything'))){assert.equal((await call(path,null)).status,400,path);assert.equal((await call(path,[])).status,400,path)}
 for(const payload of [{action:'settings',dailyGoal:'15',theme:'dark'},{action:'settings',dailyGoal:15,theme:['dark']},{action:'settings',dailyGoal:15,theme:'dark',userId:'b'},{action:'read',id:'py-1',seconds:31},{action:'note',id:'py-1',content:'x'.repeat(5001)},{action:'complete',id:'missing-lesson'}])assert.equal((await call('/api/learning',payload)).status,400);
 for(const payload of [{kind:'quiz',id:'py-1',answers:[1,0,2],xp:999999},{kind:'quiz',id:'py-1',answers:[1,0,2],userId:'b'},{kind:'quiz',id:'py-1',answers:[-1]},{kind:'quiz',id:'py-1',answers:['x'.repeat(101)]},null])assert.equal((await call('/api/submit',payload)).status,400);
 const settings={action:'settings',dailyGoal:15,theme:'dark'};
 assert.equal((await call('/api/learning',settings,'a',{Origin:'https://outside.test'})).status,403);
 assert.equal((await call('/api/learning',settings,'a',{'Sec-Fetch-Site':'cross-site'})).status,403);
 assert.equal((await call('/api/learning',settings,'a',{'Content-Type':'text/plain'})).status,415);
 assert.equal((await call('/api/learning',settings,'a',{'Content-Type':'text/application/json'})).status,415);
 assert.equal((await call('/api/learning',settings,'a',{Origin:'http://local.test','Content-Type':'application/json; charset=utf-8'})).status,200);
 assert.equal((await call('/api/learning',{action:'note',id:'py-1',content:'😀'.repeat(4000)})).status,413,'body bounded by actual UTF-8 bytes');
 const declared=await validation.readJsonInput(new Request('http://local.test/api/learning',{method:'POST',headers:{'Content-Type':'application/json','Content-Length':'15000'},body:JSON.stringify(settings)}),12000,'learning');assert.equal(declared.error.status,413);
 let cancelled=false;const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(13000));},cancel(){cancelled=true}});const bounded=await validation.readJsonInput(new Request('http://local.test/api/learning',{method:'POST',headers:{'Content-Type':'application/json'},body:stream,duplex:'half'}),12000,'learning');assert.equal(bounded.error.status,413);assert(cancelled,'oversized stream is cancelled');
 const malformed=await worker.dispatchFetch('http://local.test/api/learning',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'a','oai-authenticated-user-email':'a@example.test'},body:'{"action":'});assert.equal(malformed.status,400);assert(!/TypeError|SQLITE|stack/i.test(await malformed.text()));
 // Parameterized note writes preserve arbitrary text without executing SQL/HTML.
 const note="'); DROP TABLE progress; -- <img src=x onerror=alert(1)>";
 await ok('/api/learning',{action:'note',id:'py-1',content:note},'b');await ok('/api/learning',{action:'bookmark',id:'py-1',saved:true},'b');const beforeB=await snapshot('b');
 await ok('/api/learning',{action:'note',id:'py-1',content:'own note'},'a');assert.equal((await db.prepare('SELECT content FROM notes WHERE user_id=? AND lesson_id=?').bind('b','py-1').first()).content,note);
 for(const path of ['/api/learning?userId=b','/api/progress?userId=b','/api/missions?userId=b']){const r=await call(path);assert.equal(r.status,200);assert(!JSON.stringify(r.data).includes(note))}
 // The instance ID by itself cannot read or mutate another account's investigation.
 const instance=await ok('/api/incidents',{templateId:'phishing',difficulty:'beginner',mode:'new'},'b');const boardPath='/api/investigations/dynamic-'+instance.instanceId;
 const board=await ok(boardPath,undefined,'b');assert.equal(board.review,null);assert(!Object.hasOwn(board.board,'expected'));assert(!Object.hasOwn(board.board,'allowedLinks'));
 assert.equal((await call(boardPath,undefined,'a')).status,404);assert.equal((await call(boardPath,{action:'reopen'},'a')).status,404);
 const eid=board.board.evidence[0].id;await ok(boardPath,{action:'review',evidenceId:eid},'b');await Promise.all([1,2,3].map(()=>ok(boardPath,{action:'collect',evidenceId:eid},'b')));const collected=await ok(boardPath,undefined,'b');assert.equal(collected.evidence.filter(e=>e.evidenceId===eid).length,1);
 const afterB=await snapshot('b');assert.equal((await call(boardPath,{action:'review',evidenceId:eid,userId:'b'},'a')).status,400);assert.deepEqual(await snapshot('b'),afterB);
 const wrongLink=await call(boardPath,{action:'link',fromId:'unknown',toId:'unknown',relation:'USES',reason:'اختبار علاقة غير موجودة'},'b');assert.equal(wrongLink.status,400);assert.equal((await call(boardPath,{action:'annotate',evidenceId:eid,note:'x',classification:'approved'},'b')).status,400);
 assert.deepEqual((await snapshot('b')).notes,beforeB.notes);
 // Client scores/XP are ignored nowhere: extra reward fields are rejected, actual rewards derive on server.
 const quiz={kind:'quiz',id:'it-1',answers:[0,1,0]};
 const submissions=await Promise.all(Array.from({length:5},()=>call('/api/submit',quiz,'a')));assert(submissions.every(r=>r.status===200&&r.data.passed));
 const rewarded=await snapshot('a');assert.equal(rewarded.progress.length,1);assert.equal(rewarded.progress[0].xp,100);const skills=rewarded.skill_awards;assert(skills.length>0);
 await ok('/api/submit',quiz,'a');const replay=await snapshot('a');assert.deepEqual(replay.progress,rewarded.progress);assert.deepEqual(replay.skill_awards,skills);assert.deepEqual(replay.skill_progress,rewarded.skill_progress);assert.deepEqual(await snapshot('b'),afterB);
 // Abort the skill insertion mid-batch ONLY in disposable D1. Progress/activity must roll back too.
 await db.prepare("CREATE TRIGGER local_security_failure BEFORE INSERT ON skill_awards WHEN NEW.user_id='atomic-fail' BEGIN SELECT RAISE(ABORT,'local injected failure'); END").run();
 assert.equal((await call('/api/submit',quiz,'atomic-fail')).status,503);
 const failed=await snapshot('atomic-fail');for(const table of ['progress','activity','skill_awards','skill_progress','attempts'])assert.equal(failed[table].length,0,table+' rolls back');
 await db.prepare('DROP TRIGGER local_security_failure').run();await ok('/api/submit',quiz,'atomic-fail');assert.equal((await snapshot('atomic-fail')).progress.length,1);
 // A driver error containing Arabic must not be mistaken for educational feedback.
 await db.prepare("CREATE TRIGGER local_note_failure BEFORE INSERT ON notes WHEN NEW.user_id='error-leak' BEGIN SELECT RAISE(ABORT,'غير صالح local-internal-marker'); END").run();
 const driverFailure=await call('/api/learning',{action:'note',id:'py-1',content:'safe note'},'error-leak');assert.equal(driverFailure.status,503);assert(!JSON.stringify(driverFailure.data).includes('local-internal-marker'));assert(!JSON.stringify(driverFailure.data).includes('SQLITE'));
 await db.prepare('DROP TRIGGER local_note_failure').run();
 // Actual rendered Search escaping and duplicate-parameter handling.
 for(const suffix of ['?q=a&q=b','?q='+encodeURIComponent('x'.repeat(101)),'?q='+encodeURIComponent('<img src=x onerror=alert(1)>')]){const r=await worker.dispatchFetch('http://local.test/search'+suffix);assert.equal(r.status,200);const html=await r.text();assert(!html.includes('<img src=x onerror=alert(1)>'));if(!suffix.includes('img'))assert(html.includes('عبارة البحث غير صالحة'))}
 // Public protected activity URLs keep their sign-in/locked states instead of exposing another user's state.
 for(const path of ['/investigations/soc-SOC-002','/soc/alerts/SOC-002','/labs/v2/v2-access-control']){const r=await worker.dispatchFetch('http://local.test'+path);assert.notEqual(r.status,500);assert.notEqual(r.status,404,path)}
 const saved=await snapshot('a');await worker.dispose();worker=new Miniflare(options);assert.deepEqual(await snapshot('a'),saved);assert.equal((await call('/api/progress',undefined,null)).status,401,'session absent/expired');assert.deepEqual((await snapshot('b')).progress,afterB.progress);
 console.log('PASS: local built Worker/D1 auth guards, trusted identity requirements, safe redirects, own-account reads/writes, dynamic IDOR negative tests, immutable answer concealment, duplicate evidence, invalid relationships, runtime validation, bounded UTF-8 input, CSRF origin/fetch metadata, JSON enforcement, SQL text isolation, Search HTML escaping, once-only/concurrent quiz XP+Skill XP, atomic rollback/retry, persisted accounts and missing-session guards. Hosted OAuth/token expiry/header sanitization/WAF/browser/Safari NOT tested.');
}finally{if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true});delete globalThis.securityHeaders}
