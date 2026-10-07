import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry){const r=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'))}
const {gradeQuiz,gradeLab}=await load('lib/grading.ts');
const {caesar,levelFor}=await load('lib/simulations.ts');
const {lessons,tracks}=await load('lib/curriculum.ts');
const {answerKey}=await load('lib/answer-key.ts');
const {appliedQuestions}=await load('lib/curriculum-expansion.ts');
const {deepPracticeQuestions}=await load('lib/deep-practice.ts');
const {challenges}=await load('lib/extra-labs.ts');
assert.equal(lessons.length,220);assert.equal(tracks.length,17);assert.equal(lessons.filter(l=>l.track==='python').length,20);assert.equal(lessons.filter(l=>l.project).length,2);
for(const l of lessons.filter(l=>answerKey[l.id]&&!deepPracticeQuestions[l.id])){const q=answerKey[l.id];assert.equal(q.length,3);assert.equal(gradeQuiz(l.id,q.map(x=>x.answer)).score,3);assert.equal(gradeQuiz(l.id,q.map(x=>(x.answer+1)%3)).passed,false);assert(!JSON.stringify(l.questions).includes('"answer"'));}
for(const input of [[],[-1,0,0],[0,0,9],['1',0,0],null])assert.throws(()=>gradeQuiz('py-1',input));
assert.throws(()=>gradeQuiz('missing',[0,0,0]));
assert.equal(gradeQuiz('py-1',[1,0,0]).passed,true);
assert.equal(gradeLab('caesar',{answer:' hello '}).passed,true);
assert.equal(gradeLab('caesar',{answer:'KHOOR'}).passed,false);
assert.equal(gradeLab('firewall',{ports:[443]}).passed,true);
assert.equal(gradeLab('firewall',{ports:[443,80]}).passed,false);
assert.equal(gradeLab('firewall',{ports:[443,443]}).passed,false);
assert.equal(gradeLab('phishing',{action:'verify',clue:'code'}).passed,true);
assert.equal(gradeLab('phishing',{action:'reply',clue:'code'}).passed,false);
for(const c of challenges){assert.equal(gradeLab(c.id,{answer:c.answer}).passed,true);assert.equal(gradeLab(c.id,{answer:(c.answer+1)%3}).passed,false)}
for(const l of lessons.filter(l=>l.terms&&!appliedQuestions[l.id]&&!deepPracticeQuestions[l.id])){const q=l.questions;const third=q[2].type==='multi'?[0,1]:q[2].type==='order'?[0,1,2]:q[2].type==='practical'?l.terms[0].en:0;assert.equal(gradeQuiz(l.id,[((Number(l.id.split('-').at(-1))-1)%3),Number(l.id.split('-').at(-1))%3,third]).score,3);assert.equal(gradeQuiz(l.id,[1,1,null]).passed,false)}
assert.equal(gradeQuiz('network-8',[0,[0,1],'NSLOOKUP']).score,3);
assert.equal(gradeQuiz('network-8',[1,[2,3],'ping']).passed,false);
assert.equal(gradeQuiz('soc-7',[0,[0,1],'false positive']).score,3);
assert.equal(gradeQuiz('security-8',[0,[0,1],'Reply-To']).score,3);
assert.throws(()=>gradeQuiz('network-8',[0,[0,0],'nslookup']));
assert.equal(caesar('Zz مرحبا 123',1),'Aa مرحبا 123');assert.equal(caesar('KHOOR',-3),'HELLO');
assert.deepEqual([0,199,200,1425].map(levelFor),[1,1,2,8]);
console.log('PASS: 220 lessons, 17 tracks, 14 labs; malformed answers; pass threshold; all labs; cipher wrap; levels; no client answer keys.');
