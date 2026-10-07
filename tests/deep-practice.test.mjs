import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry){const r=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'))}
const {lessons}=await load('lib/curriculum.ts'),{gradeQuiz}=await load('lib/grading.ts');
const {deepPractice,deepPracticeQuestions}=await load('lib/deep-practice.ts');
const {interactiveLabs}=await load('lib/interactive-labs.ts'),{missions}=await load('lib/missions.ts'),{bossMissions}=await load('lib/boss-missions.ts'),{socAlerts}=await load('lib/soc-alerts.ts');
const labIds=new Set(interactiveLabs.map(x=>x.id)),missionIds=new Set(missions.map(x=>x.id)),bossIds=new Set(bossMissions.map(x=>x.id)),alertIds=new Set(socAlerts.map(x=>x.id));
const expected={
 'it-10':'pid','it-11':'READ','net-3':'udp','network-7':'Default Gateway','network-10':'PAT',
 'security-9':'host isolation','sec-4':'salt','soc-3':'parent process','soc-4':'NetFlow',
 'response-6':'containment','soc-12':'SOC-005'
};
assert.equal(lessons.length,220,'No new IDs or lessons were added.');
assert.equal(new Set(lessons.map(l=>l.id)).size,220);
assert.deepEqual(Object.keys(deepPractice).sort(),Object.keys(expected).sort());
assert.deepEqual(Object.keys(deepPracticeQuestions).sort(),Object.keys(expected).sort());
for(const [id,practical] of Object.entries(expected)){
 const lesson=lessons.find(x=>x.id===id);assert(lesson,`${id}: original ID still exists`);
 assert(lesson.objectives?.length&&lesson.whyItMatters&&lesson.independent&&lesson.interaction,`${id}: complete learning sequence`);
 assert(lesson.sections.length>=2&&lesson.takeaways?.length>=2&&lesson.minutes>=15);
 assert.equal(lesson.questions[0].type,'scenario');assert.equal(lesson.questions[1].type,'multi');assert.equal(lesson.questions[2].type,'practical');
 assert(lesson.relatedLabs?.length||lesson.relatedMissions?.length||lesson.relatedBossMissions?.length||lesson.relatedAlerts?.length);
 for(const linked of lesson.relatedLabs||[])assert(labIds.has(linked),`${id}: lab ${linked}`);
 for(const linked of lesson.relatedMissions||[])assert(missionIds.has(linked),`${id}: mission ${linked}`);
 for(const linked of lesson.relatedBossMissions||[])assert(bossIds.has(linked),`${id}: boss ${linked}`);
 for(const linked of lesson.relatedAlerts||[])assert(alertIds.has(linked),`${id}: alert ${linked}`);
 const valid=gradeQuiz(id,[0,[0,1],`  ${practical}  `]);assert.equal(valid.score,3,id);
 const invalid=gradeQuiz(id,[1,[2,3],'unrelated']);assert.equal(invalid.score,0,id);assert.equal(invalid.passed,false,id);
 const memorized=gradeQuiz(id,[1,[0,1],practical]);assert.equal(memorized.score,2,id);assert.equal(memorized.passed,false,`${id}: independent decision is mandatory`);
 assert(valid.feedback.every(f=>f.explanation.length>25),`${id}: explanatory feedback`);
 assert(invalid.feedback.every(f=>f.explanation.length>25),`${id}: feedback on wrong choices`);
 assert(!JSON.stringify(lesson.questions).includes('"answer"'),`${id}: answer key not exposed to client`);
 assert.throws(()=>gradeQuiz(id,[0,[0,0],practical]),`${id}: duplicate evidence is invalid`);
 assert.throws(()=>gradeQuiz(id,[0,[0,1],'']),`${id}: empty explanation is invalid`);
}
assert.equal(gradeQuiz('sec-4',[0,[0,1],'Salt']).score,3);
assert.equal(gradeQuiz('network-10',[0,[0,1],'nat overload']).score,3);
assert.equal(gradeQuiz('soc-12',[0,[0,1],'SOC 005']).score,3);
console.log('PASS: 11 existing lessons, guided and independent decisions, wrong/right/alias/malformed grading, detailed feedback, validated lab/mission/boss/SOC routes, 220 stable IDs.');
