// Integration test: real built Worker + isolated local D1, no production writes.
import {createRequire} from 'node:module';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function source(entry){const r=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'))}
const {lessons,tracks,labs}=await source('lib/curriculum.ts');
const {paths}=await source('lib/paths.ts');
const moduleFiles=(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js'));
const modules=['index.js',...moduleFiles.filter(f=>f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const mf=new Miniflare({modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],cf:false});
let count=0;
function check(value){assert(value);count++;}
async function call(path,data,user,origin){const headers={};if(data!==undefined)headers['Content-Type']='application/json';if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test';}if(origin)headers.Origin=origin;const r=await mf.dispatchFetch('http://local.test'+path,{method:data===undefined?'GET':'POST',headers,body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,data:await r.json()};}
try{
 const db=await mf.getD1Database('DB');await db.prepare(await readFile('drizzle/0000_busy_norrin_radd.sql','utf8')).run();for(const migration of ['0001_supreme_viper.sql','0002_puzzling_lord_tyger.sql','0003_icy_morg.sql','0004_glamorous_ser_duncan.sql','0005_tiresome_mach_iv.sql'])for(const sql of (await readFile('drizzle/'+migration,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 check((await call('/api/progress')).status===401);
 check((await call('/api/progress',undefined,'learner-a')).data.items.length===0);
 const payload={kind:'quiz',id:'py-1',answers:[1,0,2]};
 const guest=await call('/api/submit',payload);check(guest.status===200&&guest.data.guest&&!guest.data.saved);
 check((await call('/api/submit',payload,'learner-a','https://foreign.example')).status===403);
 check((await call('/api/submit',{...payload,answers:[-1,0,0]},'learner-a')).status===400);
 check((await call('/api/submit',null,'learner-a')).status===400);
 check(!(await call('/api/submit',{...payload,answers:[0,1,0]},'learner-a')).data.passed);
 check((await call('/api/progress',undefined,'learner-a')).data.items.length===0);
 const parallel=await Promise.all(Array.from({length:4},()=>call('/api/submit',payload,'learner-a')));check(parallel.every(r=>r.status===200&&r.data.saved));
 let items=(await call('/api/progress',undefined,'learner-a')).data.items;check(items.length===1&&items[0].xp===100&&items[0].score===3);
 await call('/api/submit',{...payload,answers:[1,0,0]},'learner-a');check((await call('/api/progress',undefined,'learner-a')).data.items[0].score===3);
 check((await call('/api/progress',undefined,'learner-b')).data.items.length===0);
 for(const [id,input] of [['caesar',{answer:'hello'}],['firewall',{ports:[443]}],['phishing',{action:'verify',clue:'code'}]]){const r=await call('/api/submit',{kind:'lab',id,input},'learner-a');check(r.status===200&&r.data.passed&&r.data.saved);}
 items=(await call('/api/progress',undefined,'learner-a')).data.items;check(items.length===4&&items.reduce((s,i)=>s+i.xp,0)===325);
 const newLesson=await call('/api/submit',{kind:'quiz',id:'py-20',answers:[1,0,2]},'learner-a');check(newLesson.status===200&&newLesson.data.score===3&&newLesson.data.saved);
 check((await call('/api/progress',undefined,'learner-a')).data.items.reduce((s,i)=>s+i.xp,0)===425);
 for(const path of ['/roadmap','/profile','/settings','/achievements','/history','/notifications','/skills','/missions','/learn/it-1','/labs/terminal','/learn/py-19','/learn/py-20','/','/learn','/learn/py-1','/labs','/labs/caesar','/labs/firewall','/labs/phishing','/progress','/account','/guide']){const r=await mf.dispatchFetch('http://local.test'+path);check(r.status===200);}
 check((await mf.dispatchFetch('http://local.test/learn/nonexistent')).status===404);
 for(const [kind,rows] of [['learn',lessons],['tracks',tracks],['labs',labs],['paths',paths]])for(const row of rows){const r=await mf.dispatchFetch('http://local.test/'+kind+'/'+row.id);check(r.status===200);}
 for(const lab of labs){const r=await mf.dispatchFetch('http://local.test/labs/'+lab.id+'?start=1');check(r.status===200);}
 for(const kind of ['tracks','labs','paths'])check((await mf.dispatchFetch('http://local.test/'+kind+'/nonexistent')).status===404);
 const ip=await call('/api/submit',{kind:'lab',id:'ip-address',input:{answer:1}},'learner-a');check(ip.status===200&&ip.data.passed&&ip.data.saved);
 const before=(await call('/api/progress',undefined,'learner-a')).data.items.filter(i=>i.id==='ip-address');
 await call('/api/submit',{kind:'lab',id:'ip-address',input:{answer:1}},'learner-a');
 check(before.length===1&&(await call('/api/progress',undefined,'learner-a')).data.items.filter(i=>i.id==='ip-address').length===1);
 const newQuiz=await call('/api/submit',{kind:'quiz',id:'it-1',answers:[0,1,0]},'learner-a');check(newQuiz.status===200&&newQuiz.data.score===3);
 check((await call('/api/learning',undefined,'learner-a')).data.activity.some(a=>a.id==='it-1'));
 check((await call('/api/learning',{action:'note',id:'it-1',content:'ملاحظة مهمة'},'learner-a')).status===200);
 check((await call('/api/learning',{action:'bookmark',id:'it-1',saved:true},'learner-a')).status===200);
 check((await call('/api/learning',{action:'read',id:'it-1',seconds:30},'learner-a')).status===200);
 check((await call('/api/learning',{action:'settings',dailyGoal:25,theme:'light'},'learner-a')).status===200);
 const state=(await call('/api/learning',undefined,'learner-a')).data;check(state.notes[0].content==='ملاحظة مهمة'&&state.bookmarks[0].id==='it-1'&&state.preferences.dailyGoal===25&&state.dailyTime[0].seconds===30);
 check((await call('/api/learning',undefined,'learner-b')).data.notes.length===0);
 check((await call('/api/learning',{action:'read',id:'it-1',seconds:999},'learner-a')).status===400);
 console.log(`PASS: ${count} built-Worker assertions; real D1, concurrent submissions, user isolation, guest behavior, origin validation, all routes.`);
}finally{await mf.dispose();}
