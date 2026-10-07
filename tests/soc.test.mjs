import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const loadModule=async file=>{const output=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'))};
const {socAlerts,socCases}=await loadModule('lib/soc-alerts.ts');
const {evaluateSoc,freshSocSession}=await loadModule('lib/soc-engine.ts');
const rubricAlert=socAlerts[0],rubricSession=freshSocSession();rubricSession.priority=rubricAlert.severity;rubricSession.verdict=rubricAlert.truth;rubricSession.response=rubricAlert.responses[0];rubricSession.collected=[...rubricAlert.requiredEvidence];rubricSession.usedTools=[rubricAlert.tools[0].id];
assert.equal(evaluateSoc(rubricAlert,rubricSession).score,76);
rubricSession.caseNote={observation:'تكرار محاولات الدخول على الحساب في دقائق متقاربة.',evidenceRefs:[rubricAlert.requiredEvidence[0]],assessment:'النجاح عقب الفشل يجعل الوصول غير المعتاد موضع تحقيق.',actionTaken:rubricAlert.responses[0],owner:'SOC Lead',nextStep:'التحقق من الجلسة وتنسيق الاحتواء مع مالك الحساب.'};
assert.equal(evaluateSoc(rubricAlert,rubricSession).score,100);
rubricSession.caseNote.actionTaken='dismiss';assert.equal(evaluateSoc(rubricAlert,rubricSession).score,96);
rubricSession.caseNote.evidenceRefs=['fabricated'];assert.equal(evaluateSoc(rubricAlert,rubricSession).score,92);
assert.equal(socAlerts.length,10);assert.equal(socAlerts.filter(a=>a.truth==='true_positive').length,5);assert.equal(socAlerts.filter(a=>a.truth==='false_positive').length,3);assert.equal(socAlerts.filter(a=>a.truth==='benign_suspicious').length,2);
const files=(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js'));
const modules=['index.js',...files.filter(f=>f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const directory=await mkdtemp(join(tmpdir(),'cyberlab-soc-'));
const options={modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:directory,cf:false};
const user='soc-learner';let worker;
async function call(path,body,identity=user){const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(identity){headers['oai-authenticated-user-id']=identity;headers['oai-authenticated-user-email']=identity+'@example.test'}const r=await worker.dispatchFetch('http://local.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
const url=id=>'/api/soc/alerts/'+id;
const action=async(id,kind,extra={})=>{const r=await call(url(id),{action:kind,...extra});assert.equal(r.status,200,JSON.stringify(r.data));return r.data};
async function solve(a,{early=false,wrong=false}={}){
 await action(a.id,'start');await action(a.id,'triage',{priority:a.severity,reason:'فحص أولوية التنبيه من سياق المستخدم والجهاز.'});
 const evidence=a.requiredEvidence.map(id=>a.evidence.find(e=>e.id===id));
 if(early){await action(a.id,'inspect',{evidenceId:evidence[0].id});await action(a.id,'decide',{verdict:wrong?'false_positive':a.truth,conclusion:'الفرضية الأولية تحتاج إلى مقارنة عدة مؤشرات قبل الحكم النهائي.'})}
 for(const e of evidence){await action(a.id,'inspect',{evidenceId:e.id});await action(a.id,'collect',{evidenceId:e.id})}
 const tool=a.tools[0];await action(a.id,'tool',{toolId:tool.id});
 if(!early)await action(a.id,'decide',{verdict:wrong?'false_positive':a.truth,conclusion:'قارنت سجل التنبيه بالزمن والجهاز ومصدر النشاط ودوّنت المؤشرات المهمة.'});
 await action(a.id,'respond',{response:wrong?'dismiss':a.responses[0],reason:'هذا الإجراء يوافق الأدلة التي جمعتها ودرجة تأثير النشاط على البيئة.'});
 const documented=await action(a.id,'document',{caseNote:{observation:'سجلت أحداثًا متزامنة على الجهاز وحساب المستخدم خلال فترة التنبيه.',evidenceRefs:evidence.map(e=>e.id),assessment:'القرائن تتفق مع تصنيف التنبيه مع مراجعة بدائل النشاط المشروع.',actionTaken:wrong?'dismiss':a.responses[0],owner:'SOC Lead',nextStep:'متابعة سجلات المضيف والتحقق من أثر الإجراء خلال المناوبة.'}});assert.equal(documented.state.session.caseNote.evidenceRefs.length,evidence.length);const r=await action(a.id,'close');assert(r.state.closedAt);assert.equal(r.state.session.lastResult.documentation.missing.length,0);return r;
}
try{
 worker=new Miniflare(options);const db=await worker.getD1Database('DB');
 for(const migration of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+migration,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
 assert.equal((await call('/api/soc',undefined,null)).status,401);assert.equal((await call(url('SOC-001'),undefined,null)).status,401);
 assert.equal((await call(url('UNKNOWN'))).status,404);assert.equal((await call('/api/soc/cases/case-layla')).status,404);
 let queue=(await call('/api/soc')).data;assert.equal(queue.stats.newAlerts,10);assert.equal(queue.stats.progress,0);assert.equal(queue.cases.length,0);
 const initial=(await call(url('SOC-001'))).data;assert.equal(initial.state,null);assert(!('truth' in initial.alert));assert(initial.alert.evidence.every(e=>e.content===null));
 await action('SOC-001','start');const premature=await call(url('SOC-001'),{action:'collect',evidenceId:'auth'});assert.equal(premature.status,400); // uninspected evidence blocked
 const note=await call(url('SOC-001'),{action:'note',content:'تحقق من ترابط محاولات الدخول وغياب الاختبار المصرح به.'});assert.equal(note.status,200);assert.equal(note.data.notes.length,1);
 // Complete a high severity true positive and create its case.
 const first=await solve(socAlerts[0]);assert.equal(first.state.status,'Escalated');assert.equal(first.state.score,100);assert(first.newSkillAward);assert.equal(first.state.session.lastResult.skillAwardGranted,true);assert.equal(first.caseId,'case-admin');
 let caseFile=(await call('/api/soc/cases/case-admin')).data;assert.equal(caseFile.alerts.length,1);assert(caseFile.evidence.length>=2);assert.deepEqual(caseFile.affectedUsers,['admin']);
 let caseNote=await call('/api/soc/cases/case-admin',{action:'note',content:'تحتاج القضية متابعة مصدر المحاولات وتدقيق حساب admin.'});assert.equal(caseNote.status,200);assert.equal(caseNote.data.notes.length,1);
 const closedCase=await call('/api/soc/cases/case-admin',{action:'close',conclusion:'محاولات غير مصرح بها على admin من مصدر واحد. أُحيلت للمراجعة وقُيد المصدر تجريبيًا.'});assert.equal(closedCase.status,200);assert.equal(closedCase.data.case.status,'Resolved');
 // Approved change is a false positive. There must be no case or false skill award for wrong closure.
 const falseAlert=await solve(socAlerts.find(a=>a.id==='SOC-007'));assert.equal(falseAlert.state.status,'False Positive');assert.equal(falseAlert.state.score,100);assert.equal(falseAlert.caseId,null);assert(falseAlert.newSkillAward);
 const benign=await solve(socAlerts.find(a=>a.id==='SOC-003'));assert.equal(benign.state.status,'Resolved');assert.equal(benign.state.score,100);assert.equal(benign.caseId,null);
 for(const a of socAlerts.filter(a=>!['SOC-001','SOC-003','SOC-007'].includes(a.id))){const r=await solve(a);assert.equal(r.state.score,100,a.id);assert.equal(r.state.status,a.truth==='false_positive'?'False Positive':a.truth==='benign_suspicious'?'Resolved':a.responses[0]==='escalate'?'Escalated':'Resolved');}
 queue=(await call('/api/soc')).data;assert.equal(queue.stats.progress,100);assert.equal(queue.stats.newAlerts,0);assert.equal(queue.cases.length,socCases.length);
 caseFile=(await call('/api/soc/cases/case-layla')).data;assert.deepEqual(caseFile.alerts.map(a=>a.id).sort(),['SOC-002','SOC-006']);assert(caseFile.evidence.length>=4);
 caseFile=(await call('/api/soc/cases/case-midnight')).data;assert.deepEqual(caseFile.alerts.map(a=>a.id).sort(),['SOC-004','SOC-005']);
 const xpBefore=(await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0);assert.equal(xpBefore,0);
 let skills=(await call('/api/skills')).data.skills;const skillXp=Object.fromEntries(skills.map(s=>[s.id,s.xp]));assert(skillXp.logs>0&&skillXp.incident>0&&skillXp.phishing>0);assert(skills.find(s=>s.id==='logs').contributions.some(c=>c.kind==='soc'&&c.id==='SOC-001'));
 // Replay preserves prior best score, one-time skills, evidence in linked case, and notes.
 await action('SOC-001','reopen');const active=(await call(url('SOC-001'))).data;assert.equal(active.state.status,'Investigating');assert.equal(active.state.bestScore,100);assert.equal(active.notes.length,1);
 assert.equal((await call(url('SOC-001'),{action:'close'})).status,400);
 const worse=await solve(socAlerts[0],{early:true,wrong:true});assert(worse.state.score<70);assert.equal(worse.newSkillAward,false);assert.equal(worse.state.bestScore,100);assert.equal(worse.state.status,'False Positive');
 caseFile=(await call('/api/soc/cases/case-admin')).data;assert.equal(caseFile.case.status,'Resolved');assert(caseFile.evidence.length>=2);
 await action('SOC-001','reopen');const improved=await solve(socAlerts[0]);assert.equal(improved.newSkillAward,false);assert.equal(improved.state.session.lastResult.skillAwardGranted,false);assert.equal((await call('/api/soc/cases/case-admin')).data.case.status,'Resolved');
 skills=(await call('/api/skills')).data.skills;for(const skill of skills)assert.equal(skill.xp,skillXp[skill.id],skill.id);assert.equal((await call('/api/progress')).data.items.reduce((s,i)=>s+i.xp,0),xpBefore);
 assert.equal((await call('/api/soc',undefined,'other-user')).data.stats.progress,0);assert.equal((await call(url('SOC-001'),undefined,'other-user')).data.notes.length,0);
 await worker.dispose();worker=new Miniflare(options);
 queue=(await call('/api/soc')).data;assert.equal(queue.stats.progress,100);assert.equal((await call(url('SOC-001'))).data.notes.length,1);assert.equal((await call('/api/soc/cases/case-admin')).data.case.finalConclusion,closedCase.data.case.finalConclusion);
 assert.equal((await call('/api/campaigns/first-signal')).data.progress,0);assert.equal((await call('/api/learning')).status,200);
 console.log('PASS: ten SOC alerts across true/false/benign, evidence/tools/triage/decision/response, D1 notes, structured case rubric, multi-alert cases, close/reopen/refresh, scoring, one-time Skill XP, general XP and campaign regression, auth and account isolation.');
}finally{if(worker)await worker.dispose();await rm(directory,{recursive:true,force:true})}
