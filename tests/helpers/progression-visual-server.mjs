// Development-only visual harness. Not imported by app/ or packaged in Worker.
// Synthetic identities and disposable local D1; never uses Production OAuth/D1.
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {tmpdir} from 'node:os';
process.chdir(fileURLToPath(new URL('../../',import.meta.url)));
const portArg=process.argv.indexOf('--port'),port=portArg<0?4174:Number(process.argv[portArg+1]);
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(wranglerRequire.resolve('miniflare'));
const dir=await mkdtemp(join(tmpdir(),'cyberlab-expansion-visual-'));
const modules=['index.js',...(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:'dist/server/'+f}));
const worker=new Miniflare({modules,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:dir,cf:false});
const db=await worker.getD1Database('DB');for(const f of (await readdir('drizzle')).filter(f=>/^\d{4}.*\.sql$/.test(f)).sort())for(const sql of (await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql.trim()).run();
const now='2026-09-24T12:00:00Z';
await db.prepare("INSERT INTO soc_investigations(user_id,alert_id,status,started_at,updated_at,closed_at,session_json) VALUES('qa-existing','SOC-002','Closed',?,?,?,?)").bind(now,now,now,JSON.stringify({priority:'Critical',triageReason:'فحص جلسة غير معتادة من مصدرين.',inspected:['sessions','device'],collected:['sessions','device'],usedTools:['fixture-correlation'],transcript:[],verdict:'true_positive',conclusion:'الحساب والجهاز والتوقيت تدعم استجابة موثقة.',response:'contain',responseReason:'احتواء الجلسة مع حفظ الأدلة.',prematureDecisions:0,timeline:[],lastResult:{correct:true,score:100,skillAwardEligible:true,feedback:['تصنيف محفوظ ومتسق مع الأدلة في حساب الاختبار.'],missingEvidence:[],classificationCorrect:true,responseCorrect:true,priorityCorrect:true}})).run();
await db.prepare("INSERT INTO progress(user_id,item_id,kind,score,xp,completed_at) VALUES('qa-existing','boss:boss-002','boss',100,340,?)").bind(now).run();
await db.prepare("INSERT INTO investigation_workspaces(user_id,investigation_id,status,created_at,updated_at) VALUES('qa-existing','soc-SOC-002','closed',?,?)").bind(now,now).run();
// Rich synthetic progression fixture; all writes are confined to this disposable local DB.
await db.prepare("INSERT INTO progress VALUES('qa-existing','mission:003','mission',100,2255,?)").bind(now).run();
await db.prepare("INSERT INTO mission_progress(user_id,mission_id,started_at,updated_at,completed_at,score) VALUES('qa-existing','003',?,?,?,100)").bind(now,now,now).run();
for(const id of ['v2-attack-surface','v2-access-control','v2-auth-session'])await db.prepare("INSERT INTO interactive_lab_progress(user_id,lab_id,started_at,updated_at,completed_at,best_score) VALUES('qa-existing',?,?,?,?,100)").bind(id,now,now,now).run();
await db.prepare("INSERT INTO skill_progress VALUES('qa-existing','cybersecurity',425,3,12,?)").bind(now).run();
await db.prepare("INSERT INTO career_promotions VALUES('qa-existing','foundation','cybersecurity-trainee',?,'[]')").bind(now).run();
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const b=await build({entryPoints:['lib/incident-chain-definition.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {composeResponseIncident}=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
let prior;for(let stage=0;stage<3;stage++){
 const i=composeResponseIncident(stage,17,prior,prior?{hypothesis:prior.board.expected.hypothesis,action:prior.board.expected.actions[0],affected:prior.board.expected.affected,evidenceIds:prior.board.expected.requiredEvidenceIds}:undefined),decision={hypothesis:i.board.expected.hypothesis,action:i.board.expected.actions[0],affected:i.board.expected.affected,evidenceIds:i.board.expected.requiredEvidenceIds};
 await db.prepare('INSERT INTO dynamic_incidents VALUES(?,?,?,?,?,?,?,?)').bind('qa-existing',i.instanceId,i.templateId,stage+1,i.seed,i.difficulty,JSON.stringify(i),now).run();
 await db.prepare('INSERT INTO investigation_workspaces VALUES(?,?,?,?,?,?,?)').bind('qa-existing',i.board.id,'closed',JSON.stringify(decision),now,now,now).run();
 for(const id of decision.evidenceIds)await db.prepare('INSERT INTO investigation_evidence(user_id,investigation_id,evidence_id,reviewed_at,collected_at) VALUES(?,?,?,?,?)').bind('qa-existing',i.board.id,id,now,now).run();
 for(const l of i.board.expected.requiredLinks)await db.prepare('INSERT INTO investigation_links VALUES(?,?,?,?,?,?,?)').bind('qa-existing',i.board.id,l.fromId,l.relation,l.toId,'علاقة موثقة بالأدلة في المحاكاة المحلية.',now).run();prior=i;
}

// Reproducible Dynamic Incidents v2 fixtures; disposable local D1 only.
const dynamicBundle=await build({entryPoints:['lib/dynamic-incidents.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {generateIncident}=await import('data:text/javascript;base64,'+Buffer.from(dynamicBundle.outputFiles[0].text).toString('base64'));
for(const [template,seed] of [['endpoint',1073751124],['endpoint',1073778652],['network-auth',1073806180]]){
 const i=generateIncident(template,seed,undefined,2);
 await db.prepare('INSERT INTO dynamic_incidents VALUES(?,?,?,?,?,?,?,?)').bind('qa-existing',i.instanceId,i.templateId,10+seed%10,i.seed,i.difficulty,JSON.stringify(i),now).run();
}

const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,`http://terminal.local:${port}`);
 if(url.pathname.startsWith('/_next/')||url.pathname==='/favicon.ico'){
  const asset=resolve('dist/client','.'+decodeURIComponent(url.pathname)),root=resolve('dist/client');if(!asset.startsWith(root+'/'))throw Error('Invalid asset path');
  try{const data=await readFile(asset);res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.ico':'image/x-icon'})[extname(asset)]||'application/octet-stream');res.end(data)}catch{res.writeHead(404);res.end('Asset not found')}return;
 }
 if(url.pathname==='/__qa'){
  const account=url.searchParams.get('account')==='zero'?'zero':'existing',width=Number(url.searchParams.get('w')||1280);if(![375,390,402,430,1280].includes(width))throw Error('Unsupported QA viewport');
  const path=url.searchParams.get('path')||'/experience/nexacorp-response';if(!path.startsWith('/')||path.startsWith('//')||/[<>"'\\]/.test(path))throw Error('Invalid local QA path');
  res.setHeader('Set-Cookie',`qa_account=${account}; Path=/; SameSite=Lax`);res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local visual QA · ${width}px</title><style>body{margin:0;background:#242a2b;color:white;font:16px Arial}header{padding:8px}iframe{display:block;border:0;width:${width}px;height:844px;background:#07100d}a{color:#9ee8bf;margin:8px}</style></head><body><header>LOCAL ONLY · synthetic ${account} · ${width}px ${[375,390,402,430,1280].map(w=>`<a href="/__qa?account=${account}&w=${w}&path=${encodeURIComponent(path)}">${w}px</a>`).join('')}</header><iframe title="Local QA viewport" src="${path.replaceAll('&','&amp;')}"></iframe></body></html>`);return;
 }
 const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(','):v);
 const user=String(req.headers.cookie||'').includes('qa_account=zero')?'qa-zero':'qa-existing';
 // Trusted headers simulate the platform boundary in this local test only.
 headers.set('oai-authenticated-user-id',user);headers.set('oai-authenticated-user-email',user+'@example.test');headers.set('oai-authenticated-user-full-name',user);
 const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=chunks.length?Buffer.concat(chunks):undefined;
 const r=await worker.dispatchFetch(url.href,{method:req.method,headers,body});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));
 }catch(e){console.error('Local visual harness failed',e);res.writeHead(500);res.end('Local QA error')}});
server.listen(port,'0.0.0.0',()=>console.log(`Local visual QA: http://terminal.local:${port}/__qa?account=existing&w=390`));
async function stop(){server.close();await worker.dispose();await rm(dir,{recursive:true,force:true});process.exit(0)}process.on('SIGTERM',stop);process.on('SIGINT',stop);
