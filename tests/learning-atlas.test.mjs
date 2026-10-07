// Actual compiled presentation logic and interaction handlers. No browser/Safari claim.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild'),postcss=createRequire(require.resolve('vite/package.json'))('postcss');
const directory=await mkdtemp(resolve('.sites-runtime/atlas-test-'));
async function load(entry,mock=false){const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',external:mock?['react/jsx-runtime']:[],plugins:mock?[{name:'hooks',setup(b){b.onResolve({filter:/^(react|lucide-react|@\/app\/shell)$/},a=>({path:a.path,namespace:'harness'}));b.onLoad({filter:/.*/,namespace:'harness'},a=>({loader:'js',contents:a.path==='react'?'export const useState=v=>globalThis.atlasHooks.useState(v),useEffect=(f,d)=>globalThis.atlasHooks.useEffect(f,d),useRef=v=>globalThis.atlasHooks.useRef(v);':a.path==='lucide-react'?'export const CheckCircle2=()=>null;':'export const useProgress=()=>globalThis.atlasContext;'}))}}]:[]});const file=join(directory,entry.replaceAll('/','-')+'.mjs');await writeFile(file,result.outputFiles[0].text);return import(pathToFileURL(file))}
const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator'),originalDocument=globalThis.document,originalTimeout=globalThis.setTimeout,createURL=URL.createObjectURL,revokeURL=URL.revokeObjectURL;
try{
 const {atlasProgress}=await load('lib/learning-atlas.ts'),{publicLessons}=await load('lib/curriculum.ts'),{completedIds}=await load('lib/metrics.ts');
 const lessons=publicLessons(),activity=[{id:'network-1',completedAt:'2026-10-07',lastAt:'2026-10-07T01:00:00Z'},{id:'linux-1',completedAt:null,lastAt:'2026-10-07T02:00:00Z'},{id:'soc-1',completedAt:null,lastAt:'2026-10-07T03:00:00Z'},{id:'unknown',completedAt:null,lastAt:'2026-10-07T04:00:00Z'}];
 const done=completedIds([{kind:'quiz',id:'network-1'},{kind:'lab',id:'linux-2'},{kind:'quiz',id:'unknown'}],{activity});
 const snapshot=JSON.stringify(activity),stations=atlasProgress(lessons,done,activity);
 assert.deepEqual(stations.map(s=>s.total),['network','linux','soc'].map(id=>lessons.filter(l=>l.track===id).length));
 assert.equal(stations[0].completed,1,'reading and quiz completion must be deduplicated');assert.equal(stations[1].completed,0,'a lab ID is not lesson completion');
 assert.equal(stations.find(s=>s.active).id,'soc','resume latest unfinished activity across directions');assert.equal(JSON.stringify(activity),snapshot,'view does not mutate saved state');
 assert(atlasProgress(lessons,new Set(lessons.map(l=>l.id)),activity).every(s=>s.state==='مكتمل'&&!s.active));
 assert.equal(atlasProgress(lessons,new Set(),[]).find(s=>s.active).id,'network');
 assert(atlasProgress([],new Set(),[]).every(s=>!s.active&&s.state!=='مكتمل'),'empty tracks never claim completion');
 const Atlas=(await load('components/learning-atlas.tsx',true)).default,{default:Desk,notesMarkdown}=await load('components/learning-desk.tsx',true),Copy=(await load('components/copy-example.tsx',true)).default;
 let slots=[],index=0,effects=[],dirty=false,tree,Component,props;
 globalThis.atlasHooks={useState(v){const i=index++;slots[i]??={value:typeof v==='function'?v():v};return [slots[i].value,n=>{slots[i].value=typeof n==='function'?n(slots[i].value):n;dirty=true}]},useRef(v){const i=index++;slots[i]??={current:v};return slots[i]},useEffect(f,d){const i=index++;if(!slots[i]||d.some((v,j)=>v!==slots[i].deps[j])){slots[i]?.cleanup?.();slots[i]={deps:d};effects.push(()=>slots[i].cleanup=f())}}};
 function render(){index=0;dirty=false;tree=Component(props);for(const e of effects.splice(0))e()}
 async function settle(){for(let i=0;i<6;i++){await new Promise(r=>setImmediate(r));if(dirty)render()}assert(!dirty)}
 async function mount(c,p){slots=[];effects=[];Component=c;props=p;render();await settle()}
 function nodes(n,out=[]){if(arguments.length===0)n=tree;if(Array.isArray(n))n.forEach(c=>nodes(c,out));else if(n?.props){if(typeof n.type==='function')nodes(n.type(n.props),out);else{out.push(n);nodes(n.props.children,out)}}return out}
 function text(n){if(arguments.length===0)n=tree;if(n==null||typeof n==='boolean')return '';if(Array.isArray(n))return n.map(c=>text(c)).join('');if(typeof n==='string'||typeof n==='number')return String(n);return text(n.props?.children)}
 const learning={activity,bookmarks:[{id:'network-1'},{id:'unknown'}],notes:[{id:'network-1',content:'ملاحظتي الكاملة\nالسطر الثاني',updatedAt:'2026-10-07'},{id:'linux-1',content:'  ',updatedAt:'2026-10-07'},{id:'unknown',content:'محتوى غير مرتبط',updatedAt:'2026-10-07'}]};
 globalThis.atlasContext={items:[],learning,user:{email:'a@example.test'},loading:false,error:''};
 await mount(Atlas,{lessons});assert.equal(nodes().filter(n=>n.type==='a').length,3);assert.equal(nodes().find(n=>n.type==='ol').props['aria-busy'],false);
 atlasContext.loading=true;render();assert(text().includes('جار تحميل التقدم'));assert(!text().includes('1 من '),'loading does not assert a saved count');
 atlasContext.loading=false;atlasContext.error='تعذر الاتصال';render();assert(text().includes('تعذر تحديث التقدم'));atlasContext.error='';
 for(const state of [{user:null},{loading:true},{error:'failed'}]){const before=atlasContext;globalThis.atlasContext={...before,...state};await mount(Desk,{lessons});assert.equal(tree,null,'no stale private desk while guest/loading/error');globalThis.atlasContext=before}
 await mount(Desk,{lessons});assert(text().includes('1 مراجع محفوظة · 1 ملاحظات'));assert(nodes().some(n=>n.props.href==='/learn?saved=1'));assert(!text().includes('محتوى غير مرتبط'));
 const exported=notesMarkdown(lessons,learning.notes);assert(exported.includes('ملاحظتي الكاملة\nالسطر الثاني'));assert(!exported.includes('محتوى غير مرتبط'));assert.equal((exported.match(/^## /gm)||[]).length,1);
 let payload,clicked=false,removed=false,revoked=false,timer;URL.createObjectURL=blob=>{payload=blob;return 'blob:notes'};URL.revokeObjectURL=url=>{assert.equal(url,'blob:notes');revoked=true};globalThis.setTimeout=f=>{timer=f;return 1};
 const anchor={click(){clicked=true},remove(){removed=true}};globalThis.document={createElement:tag=>{assert.equal(tag,'a');return anchor},body:{appendChild:a=>assert.equal(a,anchor)}};
 nodes().find(n=>n.type==='button').props.onClick();render();assert(clicked&&removed);assert.equal(anchor.download,'cyberlab-notes.md');assert.equal(await payload.text(),exported);timer();assert(revoked);
 URL.createObjectURL=()=>{throw Error('unsupported')};nodes().find(n=>n.type==='button').props.onClick();render();assert(text().includes('تعذر تجهيز الملف'));
 globalThis.setTimeout=originalTimeout;
 let copied;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async v=>{copied=v}}}});await mount(Copy,{text:'cat /etc/hosts',id:'linux-1'});nodes().find(n=>n.type==='button').props.onClick();await settle();assert.equal(copied,'cat /etc/hosts');assert(text().includes('نُسخ المثال'));
 navigator.clipboard.writeText=async()=>{throw Error('denied')};nodes().find(n=>n.type==='button').props.onClick();await settle();assert(text().includes('يمكنك تحديد المثال'));
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});await mount(Copy,{text:'a',id:'a'});nodes().find(n=>n.type==='button').props.onClick();await settle();assert(text().includes('يمكنك تحديد المثال'));
 let finish;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:()=>new Promise(r=>finish=r)}}});await mount(Copy,{text:'old',id:'old'});nodes().find(n=>n.type==='button').props.onClick();props={text:'new',id:'new'};render();await settle();finish();await settle();assert(!text().includes('نُسخ المثال'),'late clipboard result cannot label another lesson');
 const css=postcss.parse(await readFile('app/atlas.css','utf8'));assert(css.nodes.some(n=>n.type==='atrule'&&n.params==='(max-width:767px)'));assert(!/overflow(?:-x)?\s*:\s*(hidden|clip)/.test(css.toString()));
 console.log('PASS: actual curriculum counts, deduplicated progress, latest resume, all/empty completion, loading/error labels, private desk masking, note export payload/cleanup/fallback, clipboard success/denial/missing/stale result, parsed responsive CSS. No browser/device claim.');
}finally{
 if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;
 globalThis.document=originalDocument;globalThis.setTimeout=originalTimeout;URL.createObjectURL=createURL;URL.revokeObjectURL=revokeURL;delete globalThis.atlasHooks;delete globalThis.atlasContext;
 await rm(directory,{recursive:true,force:true});
}
