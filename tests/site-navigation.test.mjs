import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,stat} from 'node:fs/promises';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry){const bundle=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'))}
const {navigationGroups,crumbsForPath,groupForPath}=await load('lib/site-navigation.ts');
const {searchResults,searchSite}=await load('lib/site-search.ts');
const {groupByDisplayState}=await load('lib/display-state.ts');
assert.deepEqual(navigationGroups.map(g=>g.id),['learn','practice','operations','progress','profile']);
assert.equal(new Set(navigationGroups.map(g=>g.href)).size,5);
assert.equal(groupForPath('/profile'),'profile');
assert.equal(groupForPath('/profile#ranks'),'profile');
for(const [path,group] of [['/tracks/network','learn'],['/learn/net-1','learn'],['/labs/v2/v2-network','practice'],['/missions/001','practice'],['/bosses/boss-001','practice'],['/operations/nexacorp','operations'],['/soc/alerts/SOC-001','operations'],['/campaigns/first-signal','operations'],['/skills','progress'],['/career','progress'],['/history','profile']])assert.equal(groupForPath(path),group,path);
const lesson=crumbsForPath('/learn/net-1');assert(lesson.length>=4);assert(lesson[1].href==='/tracks/network');assert(lesson.at(-1).label!=='الدرس');assert(lesson[2].href.includes('#module-'));
assert.equal(crumbsForPath('/soc/alerts/SOC-001')[1].href,'/soc');
assert.equal(crumbsForPath('/labs/v2/v2-network')[1].href,'/labs');
assert(searchSite('DNS').some(r=>r.href.startsWith('/learn/')));
assert(searchSite('SOC').some(r=>r.href==='/soc'));
assert(searchSite('NexaCorp').some(r=>r.href==='/operations/nexacorp'));
assert(searchSite('رتبة').some(r=>r.href==='/profile#ranks'));
const nat=searchSite('NAT');
assert(nat.some(r=>r.href==='/learn/network-10'));
assert(nat.some(r=>r.href==='/labs/v2/v2-network'&&r.relatedTo));
assert(nat.some(r=>r.href==='/bosses/boss-001'&&r.relatedTo));
assert(!nat.some(r=>r.href==='/missions/002'&&r.relatedTo));
assert(!nat.some(r=>r.href.startsWith('/soc/alerts/')&&r.relatedTo==='طبقات الاتصال وترجمة العناوين NAT'));
const groups=groupByDisplayState([{id:'complete'},{id:'started'},{id:'new'}],[{id:'complete',completedAt:'2026-01-01',session:{replaying:true}},{id:'started',completedAt:null}]);
assert.deepEqual(groups.completed.map(x=>x.id),['complete']);
assert.deepEqual(groups.active.map(x=>x.id),['started']);
assert.deepEqual(groups.available.map(x=>x.id),['new']);
assert(searchSite('   ').length===0);
for(const entry of [...navigationGroups.flatMap(g=>[{href:g.href},...g.items]),...searchResults]){
 const pathname=entry.href.split(/[?#]/)[0],parts=pathname.split('/').filter(Boolean);
 const route=parts.map((part,index)=>index===0?part:(['tracks','paths','learn','labs','missions','bosses','campaigns','alerts','cases'].includes(parts[index-1])?'[id]':part));
 const paths=['app/'+parts.join('/')+'/page.tsx','app/'+route.join('/')+'/page.tsx','app/'+parts.slice(0,2).join('/')+'/[id]/page.tsx'];
 assert(await Promise.any(paths.map(async p=>{await stat(p);return true})).catch(()=>false),`missing route for ${entry.href}`);
}
const trackSource=await readFile('app/tracks/[id]/view.tsx','utf8');assert(trackSource.includes("id={'module-'+level+'-'+moduleIndex}"));
console.log('PASS: five navigation groups, deep breadcrumbs and module anchor, unified content search, and every destination resolves to a route.');
