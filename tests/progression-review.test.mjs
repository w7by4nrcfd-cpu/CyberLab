// Presentation tests against compiled components. No Production accounts or DB.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const dir=await mkdtemp(resolve('.sites-runtime/progression-review-'));
async function compile(entry,name){const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,external:['react','react/jsx-runtime','lucide-react'],plugins:[{name:'context',setup(build){build.onResolve({filter:/^@\/app\/shell$/},()=>({path:'shell',namespace:'context'}));build.onLoad({filter:/.*/,namespace:'context'},()=>({contents:'export function useProgress(){throw Error("A pure presentation component must not read account state")}',loader:'js'}))}}]});const file=join(dir,name+'.mjs');await writeFile(file,b.outputFiles[0].text);return import(pathToFileURL(file))}
try{
 const {achievementCatalog,achievementStates,levelPath}=await compile('lib/progression.ts','catalog');
 const {AchievementOverview,AchievementCard,AchievementPreview,LevelProgressPath,NextGoal}=await compile('app/progression/view.tsx','view');
 const values=Object.fromEntries(achievementCatalog.map(a=>[a.id,a.id==='investigator'?3:a.id==='offensive-foundations'?3:a.id==='level-milestone'?13:a.thresholds[0]]));
 const unlocks=achievementCatalog.map(a=>({id:a.id,tier:['investigator','offensive-foundations'].includes(a.id)?2:a.id==='level-milestone'?4:1,earnedAt:'2026-10-01T08:00:00Z',proof:[]}));
 const data={xp:2595,level:levelPath(2595),achievements:achievementStates(values,unlocks),goal:{title:'أكمل التحقيق الحالي',detail:'راجع الأدلة المحفوظة.',href:'/investigations/soc-SOC-002',action:'تابع التحقيق'},mastery:[],career:{id:'beginner',title:'بداية الرحلة',readiness:0,next:null},newUnlocks:[]};
 const render=(Component,props)=>renderToStaticMarkup(createElement(Component,props));
 const overview=render(AchievementOverview,{data});assert(overview.includes('حققت 9 من 9'));assert(overview.includes('6 مكتملة بجميع مراحلها'));assert(overview.includes('3 قابلة للتطوير'),'earned tiers must not imply all stages are complete');
 const investigator=data.achievements.find(a=>a.id==='investigator'),card=render(AchievementCard,{achievement:investigator});assert(card.includes('تم تحقيقه'));assert(card.includes('فضي'));assert(card.includes('3 من 6'));assert(card.includes('نحو المرحلة التالية'));assert(!card.includes('اكتملت جميع المراحل'));
 const finished=render(AchievementCard,{achievement:data.achievements.find(a=>a.id==='offensive-foundations')});assert(finished.includes('اكتملت جميع المراحل'));
 const one={...data,achievements:[investigator]},preview=render(AchievementPreview,{data:one});assert.equal((preview.match(/<h3>/g)||[]).length,1,'same earned/upcoming achievement appears once');assert(preview.includes('إنجازك القادم'));assert(preview.includes('المرحلة التالية'));
 const fresh={...data,xp:0,level:levelPath(0),achievements:achievementStates({},[])};const locked=render(AchievementCard,{achievement:fresh.achievements[0]});assert(locked.includes('لم يُحقق بعد'));assert(!locked.includes('محفوظ في سجلك'));assert(render(AchievementOverview,{data:fresh}).includes('حققت 0 من 9'));
 const path=render(LevelProgressPath,{xp:2595});assert(path.includes('195 من 200'));assert(path.includes('97.5%'));assert(path.includes('بقي 5 نقاط'));assert(path.includes('aria-valuenow="195"'));
 const goal=render(NextGoal,{data});assert.equal((goal.match(/primary-button/g)||[]).length,1);assert(goal.includes('href="/investigations/soc-SOC-002"'));assert(goal.includes('راجع الأدلة المحفوظة.'));
 console.log('PASS: compiled achievement overview distinguishes earned/fully completed/upgradable tiers; next achievement stays visible without duplicate cards; locked/earned copy and next-tier counters; preserved level values and one primary action. No browser or Production claim.');
}finally{await rm(dir,{recursive:true,force:true})}
