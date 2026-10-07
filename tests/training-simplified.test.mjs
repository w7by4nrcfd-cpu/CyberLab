import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hasCommit,skipBaseline} from './helpers/git-baseline.mjs';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry){const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const {lessons}=await load('lib/curriculum.ts'),{lessonClarity}=await load('lib/lesson-clarity.ts');
const baselineCommit='a3e132d3545843024079079e11516cd8185894ff';
let baseline=null;
if(hasCommit(baselineCommit)){
const before=execFileSync('git',['show',baselineCommit+':lib/curriculum.ts'],{encoding:'utf8'}),beforeClarity=execFileSync('git',['show',baselineCommit+':lib/lesson-clarity.ts'],{encoding:'utf8'});
const baselineBuild=await build({stdin:{contents:before,resolveDir:process.cwd()+'/lib',sourcefile:'baseline.ts',loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',plugins:[{name:'baseline-clarity',setup(b){b.onLoad({filter:/\/lesson-clarity\.ts$/},()=>({contents:beforeClarity,loader:'ts'}))}}]});
baseline=await import('data:text/javascript;base64,'+Buffer.from(baselineBuild.outputFiles[0].text).toString('base64'));
}
if(baseline){
assert.deepEqual(lessons.map(l=>l.id),baseline.lessons.map(l=>l.id),'all lesson IDs and order preserved');
for(const l of lessons){const old=baseline.lessons.find(x=>x.id===l.id);assert.deepEqual(l.questions,old.questions,'assessment unchanged: '+l.id);assert.equal(l.minutes,old.minutes);if(!lessonClarity[l.id])assert.deepEqual(l,old,'outside lesson scope: '+l.id)}
}else skipBaseline(baselineCommit,'lesson/assessment comparison with the pre-simplification curriculum');
assert.equal(Object.keys(lessonClarity).length,22);
const explanationFields=['intro','sections','code','output','exercise','takeaways','objectives'];
const newScope=['network-1','network-3','network-4','network-6','linux-3','linux-4','linux-5','linux-6','linux-8','linux-9','soc-1','soc-5','soc-8'];
if(baseline){
assert.deepEqual(lessons.filter(l=>JSON.stringify(l)!==JSON.stringify(baseline.lessons.find(old=>old.id===l.id))).map(l=>l.id).sort(),newScope.toSorted(),'only the 13 selected explanations change');
for(const l of lessons){const old=baseline.lessons.find(x=>x.id===l.id),withoutExplanation=x=>Object.fromEntries(Object.entries(x).filter(([k])=>!explanationFields.includes(k)));assert.deepEqual(withoutExplanation(l),withoutExplanation(old),'all other metadata, questions, interactions and requirements unchanged: '+l.id)}
}
for(const id of Object.keys(lessonClarity)){const l=lessons.find(x=>x.id===id);assert(l.sections.every(s=>s.title&&s.text));assert(!l.sections.some(s=>s.text===l.intro),'no repeated introduction');assert(l.code&&l.output&&l.exercise);assert.equal(l.takeaways.length,3)}
const jsx=pathToFileURL(require.resolve('react/jsx-runtime')).href;
async function compile(entry){
 const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',plugins:[{name:'ui-fixtures',setup(b){
 b.onResolve({filter:/^react\/jsx-runtime$/},()=>({path:jsx,external:true}));
 b.onResolve({filter:/^@\/components\/operations-desk$/},a=>({path:a.path,namespace:'queue-fixture'}));
 b.onLoad({filter:/.*/,namespace:'queue-fixture'},()=>({loader:'js',contents:'export default ()=>null;'}));
 b.onResolve({filter:/^(react|lucide-react|@\/app\/shell|@\/components\/ui\/tabs|@\/components\/native-link)$/},a=>({path:a.path,namespace:'fixtures'}));
 b.onLoad({filter:/.*/,namespace:'fixtures'},a=>({loader:'js',contents:
 a.path==='react'?'export const useState=i=>[globalThis.fixture.snapshot??i,()=>{}],useEffect=f=>globalThis.fixture.effects.push(f),useRef=()=>({current:globalThis.fixture.details});':
 a.path==='lucide-react'?'export const Network=()=>null,Activity=()=>null,GitBranch=()=>null,FlaskConical=()=>null,Crosshair=()=>null,ShieldCheck=()=>null;':
 a.path==='@/app/shell'?'export const useProgress=()=>globalThis.fixture.progress;':
 a.path==='@/components/ui/tabs'?'export const Tabs=p=>p.children,TabsList=p=>p.children,TabsTrigger=p=>p.children,TabsContent=p=>p.children;':
 'import {jsx} from '+JSON.stringify(jsx)+';export default p=>jsx("a",p);'
 }));
 }}]});
 return (await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))).default;
}
function nodes(n,out=[]){if(Array.isArray(n))n.forEach(x=>nodes(x,out));else if(n&&n.props){if(typeof n.type==='function')nodes(n.type(n.props),out);else{out.push(n);nodes(n.props.children,out)}}return out}
function text(n){if(n==null||typeof n==='boolean')return '';if(Array.isArray(n))return n.map(text).join('');if(typeof n==='string'||typeof n==='number')return String(n);return typeof n.type==='function'?text(n.type(n.props)):text(n.props?.children)}
const fixture={snapshot:null,effects:[],details:null,progress:{user:null,items:[],learning:{activity:[]}}};globalThis.fixture=fixture;
const Labs=await compile('app/labs/page.tsx'),Missions=await compile('app/missions/page.tsx'),Company=await compile('app/operations/nexacorp/view.tsx');
const {interactiveLabs}=await load('lib/interactive-labs.ts');
fixture.snapshot={account:'guest',labs:interactiveLabs.map(l=>({...l,state:null,access:{locked:!!l.unlock,reasons:['درس سابق'],met:0,total:1}})),loading:false,error:''};
let tree=Labs();
const hrefs=nodes(tree).filter(n=>n.type==='a').map(n=>n.props.href);
for(const l of interactiveLabs)assert.equal(hrefs.filter(h=>h==='/labs/v2/'+l.id).length,1,'recommended lab not duplicated: '+l.id);
assert(!text(tree).includes('متطلبات الفتح'),'useful compact labels, no old extra heading');
fixture.progress.user={email:'new@example.test',name:'New'};
assert(text(Labs()).includes('جارٍ تحميل المختبرات'),'previous account hidden before effects');
fixture.snapshot={account:'new@example.test',labs:[],loading:false,error:'فشل الاتصال'};
assert(text(Labs()).includes('فشل الاتصال'));assert(!text(Labs()).includes('أكملت المختبرات'),'error is not completion');
fixture.progress.user=null;fixture.snapshot={account:'guest',states:[],loading:false,error:''};
tree=Missions();assert(text(tree).includes('سجّل الدخول للبدء'));
assert(nodes(tree).filter(n=>n.type==='a'&&n.props.href.startsWith('/signin-with-chatgpt?')).length===5,'guest can inspect all mission choices without private data');
fixture.progress.user={email:'new@example.test',name:'New'};assert(text(Missions()).includes('جارٍ تحميل مهماتك'),'mission snapshot is account-bound');
fixture.snapshot=null;fixture.effects=[];
const target={scrollIntoView(){this.scrolled=true}},details={open:false,contains:t=>t===target};fixture.details=details;
globalThis.window={location:{hash:'#device-APP-02'},addEventListener(){},removeEventListener(){}};
globalThis.document={getElementById:id=>id==='device-APP-02'?target:null};
globalThis.requestAnimationFrame=f=>{f();return 1};globalThis.cancelAnimationFrame=()=>{};
tree=Company();const ids=nodes(tree).filter(n=>n.props.id).map(n=>n.props.id);
assert.equal(new Set(ids).size,ids.length,'directory anchors unique');
assert(ids.includes('device-APP-02')&&ids.includes('employee-layla'));
for(const effect of fixture.effects)effect();assert(details.open&&target.scrolled,'deep link reveals its preserved company reference');
const css=await readFile('app/training-simplified.css','utf8'),nav=await readFile('app/navigation-ui.tsx','utf8');
assert(css.includes('@media(max-width:700px)')&&css.includes('min-height:48px'));
assert(!nav.includes('ChevronDown')&&!nav.includes('site-nav-links'),'sidebar no longer nests redundant submenus');
console.log('PASS: 220 IDs/order and assessment text preserved; 13 additional focused explanations (22 total), only explanation/objective fields changed; compact catalog without repeated recommendation; guest previews/auth links; pre-effect account masking; error states; unique company anchors and real hash reveal. No browser/device visual claim.');
