import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const output=await build({entryPoints:['lib/progress-evidence.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {progressEvidence}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const learning={activity:[],attempts:[]},data={achievements:[],mastery:[]},ids=new Set(['network-5','security-8']);
assert.deepEqual(progressEvidence([],learning,data,ids),{read:0,assessed:0,labs:0,missions:0,strong:[],review:[],emerging:[]});
const items=[{id:'network-5',kind:'quiz'},{id:'network-5',kind:'quiz'},{id:'unknown',kind:'quiz'},{id:'security-8',kind:'lab'}];
const activity=[{id:'network-5',completedAt:'2026-01-01',seconds:0},{id:'security-8',completedAt:null,seconds:30},{id:'security-8',completedAt:null,seconds:30},{id:'unknown',completedAt:'2026-01-01',seconds:60}];
const skills=[
 {id:'strong',mastery:82,samples:5,band:'Strong',xp:20},
 {id:'good',mastery:70,samples:2,band:'Proficient',xp:10},
 {id:'review',mastery:58,samples:3,band:'Developing',xp:500},
 {id:'early',mastery:60,samples:1,band:'New',xp:50},
 {id:'unassessed',mastery:null,samples:0,band:'New',xp:100},
 {id:'untouched',mastery:null,samples:0,band:'New',xp:0},
];
const full={mastery:skills,achievements:[{id:'labs',value:4},{id:'first-mission',value:3}]};
const before=JSON.stringify({items,activity,full});
const e=progressEvidence(items,{activity},full,ids);
assert.equal(e.read,1,'reading requires recorded time and a known lesson; quiz auto-completion is not reading evidence');
assert.equal(e.assessed,1,'assessment is separate from reading and duplicates do not inflate counts');
assert.equal(e.labs,4,'canonical server achievement counts include completed labs');
assert.equal(e.missions,3);
assert.deepEqual(e.strong.map(s=>s.id),['strong','good']);
assert.deepEqual(e.review.map(s=>s.id),['review'],'XP is not evidence of mastery');
assert.deepEqual(e.emerging.map(s=>s.id),['early','unassessed'],'one source stays provisional; untouched skills are not flagged');
assert.equal(JSON.stringify({items,activity,full}),before,'summary never mutates saved data or rewards');
assert.deepEqual(progressEvidence([],learning,data,ids).strong,[],'a different empty account has no inherited evidence');
console.log('PASS: reading/assessment separation, unique completions, canonical practical counts, evidence-based review, insufficient evidence and no mutation.');
const ui=await build({entryPoints:['app/progress/evidence.tsx'],bundle:true,platform:'node',format:'esm',jsx:'automatic',write:false,plugins:[{name:'render',setup(b){
 b.onResolve({filter:/^react\/jsx-runtime$/},()=>({path:pathToFileURL(require.resolve('react/jsx-runtime')).href,external:true}));
 b.onResolve({filter:/native-link$/},()=>({path:'link',namespace:'test'}));
 b.onLoad({filter:/.*/,namespace:'test'},()=>({loader:'jsx',contents:'export default function Link(props){return <a {...props}/>;}'}));
}}]});
const {default:LearningEvidence}=await import('data:text/javascript;base64,'+Buffer.from(ui.outputFiles[0].text).toString('base64'));
const blank=renderToStaticMarkup(createElement(LearningEvidence,{items:[],learning,data}));
assert(blank.includes('هذه نقطة البداية'));
assert(blank.includes('لا يعني إتقان كل المهارات'));
assert(blank.includes('تمارين الفهم الاختيارية لا تُحفظ'));
const populated=renderToStaticMarkup(createElement(LearningEvidence,{items,learning:{activity},data:full}));
assert(populated.includes('82% إتقان تقديري'));
assert(populated.includes('58% إتقان تقديري'));
assert(!populated.includes('60% إتقان'),'one-source estimates are not presented as reliable percentages');
assert(!populated.includes('هذه نقطة البداية'));
assert(populated.includes('href="/skills"')&&populated.includes('href="/history"'));
assert.equal((populated.match(/<dt>/g)||[]).length,4);
console.log('PASS: real summary rendering, empty account guidance, provisional evaluation labels and evidence/history links.');
