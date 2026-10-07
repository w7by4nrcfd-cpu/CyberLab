// Scope is a view of existing content. Exercise real compiled views against isolated D1.
// Hook harness does not constitute browser, OAuth, or device visual QA.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function source(entry){const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const curriculum=await source('lib/curriculum.ts'),scope=await source('lib/content-scope.ts'),guided=await source('lib/guided-progression.ts'),search=await source('lib/site-search.ts');
const {lessons,tracks,publicLessons}=curriculum;
assert.equal(lessons.length,220);assert.equal(tracks.length,17);
assert.deepEqual(new Set(Object.keys(scope.contentScope)),new Set(lessons.map(l=>l.id)));
assert.deepEqual(scope.scopeCounts(),{CYBER_CORE:135,CYBER_SUPPORTING:60,OUT_OF_SCOPE:25});
const archived=['it-1','it-2','it-3','it-12','windows-1','windows-9','py-1','py-2','py-3','py-4','py-5','py-7','py-8','py-9','py-10','py-11','py-15','py-16','py-17','py-19','web-4','career-3','career-7','career-8','career-9'];
assert.deepEqual(new Set(lessons.filter(l=>!scope.isCyberLesson(l.id)).map(l=>l.id)),new Set(archived));
const partition=scope.cyberDirections.flatMap(d=>scope.directionLessons(d.id));assert.equal(partition.length,195);assert.equal(new Set(partition.map(l=>l.id)).size,195);
for(const l of partition){const placement=scope.contentScope[l.id];assert(scope.cyberUnits[placement.direction].some(u=>u.id===placement.unit));assert(placement.reason.length>10)}
assert.equal(guided.guidedLesson(new Set(),[{id:'py-1',completedAt:null}]).lesson.id,'sec-1');
assert.equal(guided.guidedLesson(new Set(['it-2']),[{id:'py-1',completedAt:null},{id:'security-8',completedAt:null}]).lesson.id,'security-8');
for(const lesson of lessons)assert.equal(search.searchResults.find(r=>r.href==='/learn/'+lesson.id).scope,scope.scopeForLesson(lesson.id));
for(const q of ['IP','Windows','البرمجة','الأمن','NAT','phishing']){const results=search.searchSite(q);for(let i=1;i<results.length;i++)assert(scope.scopeOrder[results[i-1].scope]<=scope.scopeOrder[results[i].scope]);assert.equal(new Set(results.map(r=>r.href)).size,results.length)}
assert(search.searchSite('NAT').some(r=>r.href.startsWith('/labs/')));assert(search.searchSite('العتاد').some(r=>r.href==='/learn/it-2'));
const directory=await mkdtemp(join(tmpdir(),'cyberlab-scope-')),uiDir=await mkdtemp(resolve('.sites-runtime/scope-ui-'));
const modules=['index.js',...(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};let worker;
async function call(path,body,user='existing'){const headers={};if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test'}if(body!==undefined)headers['Content-Type']='application/json';const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
const entries={catalog:'app/learn/catalog.tsx',roadmap:'app/roadmap/page.tsx',search:'app/search/results.tsx',track:'app/tracks/[id]/view.tsx',advanced:'app/roadmap/advanced.tsx',dashboard:'app/dashboard.tsx'},components={};
for(const [id,entry] of Object.entries(entries)){
 const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',external:['react/jsx-runtime'],plugins:[{name:'hooks',setup(b){
 b.onResolve({filter:/^(react|lucide-react|@\/app\/shell|\.\.\/shell|\.\/shell|@\/components\/native-link|@\/components\/ui\/progress)$/},a=>({path:a.path,namespace:'harness'}));
 if(id==='roadmap')b.onResolve({filter:/^\.\/advanced$/},()=>({path:'advanced-stub',namespace:'harness'}));
 if(id==='dashboard')b.onResolve({filter:/^(\.\/adaptive\/overview|\.\/career\/view|\.\/rank\/experience|@\/app\/experience\/core-start)$/},a=>({path:a.path,namespace:'harness'}));
 b.onLoad({filter:/.*/,namespace:'harness'},a=>({loader:'js',contents:
 a.path==='react'?`export const useState=v=>globalThis.scopeHooks.useState(v),useEffect=(f,d)=>globalThis.scopeHooks.useEffect(f,d);`:
 a.path.endsWith('shell')?`export const useProgress=()=>globalThis.scopeProgress;`:
 a.path==='lucide-react'?`import {jsx} from 'react/jsx-runtime';const icon=(name)=>()=>jsx('i',{'data-icon':name});export const Bookmark=icon('Bookmark'),CheckCircle2=icon('CheckCircle2'),BookOpen=icon('BookOpen'),Search=icon('Search'),Map=icon('Map'),ArrowLeft=icon('ArrowLeft'),ArrowRight=icon('ArrowRight'),FlaskConical=icon('FlaskConical'),Code2=icon('Code2'),Network=icon('Network'),Shield=icon('Shield'),Activity=icon('Activity'),TrendingUp=icon('TrendingUp'),Trophy=icon('Trophy');`:
 a.path.includes('native-link')?`import {jsx} from 'react/jsx-runtime';export default p=>jsx('a',p);`:
 a.path.includes('progress')?`import {jsx} from 'react/jsx-runtime';export const Progress=p=>jsx('span',{'data-progress':p.value});`:
 a.path.includes('core-start')?`import {jsx} from 'react/jsx-runtime';export default ()=>jsx('section',{'data-core-journey':true});`:
 `export default ()=>null;export const CareerCard=()=>null,RankSummary=()=>null;`}))}}]});
 const file=join(uiDir,id+'.mjs');await writeFile(file,result.outputFiles[0].text);components[id]=(await import(pathToFileURL(file))).default;
}
let slots=[],index=0,dirty=false,effects=[],tree,pending=new Set(),uiUser,Component,props;
const oldFetch=globalThis.fetch;
globalThis.fetch=(path,init={})=>{const headers={...init.headers};if(uiUser){headers['oai-authenticated-user-id']=uiUser;headers['oai-authenticated-user-email']=uiUser+'@example.test'}const p=(async()=>{const r=await worker.dispatchFetch('http://local.test'+path,{...init,headers});return new Response(await r.text(),{status:r.status,headers:r.headers})})();pending.add(p);p.finally(()=>pending.delete(p));return p};
globalThis.window={location:{hash:''}};
globalThis.scopeHooks={useState(v){const i=index++;if(!slots[i])slots[i]={value:typeof v==='function'?v():v};return [slots[i].value,n=>{slots[i].value=typeof n==='function'?n(slots[i].value):n;dirty=true}]},useEffect(f,deps){const i=index++;if(!slots[i]||deps.some((d,j)=>d!==slots[i].deps[j])){slots[i]?.cleanup?.();slots[i]={deps};effects.push(()=>{slots[i].cleanup=f()})}}};
function render(){index=0;dirty=false;tree=Component(props);for(const effect of effects.splice(0))effect()}
async function settle(){for(let i=0;i<16;i++){if(pending.size)await Promise.all([...pending]);await new Promise(r=>setImmediate(r));if(dirty)render()}assert.equal(pending.size,0);assert(!dirty)}
function nodes(node,out=[],visible=false){if(arguments.length===0)node=tree;if(Array.isArray(node)){for(const child of node)nodes(child,out,visible)}else if(node&&typeof node==='object'&&node.props){if(typeof node.type==='function')nodes(node.type(node.props),out,visible);else{out.push(node);if(visible&&node.type==='details'&&!node.props.open)nodes([node.props.children].flat().filter(c=>c?.type==='summary'),out,visible);else nodes(node.props.children,out,visible)}}return out}
function textOf(node){if(node==null||typeof node==='boolean')return '';if(Array.isArray(node))return node.map(textOf).join('');if(typeof node==='string'||typeof node==='number')return String(node);return typeof node.type==='function'?textOf(node.type(node.props)):textOf(node.props?.children)}
const primary=()=>nodes().filter(n=>n.type==='a'&&n.props.className==='primary-button');
const link=id=>nodes().find(n=>n.type==='a'&&n.props.href==='/learn/'+id);
async function mount(id,user='existing',p={}){for(const slot of slots)slot?.cleanup?.();slots=[];uiUser=user;Component=components[id];props=p;const items=user?(await call('/api/progress',undefined,user)).data.items:[];const learning=user?(await call('/api/learning',undefined,user)).data:{activity:[],bookmarks:[],notes:[],dailyTime:[],preferences:{dailyGoal:15,theme:'dark'}};globalThis.scopeProgress={items,learning,user:user?{email:user+'@example.test'}:null,loading:false,error:'',refresh:async()=>{}};render();await settle()}
async function snapshot(user){const db=await worker.getD1Database('DB'),out={};for(const table of ['progress','activity','bookmarks','notes','skill_awards','skill_progress','career_promotions','mission_progress','interactive_lab_progress','soc_investigations','investigation_workspaces','investigation_evidence','investigation_links','dynamic_incidents','dynamic_active'])out[table]=(await db.prepare('SELECT * FROM '+table+' WHERE user_id=? ORDER BY rowid').bind(user).all()).results;return out}
try{
 worker=new Miniflare(options);const db=await worker.getD1Database('DB');for(const file of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 for(const id of ['it-2','py-19','net-1'])await db.prepare("INSERT INTO progress VALUES (?,?,?,?,?,?)").bind('existing',id,'quiz',3,100,'2026-07-01T00:00:00.000Z').run();
 for(const id of ['py-1','security-8'])assert.equal((await call('/api/learning',{action:'read',id,seconds:30})).status,200);
 assert.equal((await call('/api/learning',{action:'bookmark',id:'it-2',saved:true})).status,200);
 // Existing read-time backfills are allowed to finish before testing read-only views.
 await call('/api/skills');await call('/api/career');const before=await snapshot('existing');
 await mount('catalog','zero',{lessons:publicLessons()});assert.equal(primary().length,1);assert.equal(primary()[0].props.href,'/');assert.equal(nodes().filter(n=>n.props.className==='scope-direction').length,4);assert.equal(nodes(tree,[],true).filter(n=>n.type==='a'&&n.props.href.startsWith('/learn/')).length,0);assert(!textOf(tree).includes('220 درس'));assert(nodes().find(n=>n.props.id==='additional-knowledge'&&!n.props.open));
 nodes().find(n=>n.type==='input').props.onChange({target:{value:'العتاد'}});await settle();assert(link('it-2'));assert(nodes().find(n=>n.props.id==='additional-knowledge'&&n.props.open));assert(textOf(tree).includes('خارج الرحلة الأساسية'));
 await mount('catalog','existing',{lessons:publicLessons()});assert.equal(primary()[0].props.href,'/');assert(link('security-8'));assert(link('py-1'));assert(nodes(link('it-2')).some(n=>n.props['data-icon']==='CheckCircle2'));
 nodes().find(n=>n.type==='button').props.onClick();await settle();assert(link('it-2'));assert(!link('py-19'));
 await mount('roadmap');assert.equal(primary()[0].props.href,'/');const refs=nodes().filter(n=>n.type==='a'&&n.props.href.startsWith('/learn/')&&!n.props.href.includes('#'));assert.equal(refs.length,195);assert(refs.every(n=>scope.isCyberLesson(n.props.href.slice(7))));assert.equal(nodes().filter(n=>n.props.className==='scope-direction').length,4);
 await mount('track','existing',{track:tracks.find(t=>t.id==='it')});assert.equal(primary()[0].props.href,'/learn/it-4');assert(textOf(tree).includes('1 من 12'));assert(textOf(tree).includes('100 XP'));assert(nodes(link('it-2')).some(n=>n.props['data-icon']==='CheckCircle2'));assert(nodes().filter(n=>n.props.className==='scope-additional').every(n=>!n.props.open));
 await mount('dashboard','zero',{lessons:publicLessons()});assert(nodes().some(n=>n.props['data-core-journey']));
 await mount('dashboard','existing',{lessons:publicLessons()});assert.equal(primary()[0].props.href,'/learn/security-8');assert(textOf(tree).includes('أساسيات الأمن السيبراني'));const progressDisclosure=nodes().find(n=>n.type==='details'&&textOf(n).includes('التدريب الموصى به'));assert(progressDisclosure);const toggle={open:true};progressDisclosure.props.onToggle({target:toggle,currentTarget:toggle});await settle();assert(nodes().find(n=>n.type==='details'&&textOf(n).includes('المراحل المهنية المحفوظة')));
 await mount('advanced','zero',{bossId:'boss-002'});assert(textOf(tree).includes('مقفل'));assert(textOf(tree).includes('المتبقي'));assert(nodes().some(n=>n.props.href==='/bosses/boss-002'));
 await mount('search','zero',{results:search.searchResults.filter(r=>['/bosses/boss-002','/learn/it-2','/learn/sec-1'].includes(r.href))});assert(textOf(tree).includes('مقفل'));assert(textOf(tree).includes('المتبقي للفتح'));assert(textOf(tree).includes('Archived / Additional'));assert(link('it-2'));
 const locked=await call('/api/missions',{id:'boss-002',action:'start'},'zero');assert.notEqual(locked.status,200,'search cannot override actual unlock rules');
 const old=await db.prepare("INSERT INTO mission_progress (user_id,mission_id,started_at,updated_at,completed_at,score,stars,session_json) VALUES (?,?,?,?,?,?,?,?)").bind('completed','boss-002','2026-07-01','2026-07-01','2026-07-01',100,3,'{}').run();assert(old.success);
 await mount('advanced','completed',{bossId:'boss-002'});assert(textOf(tree).includes('مكتمل'));assert(!textOf(tree).includes('المتبقي:'));
 for(const id of archived){const r=await worker.dispatchFetch('http://local.test/learn/'+id);assert.equal(r.status,200,id);assert((await r.text()).includes('خارج الرحلة الأساسية'),id)}
 for(const path of ['/','/learn','/roadmap','/search?q=NAT','/bosses/boss-002','/experience/nexacorp-first','/experience/nexacorp-email','/campaigns/first-signal','/soc/alerts/SOC-002'])assert.equal((await worker.dispatchFetch('http://local.test'+path)).status,200,path);
 assert.deepEqual(await snapshot('existing'),before,'classification/viewing must not rewrite saved progress or rewards');
 await mount('catalog','existing',{lessons:publicLessons()});assert(link('security-8'));assert.deepEqual(await snapshot('existing'),before,'refreshing reference UI is read-only');
 await worker.dispose();worker=new Miniflare(options);assert.deepEqual(await snapshot('existing'),before);await mount('catalog','existing',{lessons:publicLessons()});assert(nodes(link('it-2')).some(n=>n.props['data-icon']==='CheckCircle2'));assert.equal((await call('/api/progress',undefined,'zero')).data.items.length,0);
 const rewards={items:(await call('/api/progress')).data.items,skills:(await call('/api/skills')).data.skills.map(s=>[s.id,s.xp])};
 const replay=await call('/api/submit',{kind:'quiz',id:'py-19',answers:[0,1,0]});assert.equal(replay.status,200);assert(replay.data.passed);assert.deepEqual((await call('/api/progress')).data.items,rewards.items);assert.deepEqual((await call('/api/skills')).data.skills.map(s=>[s.id,s.xp]),rewards.skills);
 console.log('PASS: 220-lesson audit/195-reference partition; four collapsed directions; existing archived completion/bookmark/URL and original XP totals; scope-prioritized search; cyber-only Continue Learning; Mission-First default; real locked activity and grandfathered completion; read-only progress/skills/career snapshots; refresh/restart/isolation and no duplicate quiz/Skill XP. Compiled UI + real isolated D1, not browser/OAuth/device QA.');
}finally{globalThis.fetch=oldFetch;for(const slot of slots)slot?.cleanup?.();if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true});await rm(uiDir,{recursive:true,force:true})}
