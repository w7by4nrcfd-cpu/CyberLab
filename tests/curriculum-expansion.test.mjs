import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry){const r=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'))}
const {lessons}=await load('lib/curriculum.ts'),{modulePlans,curated,appliedQuestions}=await load('lib/curriculum-expansion.ts'),{interactiveLabs}=await load('lib/interactive-labs.ts'),{missions}=await load('lib/missions.ts'),{bossMissions}=await load('lib/boss-missions.ts'),{gradeQuiz}=await load('lib/grading.ts');
assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
assert.equal(lessons.length,220,'The expansion must preserve existing lesson counts and identifiers.');
const ids=new Set(lessons.map(l=>l.id)),labIds=new Set(interactiveLabs.map(l=>l.id)),missionIds=new Set(missions.map(m=>m.id)),bossIds=new Set(bossMissions.map(m=>m.id));
for(const track of ['it','network','security','soc']){
 const rows=lessons.filter(l=>l.track===track),plans=modulePlans[track];assert.equal(plans.length,3);assert(rows.length>=12);
 for(const lesson of rows){assert(lesson.objectives?.length);assert(lesson.whyItMatters);assert(lesson.skills?.length);assert(lesson.estimatedTime>0);assert.equal(lesson.questions.length,3);for(const id of lesson.prerequisites||[])assert(ids.has(id),`Missing prerequisite ${id}`);for(const id of lesson.relatedLabs||[])assert(labIds.has(id),`Missing lab ${id}`);for(const id of lesson.relatedMissions||[])assert(missionIds.has(id),`Missing mission ${id}`);for(const id of lesson.relatedBossMissions||[])assert(bossIds.has(id),`Missing boss ${id}`)}
}
assert.equal(Object.keys(curated).length,12);
assert.equal(Object.keys(appliedQuestions).length,9);
const valid={
 'it-2':[1,[0,1],'RAM'],'it-12':[1,[0,1,2],'troubleshooting'],'network-5':[0,[0,1],'/24'],
 'network-8':[0,[0,1],'nslookup'],'network-9':[0,[0,1,2],'DHCP'],'security-1':[0,[0,1],'integrity'],
 'security-8':[0,[0,1],'Reply-To'],'soc-2':[0,[0,1,2],'auth logs'],'soc-7':[0,[0,1],'false positive']
};
for(const [id,answers] of Object.entries(valid)){
 assert.equal(gradeQuiz(id,answers).score,3,id);
 assert.equal(gradeQuiz(id,[2,[], 'unrelated']).passed,false,id);
 assert(!JSON.stringify(lessons.find(l=>l.id===id)?.questions).includes('"answer"'));
}
assert.equal(gradeQuiz('network-8',[0,[0,1],'  NSLOOKUP ']).score,3);
assert.throws(()=>gradeQuiz('security-8',[0,[0,0],'reply-to']));
console.log('PASS: four tracks, twelve coherent modules, 220 preserved IDs, all links and prerequisites valid, twelve guided lessons and nine applied assessments with correct, wrong and malformed submissions.');
