import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {hasCommit,skipBaseline} from './helpers/git-baseline.mjs';
const require=createRequire(import.meta.url),viteRequire=createRequire(require.resolve('vite/package.json')),{build}=viteRequire('esbuild'),postcss=viteRequire('postcss'),jsx=pathToFileURL(require.resolve('react/jsx-runtime')).href;
const b=await build({entryPoints:['app/soc/view.tsx'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',plugins:[{name:'ui',setup(b){
 b.onResolve({filter:/^react\/jsx-runtime$/},()=>({path:jsx,external:true}));
 b.onResolve({filter:/^(react|lucide-react|@\/app\/shell)$/},a=>({path:a.path,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path==='react'?'export const useState=v=>globalThis.ui.state(v),useEffect=(f,d)=>globalThis.ui.effect(f,d),useMemo=f=>f();':a.path==='@/app/shell'?'export const useProgress=()=>({user:globalThis.ui.user});':`import {jsx} from 'react/jsx-runtime';const Icon=p=>jsx('svg',p);export const Activity=Icon,ArrowLeft=Icon,ShieldCheck=Icon,FileWarning=Icon,FolderOpen=Icon,Search=Icon,ChevronDown=Icon;`}));
 }}]});
const Console=(await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))).default;
const ui={user:null,index:0,slots:[],effects:[],state(v){const i=this.index++;if(!(i in this.slots))this.slots[i]=v;return [this.slots[i],next=>this.slots[i]=typeof next==='function'?next(this.slots[i]):next]},effect(f,deps){const i=this.index++,old=this.slots[i];if(!old||deps.some((d,j)=>d!==old.deps[j])){this.effects.push(()=>{old?.cleanup?.();this.slots[i]={deps,cleanup:f()}})}}};globalThis.ui=ui;
function materialize(n){if(Array.isArray(n))return n.map(materialize);if(n?.props){if(typeof n.type==='function')return materialize(n.type(n.props));return {...n,props:{...n.props,children:materialize(n.props.children)}}}return n}
function render(runEffects=true){ui.index=0;ui.effects=[];const tree=materialize(Console());if(runEffects)ui.effects.forEach(f=>f());return tree}
function nodes(n,out=[]){if(Array.isArray(n))n.forEach(x=>nodes(x,out));else if(n?.props){out.push(n);nodes(n.props.children,out)}return out}
function text(n){if(n==null||typeof n==='boolean')return '';if(Array.isArray(n))return n.map(text).join('');if(typeof n==='object')return text(n.props?.children);return String(n)}
const byId=(tree,id)=>nodes(tree).find(n=>n.props.id===id),rows=tree=>nodes(tree).filter(n=>n.props.className==='soc-alert-row');
const requests=[];globalThis.fetch=(path,options)=>new Promise(resolve=>requests.push({path,options,resolve}));
const reply=async(i,data,ok=true)=>{requests[i].resolve({ok,json:async()=>data});await new Promise(resolve=>setImmediate(resolve))};
const alert=(id,severity,status,type,host)=>({id,title:'Alert '+id,severity,status,type,host,user:'maya',sourceIp:'203.0.113.86',summary:'Training alert',timestamp:'2026-10-07T10:00:00Z',closedAt:null});
const queue={alerts:[alert('SOC-005','Critical','New','Network','APP-02'),alert('SOC-004','High','Investigating','Endpoint','FIN-02'),alert('SOC-003','Low','Resolved','Email','HR-07')],cases:[],stats:{newAlerts:1,activeCases:0,closedAlerts:1,totalAlerts:3,progress:33}};
let tree=render();assert(text(tree).includes('تسجيل الدخول'));assert.equal(requests.length,0);
ui.user={email:'a@example.test'};tree=render();assert(text(tree).includes('جارٍ استعادة'));await reply(0,queue);tree=render();assert.equal(rows(tree).length,3);
for(const id of ['soc-search','soc-severity','soc-status','soc-type'])assert(nodes(tree).some(n=>n.type==='label'&&n.props.htmlFor===id),'visible associated label: '+id);
assert.equal(nodes(tree).filter(n=>n.props.className?.includes('soc-filter-control')).length,4);
byId(tree,'soc-search').props.onChange({target:{value:'app-02'}});tree=render();assert.equal(rows(tree).length,1);assert(rows(tree)[0].props.href.includes('SOC-005'));
byId(tree,'soc-severity').props.onChange({target:{value:'High'}});tree=render();assert.equal(rows(tree).length,0);assert(text(tree).includes('لا توجد تنبيهات تطابق'));
nodes(tree).find(n=>n.type==='button'&&text(n)==='مسح المرشحات').props.onClick();tree=render();assert.equal(rows(tree).length,3);assert.equal(byId(tree,'soc-search').props.value,'');
byId(tree,'soc-status').props.onChange({target:{value:'Investigating'}});tree=render();assert.equal(rows(tree).length,1);assert(rows(tree)[0].props.href.includes('SOC-004?view=defensive'));
byId(tree,'soc-type').props.onChange({target:{value:'Network'}});tree=render();assert.equal(rows(tree).length,0);nodes(tree).find(n=>n.type==='button'&&text(n)==='مسح المرشحات').props.onClick();tree=render();assert.equal(rows(tree).length,3);assert.equal(requests.length,1,'filtering and clearing are local read-only actions');
ui.user={email:'b@example.test'};tree=render(false);assert.equal(rows(tree).length,0,'old account hidden before effect cleanup');ui.effects.forEach(f=>f());
ui.user={email:'c@example.test'};tree=render();await reply(1,queue);tree=render();assert.equal(rows(tree).length,0,'late old queue stays hidden');
await reply(2,{...queue,alerts:[],stats:{...queue.stats,totalAlerts:0,newAlerts:0,closedAlerts:0,progress:0}});tree=render();assert(!nodes(tree).some(n=>n.props.className==='panel guided-focus'),'empty queue never dereferences an undefined primary alert');
ui.user={email:'d@example.test'};render();await reply(3,{error:'تعذر تحميل SOC'},false);tree=render();assert(nodes(tree).some(n=>n.props.role==='alert'));let retries=0;globalThis.location={reload(){retries++}};nodes(tree).find(n=>n.type==='button'&&text(n)==='إعادة المحاولة').props.onClick();assert.equal(retries,1);

