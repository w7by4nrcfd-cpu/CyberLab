import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry,interactive=false){
 const built=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',external:['react/jsx-runtime'],plugins:interactive?[{name:'practice-hooks',setup(b){
  b.onResolve({filter:/^(react|@\/components\/ui\/radio-group)$/},a=>({path:a.path,namespace:'practice-test'}));
  b.onLoad({filter:/.*/,namespace:'practice-test'},a=>({loader:'js',contents:a.path==='react'?'export const useState=v=>globalThis.practiceHooks(v);':"export const RadioGroup='radio-root',RadioGroupItem='radio-item';"}));
 }}]:[]});
 const code=built.outputFiles[0].text.replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
const {default:PracticeCheck}=await load('components/practice-check.tsx',true);
const {networkConceptCheck,networkIndependentCheck,emailConceptChecks,emailIndependentCheck}=await load('lib/practice-checks.ts');
const all=[networkConceptCheck,networkIndependentCheck,...Object.values(emailConceptChecks),emailIndependentCheck];
assert.equal(new Set(all.map(c=>c.id)).size,6);
let calls=0;const originalFetch=globalThis.fetch;
globalThis.fetch=()=>{calls++;throw Error('Optional check must not submit progress');};
function nodes(value){if(!value)return [];if(Array.isArray(value))return value.flatMap(nodes);if(typeof value!=='object')return [];return [value,...nodes(value.props?.children)];}
function text(value){if(!value)return '';if(Array.isArray(value))return value.map(text).join(' ');if(typeof value==='string')return value;return text(value.props?.children)||(value.props?.text||'');}
try{
 for(const scenario of all){
  assert(scenario.facts.length>20&&scenario.prompt.length>10);
  const right=scenario.choices.findIndex(c=>c.correct),wrong=scenario.choices.findIndex(c=>!c.correct);
  assert.equal(scenario.choices.filter(c=>c.correct).length,1);
  assert(scenario.choices.every(c=>c.feedback.length>40));
  const state=[];let cursor,tree;
  globalThis.practiceHooks=v=>{const i=cursor++;if(!(i in state))state[i]=typeof v==='function'?v():v;return [state[i],x=>{state[i]=typeof x==='function'?x(state[i]):x;}];};
  const render=()=>{cursor=0;tree=PracticeCheck({scenario});};
  const find=predicate=>nodes(tree).find(predicate);
  const select=i=>{find(n=>n.type==='radio-root').props.onValueChange(String(i));render();};
  const submit=()=>{const b=find(n=>n.type==='button');assert(!b.props.disabled);b.props.onClick();render();};
  render();assert(find(n=>n.type==='button').props.disabled);assert(!find(n=>n.props?.role==='status'));
  select(wrong);assert(!find(n=>n.props?.role==='status'),'selection must not reveal answer');submit();
  assert(text(find(n=>n.props?.role==='status')).includes(scenario.choices[wrong].feedback));
  assert(!text(tree).includes(scenario.choices[right].feedback),'wrong answer must not reveal the other choice feedback');
  select(right);assert(!find(n=>n.props?.role==='status'),'retry clears prior result');submit();
  assert(text(find(n=>n.props?.role==='status')).includes(scenario.choices[right].feedback));assert(find(n=>n.type==='button').props.disabled);
 }
 assert.equal(calls,0);
}finally{globalThis.fetch=originalFetch;delete globalThis.practiceHooks;}
console.log('PASS: six distinct optional cases, no premature answer disclosure, wrong and correct explanations, retry clearing, no progress/reward API calls.');
