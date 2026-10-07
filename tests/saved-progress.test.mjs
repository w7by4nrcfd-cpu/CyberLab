import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const compile=async(entry,plugins=[])=>{const output=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,plugins});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'))};
const {clientJson}=await compile('lib/client-json.ts');
const realFetch=globalThis.fetch;
try{
 let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response('<html>gateway error</html>',{status:503})};
 await assert.rejects(clientJson('/api/progress'),/تعذر الاتصال/);assert.equal(calls,1);
 globalThis.fetch=async()=>new Response('{}',{status:401});await assert.rejects(clientJson('/api/progress'),/انتهت الجلسة/);
 globalThis.fetch=async()=>new Response('{}',{status:429});await assert.rejects(clientJson('/api/progress'),/انتظر/);
 globalThis.fetch=async(_url,init)=>{calls++;return new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))};
 calls=0;await assert.rejects(clientJson('/api/learning',{method:'POST'},{writing:true,timeoutMs:5}),/قد تكون العملية تمت/);assert.equal(calls,1,'uncertain writes are never retried');
 const {useSavedProgress,emptyLearning,validLearning,validProgress}=await compile('app/use-saved-progress.ts',[{name:'hooks',setup(b){b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const useState=v=>globalThis.hooks.useState(v),useRef=v=>globalThis.hooks.useRef(v),useEffect=(f,d)=>globalThis.hooks.useEffect(f,d),useCallback=(f,d)=>globalThis.hooks.useCallback(f,d);',loader:'js'}))}}]);
 assert(validLearning(emptyLearning()));assert(!validLearning({...emptyLearning(),activity:[{id:'broken'}]}));assert(!validProgress({items:[{xp:NaN}]}));
 let slots=[],index=0,effects=[],dirty=false,requests=[],api;
 globalThis.hooks={
  useState(v){const i=index++;slots[i]??={value:typeof v==='function'?v():v};return [slots[i].value,n=>{slots[i].value=typeof n==='function'?n(slots[i].value):n;dirty=true}]},
  useRef(v){const i=index++;slots[i]??={current:v};return slots[i]},
  useCallback(f,deps){const i=index++;if(!slots[i]||deps.some((d,j)=>d!==slots[i].deps[j]))slots[i]={deps,value:f};return slots[i].value},
  useEffect(f,deps){const i=index++;if(!slots[i]||deps.some((d,j)=>d!==slots[i].deps[j])){slots[i]?.cleanup?.();slots[i]={deps};effects.push(()=>slots[i].cleanup=f())}}
 };
 globalThis.fetch=(url,init)=>new Promise((resolve,reject)=>requests.push({url,init,resolve,reject}));
 const item=(id,xp)=>({id,kind:'quiz',score:3,xp,completedAt:'2026-10-07'});
 const settle=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r))};
 function render(owner,runEffects=true){index=0;dirty=false;api=useSavedProgress(owner);if(runEffects)for(const effect of effects.splice(0))effect();return api}
 const reply=(batch,items,learning=emptyLearning())=>{for(const r of batch)r.resolve(Response.json(r.url==='/api/progress'?{items}:learning))};
 render('a');const first=requests.splice(0);reply(first,[item('a',100)]);await settle();assert.equal(render('a').items[0].id,'a');
 const oldRefresh=api.refresh();const older=requests.splice(0);const newRefresh=api.refresh();const newer=requests.splice(0);
 assert(older.every(r=>r.init.signal.aborted));reply(newer,[item('new',200)]);await newRefresh;reply(older,[item('old',100)]);await oldRefresh;assert.equal(render('a').items[0].id,'new','late response cannot replace newer data');
 const previous=api.refresh(),previousBatch=requests.splice(0);
 const switchView=render('b',false);assert.equal(switchView.items.length,0,'mask previous account before the new-account effect');assert(switchView.loading);
 render('b');const bBatch=requests.splice(0);reply(previousBatch,[item('a',999)]);await previous;reply(bBatch,[item('b',50)]);await settle();assert.equal(render('b').items[0].id,'b');
 const brokenRefresh=api.refresh(),broken=requests.splice(0);reply(broken,[item('b',50)],{activity:[]});await brokenRefresh;render('b');assert(api.error.includes('سجل التقدم'));assert(!api.loading);assert.equal(api.items[0].id,'b','keep last known data with an explicit error, not a false zero');
 const recovery=api.refresh(),recoveryBatch=requests.splice(0);reply(recoveryBatch,[item('b',60)]);await recovery;assert.equal(render('b').error,'');
 const saving=api.update({action:'bookmark',id:'network-5',saved:true});const writes=requests.splice(0);assert.equal(writes.length,1);assert.equal(writes[0].init.method,'POST');writes[0].resolve(Response.json({ok:true}));await settle();const afterWrite=requests.splice(0);afterWrite[0].resolve(new Response('gateway',{status:503}));afterWrite[1].resolve(Response.json(emptyLearning()));await assert.rejects(saving,/تم تأكيد الحفظ/);assert.equal(requests.length,0);
 render('');assert.equal(api.items.length,0);assert.equal(api.learning.notes.length,0);assert(!api.loading);
 for(const slot of slots)slot?.cleanup?.();
 console.log('PASS: real request/hook logic, timeout without write retry, expired session, malformed response, overlapping refresh, pre-effect account masking, retained/error state, recovery and acknowledged-save refresh failure.');
}finally{globalThis.fetch=realFetch;delete globalThis.hooks}