// Compare the exact competing declarations behind the reported screenshot.
// This checks cascade priority, not browser layout, painting or Safari glyphs.
const cssBaseline='64e9a036c0e8e8a3fe1aa2b8bb0dc9b44429792b',before=hasCommit(cssBaseline)?postcss.parse(execFileSync('git',['show',cssBaseline+':app/globals.css'],{encoding:'utf8'})):null,after=postcss.parse(await readFile('app/globals.css','utf8')),fixes=postcss.parse(await readFile('app/control-fixes.css','utf8'));
function rule(root,selector){let found;root.walkRules(r=>{if(r.parent.type==='root'&&r.selector.split(',').map(s=>s.trim()).includes(selector))found=r});assert(found,selector);return found}
function declaration(r,property){return r.nodes.findLast(n=>n.type==='decl'&&n.prop===property)?.value}
function specificity(selector){const s=selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g,'').replace(/:not\(([^()]*)\)/g,'$1');return [(s.match(/#[\w-]+/g)||[]).length,(s.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+/g)||[]).length,(s.match(/(?:^|[\s>+~])(input|label|select|textarea)(?=$|[\s:.#>+~])/g)||[]).length]}
const compare=(a,b)=>{for(let i=0;i<3;i++)if(a[i]!==b[i])return a[i]-b[i];return 0};
assert(compare(specificity('.panel label:not(.answer-option)'),specificity('.soc-filters label'))>0,'original generic panel label defeats component flex');
if(before)assert.equal(declaration(rule(before,'.panel label:not(.answer-option)'),'display'),'block');else skipBaseline(cssBaseline,'original globals.css cascade reproduction');
assert(compare(specificity('.panel :where(label:not(.answer-option))'),specificity('.soc-filters label'))<0,'panel default now defers to component layout');
assert.equal(declaration(rule(after,'.panel :where(label:not(.answer-option))'),'display'),'block','ordinary panel labels retain their default');
if(before)assert.equal(declaration(rule(before,'.soc-page input'),'border'),'1px solid #496353','original late form style adds the inner border');
assert(compare(specificity('.soc-page :where(input,textarea,select)'),specificity('.soc-filters input'))<0,'general form default no longer defeats filters');
assert.equal(declaration(rule(fixes,'.soc-page .soc-filter-control>input'),'border'),'0');assert.equal(declaration(rule(fixes,'.soc-page .soc-filter-control'),'border'),'1px solid var(--border)');
assert.equal(declaration(rule(fixes,'.soc-page .soc-filter-select>select'),'appearance'),'none','one caret, not native plus custom arrows');
assert.equal(declaration(rule(fixes,'.soc-page .soc-filters>label'),'margin'),'0');
assert(compare(specificity('.practice-check .practice-check-option'),specificity('.il-page label'))>0,'review choices own their inline radio layout inside labs');
assert.equal(declaration(rule(fixes,'.practice-check .practice-check-option'),'display'),'flex');
const mobile=[];fixes.walkAtRules('media',r=>{if(r.params==='(max-width:650px)')r.walkRules(x=>mobile.push(x))});assert(mobile.some(r=>r.selector==='.soc-page .soc-filters'&&declaration(r,'grid-template-columns')==='minmax(0,1fr)'));
delete globalThis.ui;
console.log('PASS: real compiled SOC search/severity/status/type/clear/retry handlers; visible field labels; no filter writes; correct alert routing; pre-effect account masking, late queue rejection, empty/error safety; original cascade conflict reproduced and corrected priorities. No browser/Safari visual claim.');
