import type {DynamicIncident} from './dynamic-incidents';
import {nexaCorp,resolveCompanyEntity} from './nexacorp';
import {validBoardDefinition,type BoardEvidence,type BoardNode,type BoardLink} from './investigation-board';
export type IncidentIntegrity={employeeId:string;accountId:string;deviceId:string;officeIp:string;departmentId:string;segmentId:string;serviceId:string;serverId:string;sourceIp:string;correlationId:string;verdict:'incident'|'approved'|'blocked';records:Record<string,Record<string,string>>};
const fail=()=>{throw Error('تعارض في بيانات الحادث.');};
const raw=(fields:Record<string,string>)=>Object.entries(fields).map(([k,v])=>`${k}=${v}`).join('\n');
const lk=(fromId:string,relation:BoardLink['relation'],toId:string):BoardLink=>({fromId,relation,toId});
/** Versioned extension of the existing generator; saved legacy snapshots remain untouched. */
export function applyIncidentVariation(incident:DynamicIncident):DynamicIncident{
 let x=(incident.seed^0xa53c9e17)>>>0;const roll=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};
 const employee=nexaCorp.employees.find(e=>e.id===incident.board.nodes.find(n=>n.kind==='employee')?.companyRef?.id)!;
 const account=nexaCorp.accounts.find(a=>a.id===employee.accountId)!,device=nexaCorp.devices.find(d=>d.id===employee.deviceIds[0])!,email=nexaCorp.emailIdentities.find(e=>e.id===employee.emailId)!;
 const n=roll(),verdict:IncidentIntegrity['verdict']=incident.templateId==='network-auth'?(n<.4?'incident':n<.8?'approved':'blocked'):(n<.5?'incident':'approved');
 const approved=verdict==='approved',external=`203.0.113.${20+Math.floor(roll()*180)}`,sourceIp=approved?device.ip!:external;
 const correlationId='EV-'+incident.seed.toString(16).padStart(8,'0'),base=Date.UTC(2026,8,25+Math.floor(roll()*3),8+Math.floor(roll()*8),Math.floor(roll()*60));
 const at=(offset:number)=>new Date(base+offset*60000).toISOString().replace('.000Z','Z');
 const nodes:BoardNode[]=[],evidence:BoardEvidence[]=[],records:IncidentIntegrity['records']={};
 const node=(kind:BoardNode['kind'],id:string,label=id,companyRef?:BoardNode['companyRef'])=>{const nid=kind+':'+id;if(!nodes.some(n=>n.id===nid))nodes.push({kind,id:nid,label,companyRef});return nid;};
 const actor=node('employee',employee.id,employee.name,{kind:'employee',id:employee.id}),acct=node('account',account.id,account.username,{kind:'account',id:account.id}),work=node('device',device.id,device.id,{kind:'device',id:device.id});
 node('ip',device.ip!);const source=node('ip',sourceIp);node('alert',incident.templateId,'تنبيه '+device.id);
 const common={account:account.username,device:device.id,office_ip:device.ip!,correlation_id:correlationId};
 const add=(id:string,type:BoardEvidence['type'],title:string,source:string,offset:number,fields:Record<string,string>,entities:string[],role:BoardEvidence['role']='supporting')=>{records[id]=fields;node('evidence',id,title);evidence.push({id,type,title,source,timestamp:at(offset),raw:raw(fields),entities,role});};
 let serviceId='identity',serverId='IDP-01',hypothesis='',objective='',explanation='',recheckObservation='',proof:BoardLink[]=[],affected=[acct];
 if(incident.templateId==='phishing'){
  serviceId='mail';serverId='MAIL-01';node('server',serverId,serverId,{kind:'device',id:serverId});const message=node('email','message','رسالة إلى '+email.address),browser=node('process','browser.exe');
  const domain=approved?'nexacorp.example':['identity-check.example','account-verify.example','review-alert.example'][Math.floor(roll()*3)],url='https://'+domain+'/portal';
  add('message','email','ترويسة الرسالة ومسارها',serverId,0,{...common,from:'NexaCorp <reports@'+domain+'>',return_path:'reports@'+domain,recipient:email.address,subject:'مراجعة الحساب',attachment:'none',message_id:correlationId,link:url},[acct,message]);
  add('browser','process','أثر تفاعل المتصفح',device.id,2,{...common,process:'browser.exe',message_id:correlationId,url},[work,browser,message]);
  add('auth','account','قبول جلسة الحساب','IDP-01',4,{...common,source_ip:sourceIp,result:'success',session_device:approved?device.id:'unregistered',identity_provider:approved?'NexaCorp-SSO':'unregistered',policy:approved?'approved-internal':'none'},[acct,source]);
  add('context','log','سجل الوجهات المعتمدة','IT Operations',-1,{approved_domain:'nexacorp.example',approved_provider:'NexaCorp-SSO',approved_device:device.id,approved_ip:device.ip!},[acct,work]);
  proof=[lk(acct,'RECEIVED',message),lk(acct,'OBSERVED_IN','evidence:auth'),lk(browser,'OBSERVED_IN','evidence:browser')];
  hypothesis=approved?'routine':'phishing';objective='اربط مصدر البريد بسجل الهوية، واستخدم أثر المتصفح للتحقق من تسلسل الحدث.';
  explanation=approved?'مسار البريد والوجهة ومزود الهوية والجهاز تطابق السجل المعتمد. التنبيه لا يثبت اختراقًا.':'مسار البريد والوجهة غير معتمدين، ثم قُبلت جلسة من مصدر وجهاز غير مسجلين بعد التفاعل. الترابط عبر المصادر يبرر الاحتواء.';
  recheckObservation='قارن مسار البريد والوجهة مع السجل المعتمد، ثم افحص مصدر الجلسة والجهاز الذي قُبلت منه. اختلاف اسم العرض وحده لا يحسم القضية.';
 }else if(incident.templateId==='endpoint'){
  serviceId=approved&&roll()<.5?'files':'portal';serverId=serviceId==='files'?'FILE-01':'WEB-01';const dest=approved?node('server',serverId,serverId,{kind:'device',id:serverId}):source;
  const parent=approved?'explorer.exe':['browser.exe','outlook.exe'][Math.floor(roll()*2)],child=['powershell.exe','wscript.exe','mshta.exe'][Math.floor(roll()*3)],pid=String(2000+Math.floor(roll()*7000)),file='artifact-'+(100+Math.floor(roll()*900))+'.dat';
  const parentNode=node('process',parent),processNode=node('process',child),fileNode=node('file',file);if(!approved)node('server',serverId,serverId,{kind:'device',id:serverId});
  add('process','process','سلسلة العملية والحساب',device.id,0,{...common,parent,process:child,pid,change:approved?'CHG-'+pid:'none'},[acct,work,parentNode,processNode]);
  add('file','file','بيانات الملف الناتج',device.id,2,{...common,process:child,pid,file,signature:approved?'NexaCorp-IT':'unsigned',artifact_id:correlationId},[acct,work,processNode,fileNode]);
  add('network','network','اتصال العملية بالوجهة','Network Events',4,{...common,process:child,pid,artifact_id:correlationId,destination:approved?serverId:sourceIp,port:serviceId==='files'?'445':'443',connection:'established'},[work,processNode,dest]);
  add('context','log','سجل التغيير المصرح','IT Operations',-1,{approved_parent:'explorer.exe',approved_destination:serverId,approved_signature:'NexaCorp-IT',approved_artifact:approved?correlationId:'different-artifact'},[work,'server:'+serverId]);
  proof=[lk(parentNode,'SPAWNED',processNode),lk(processNode,'CONNECTED_TO',dest),lk(processNode,'OBSERVED_IN','evidence:file')];affected=[acct,work];hypothesis=approved?'routine':'suspicious-endpoint';objective='اربط سلسلة العملية بالملف والاتصال، ثم تحقق من التغيير المعتمد قبل الحكم.';
  explanation=approved?'سلسلة العملية والملف والوجهة تطابق تغييرًا معتمدًا لنفس الأثر؛ اسم الأداة وحده ليس دليل اختراق.':'العملية أنشأت ملفًا غير موقع واتصلت بوجهة خارج التغيير المعتمد؛ تطابق معرف العملية والأثر يربط المصادر.';
  recheckObservation='قارن معرف العملية والأثر بين الملف والاتصال، ثم تحقق من توقيع الملف والوجهة في سجل التغيير. اسم العملية وحده لا يكفي.';
 }else{
  node('server',serverId,serverId,{kind:'device',id:serverId});
  add('login','account','نتيجة المصادقة','IDP-01',0,{...common,source_ip:sourceIp,failures:String(2+Math.floor(roll()*4)),success:verdict==='blocked'?'0':'1',result:verdict==='blocked'?'denied':'accepted',session_device:approved?device.id:'unregistered'},[acct,source,'server:'+serverId]);
  add('flow','network','حالة اتصال الهوية','Network Events',2,{...common,source_ip:sourceIp,destination:serverId,transport:'established',session:verdict==='blocked'?'denied':'accepted'},[acct,source,'server:'+serverId]);
  add('office','account','جلسة الجهاز المعروفة','IDP-01',-1,{...common,source_ip:device.ip!,recognized:'true'},[acct,work,'ip:'+device.ip!]);
  add('context','log','سياسة المصدر والجهاز','IT Operations',-2,{approved_source:device.ip!,approved_device:device.id,identity_result:verdict==='blocked'?'denied':'accepted'},[acct,work]);
  proof=[lk(acct,'OBSERVED_IN','evidence:login'),lk(source,'OBSERVED_IN','evidence:flow'),lk(acct,'USES',work)];hypothesis=approved?'routine':verdict==='blocked'?'blocked-retry':'suspicious-auth';objective='ميّز اتصال الشبكة عن نجاح المصادقة بربط نتيجة الهوية بسجل التدفق والجهاز المعروف.';
  explanation=approved?'مصدر الجلسة والجهاز يطابقان سياسة المصدر المعتمد. المحاولات السابقة لا تثبت اختراقًا.':verdict==='blocked'?'وصل اتصال الشبكة، لكن الهوية رفضت الجلسة ولم تسجل نجاحًا. لا يوجد دليل على جلسة مخترقة؛ وثّق المحاولة وراقبها.':'قُبلت جلسة من مصدر وجهاز غير معتمدين. تطابق الهوية والتدفق يثبت الحاجة إلى احتواء الحساب.';
  recheckObservation='افحص عدد النجاحات ونتيجة الجلسة في الهوية، ثم قارنها بحالة النقل في الشبكة. established لا يعني تسجيل دخول ناجحًا.';
 }
 const count=incident.difficulty==='beginner'?2:incident.difficulty==='intermediate'?3:4;
 const required=incident.templateId==='phishing'?['message','auth','browser','context']:incident.templateId==='endpoint'?['process','network','file','context']:['login','flow','office','context'];
 for(const e of evidence)if(required.slice(0,count).includes(e.id))e.role='required';
 node('server','WEB-01','WEB-01',{kind:'device',id:'WEB-01'});node('account','backup','backup',{kind:'account',id:'backup'});node('device','WKST-03','WKST-03',{kind:'device',id:'WKST-03'});node('ip','192.0.2.83');
 add('routine','log','سجل دوري للمقارنة','WEB-01',incident.difficulty==='advanced'?-30:1,{account:incident.difficulty==='advanced'?account.username:'backup',device:incident.difficulty==='advanced'?device.id:'WKST-03',office_ip:incident.difficulty==='advanced'?device.ip!:'192.0.2.83',correlation_id:'HEALTH-'+correlationId,event:'portal-health',result:'normal'},incident.difficulty==='advanced'?[acct,work,'server:WEB-01']:['account:backup','device:WKST-03','server:WEB-01'],'distractor');
 if(incident.difficulty!=='beginner')add('noise','network','حركة شبكة مستقلة','Network Events',3,{account:'backup',device:'WKST-03',office_ip:'192.0.2.83',correlation_id:'BACKUP-'+correlationId,destination:'WEB-01',result:'scheduled'},['account:backup','device:WKST-03','server:WEB-01'],'distractor');
 if(incident.difficulty==='advanced')add('identity-history','account','هوية الحساب والجهاز','Company Directory',-5,{...common,employee:employee.id,department:employee.departmentId,segment:device.segmentId!},[actor,acct,work]);
 for(let i=evidence.length-1;i>0;i--){const j=Math.floor(roll()*(i+1));[evidence[i],evidence[j]]=[evidence[j],evidence[i]];}
 const requiredLinks=proof.slice(0,incident.difficulty==='beginner'?2:3),actions=verdict==='incident'?['contain','escalate']:['monitor'];
 const hypotheses=[{id:incident.templateId==='phishing'?'phishing':incident.templateId==='endpoint'?'suspicious-endpoint':'suspicious-auth',label:'نشاط غير مصرح مثبت بالأدلة'},{id:'routine',label:'نشاط معتمد؛ التنبيه لا يثبت حادثًا'},...(incident.templateId==='network-auth'?[{id:'blocked-retry',label:'محاولة رُفضت دون جلسة ناجحة'}]:[]),{id:'unrelated',label:'المصادر غير مترابطة'}];
 const allowedLinks=[lk(actor,'USES',acct),lk(actor,'USES',work),...proof];for(const e of evidence)for(const id of e.entities){const n=nodes.find(n=>n.id===id);if(n&&n.kind!=='alert'&&n.kind!=='log'&&n.kind!=='evidence')allowedLinks.push(lk(id,'OBSERVED_IN','evidence:'+e.id));}
 const events=evidence.map(e=>({id:e.id,source:e.source,time:e.timestamp,summary:e.title})).sort((a,b)=>a.time.localeCompare(b.time));
 const result:DynamicIncident={...incident,brief:incident.templateId==='phishing'?`ظهر تنبيه بريد للحساب ${account.username}. افحص الرسالة ونشاط الهوية قبل القرار.`:incident.brief,generationVersion:2,objective,recheckObservation,affectedEntities:affected,evidence,events,timeline:events.map(e=>({time:e.time,summary:e.summary})),distractors:evidence.filter(e=>e.role==='distractor').map(e=>e.id),validConclusions:[hypothesis],recommendedActions:actions,guidance:incident.difficulty==='beginner'?'قارن مصدرين مستقلين، ثم طابق الحساب والتوقيت مع السياق المعتمد.':incident.difficulty==='intermediate'?'وثّق العلاقة بين الأحداث قبل اختيار نطاق الاستجابة.':'',successConditions:{requiredEvidenceIds:required.slice(0,count),requiredLinks},board:{...incident.board,subtitle:incident.templateId==='phishing'?`ظهر تنبيه بريد للحساب ${account.username}. افحص الرسالة ونشاط الهوية قبل القرار.`:incident.brief,nodes,evidence,hypotheses,expected:{hypothesis,actions,affected,requiredLinks,requiredEvidenceIds:required.slice(0,count)},allowedLinks},review:{explanation,evidence:Object.fromEntries(evidence.map(e=>[e.id,e.role==='distractor'?'حدث بمعرف أو توقيت مختلف؛ لا يثبت هذه القضية.':e.role==='required'?'مصدر لازم لربط الاستنتاج.':'سياق داعم للتحقق.'])),links:requiredLinks},integrity:{employeeId:employee.id,accountId:account.id,deviceId:device.id,officeIp:device.ip!,departmentId:employee.departmentId,segmentId:device.segmentId!,serviceId,serverId,sourceIp,correlationId,verdict,records}};
 assertIncidentIntegrity(result);return result;
}
/** Fail closed before saving or opening a v2 snapshot. Does not regenerate legacy data. */
export function assertIncidentIntegrity(i:DynamicIncident){
 if(i.generationVersion!==2)return;
 const m=i.integrity;if(!m)fail();const meta=m!;
 const employee=nexaCorp.employees.find(e=>e.id===meta.employeeId),device=nexaCorp.devices.find(d=>d.id===meta.deviceId),account=nexaCorp.accounts.find(a=>a.id===meta.accountId),service=nexaCorp.services.find(s=>s.id===meta.serviceId);
 if(!employee||!device||!account||employee.accountId!==account.id||account.employeeId!==employee.id||!employee.deviceIds.includes(device.id)||device.ip!==meta.officeIp||employee.departmentId!==device.departmentId||meta.departmentId!==employee.departmentId||meta.segmentId!==device.segmentId||!service||!(service.deviceIds as readonly string[]).includes(meta.serverId))fail();
 if(!validBoardDefinition(i.board)||!i.board.nodes.every(n=>!n.companyRef||resolveCompanyEntity(n.companyRef))||JSON.stringify(i.board.evidence)!==JSON.stringify(i.evidence))fail();
 if(!['incident','approved','blocked'].includes(meta.verdict)||meta.verdict==='blocked'&&i.templateId!=='network-auth'||meta.sourceIp!==(meta.verdict==='approved'?meta.officeIp:meta.sourceIp)||meta.verdict!=='approved'&&!/^203\.0\.113\.(?:[2-9]\d|1\d\d)$/.test(meta.sourceIp))fail();
 if(new Set(i.events.map(e=>e.id)).size!==i.evidence.length||i.events.length!==i.evidence.length||JSON.stringify(i.timeline)!==JSON.stringify(i.events.map(e=>({time:e.time,summary:e.summary}))))fail();
 let previous=-Infinity;for(const event of i.events){const t=Date.parse(event.time),e=i.evidence.find(e=>e.id===event.id);if(!Number.isFinite(t)||t<previous||!e||event.time!==e.timestamp||event.source!==e.source||event.summary!==e.title)fail();previous=t;}
 if(Object.keys(meta.records).length!==i.evidence.length)fail();for(const e of i.evidence){const r=meta.records[e.id];if(!r||e.raw!==raw(r))fail();if(e.role!=='distractor'&&r.account&&(r.account!==account!.username||r.device!==device!.id||r.office_ip!==device!.ip||r.correlation_id!==meta.correlationId))fail();if(e.role==='distractor'&&r.correlation_id===meta.correlationId)fail();}
 const r=meta.records,approved=meta.verdict==='approved';let hypothesis:string,proof:BoardLink[],affected=['account:'+account!.id];
 const time=(id:string)=>Date.parse(i.evidence.find(e=>e.id===id)?.timestamp||'');
 if(i.templateId==='phishing'){
  if(!r.message||!r.auth||!r.browser||!r.context)fail();const mail=nexaCorp.emailIdentities.find(e=>e.id===employee!.emailId)!;
  const domain=r.message.return_path?.split('@')[1];if(!domain||r.message.from!==`NexaCorp <reports@${domain}>`||r.message.recipient!==mail.address||r.message.link!==`https://${domain}/portal`||r.browser.url!==r.message.link||r.message.message_id!==meta.correlationId||r.browser.message_id!==meta.correlationId||r.auth.source_ip!==meta.sourceIp||r.auth.result!=='success'||!(time('message')<time('browser')&&time('browser')<time('auth')))fail();
  if((domain===r.context.approved_domain)!==approved||r.auth.session_device!==(approved?device!.id:'unregistered')||r.auth.identity_provider!==(approved?'NexaCorp-SSO':'unregistered')||r.auth.policy!==(approved?'approved-internal':'none')||r.context.approved_domain!=='nexacorp.example'||r.context.approved_provider!=='NexaCorp-SSO'||r.context.approved_device!==device!.id||r.context.approved_ip!==meta.officeIp)fail();
  hypothesis=approved?'routine':'phishing';proof=[lk(affected[0],'RECEIVED','email:message'),lk(affected[0],'OBSERVED_IN','evidence:auth'),lk('process:browser.exe','OBSERVED_IN','evidence:browser')];
 }else if(i.templateId==='endpoint'){
  if(!r.process||!r.network||!r.file||!r.context)fail();for(const e of [r.network,r.file])if(e.pid!==r.process.pid||e.process!==r.process.process)fail();
  if(r.file.artifact_id!==meta.correlationId||r.network.artifact_id!==meta.correlationId||!(time('process')<time('file')&&time('file')<time('network'))||r.network.destination!==(approved?meta.serverId:meta.sourceIp)||r.network.port!==(meta.serviceId==='files'?'445':'443'))fail();
  if(!nodesContainProcess(i,r.process.parent)||!nodesContainProcess(i,r.process.process)||r.process.parent!==(approved?'explorer.exe':r.process.parent)||!approved&&r.process.parent==='explorer.exe'||!['browser.exe','outlook.exe','explorer.exe'].includes(r.process.parent)||r.process.change!==(approved?'CHG-'+r.process.pid:'none')||r.file.signature!==(approved?'NexaCorp-IT':'unsigned')||r.context.approved_artifact!==(approved?meta.correlationId:'different-artifact')||r.context.approved_destination!==meta.serverId||r.context.approved_parent!=='explorer.exe'||r.context.approved_signature!=='NexaCorp-IT')fail();
  hypothesis=approved?'routine':'suspicious-endpoint';proof=[lk('process:'+r.process.parent,'SPAWNED','process:'+r.process.process),lk('process:'+r.process.process,'CONNECTED_TO',(approved?'server:':'ip:')+r.network.destination),lk('process:'+r.process.process,'OBSERVED_IN','evidence:file')];affected.push('device:'+device!.id);
 }else{
  if(!r.login||!r.flow||!r.office||!r.context)fail();const blocked=meta.verdict==='blocked';if(r.login.source_ip!==meta.sourceIp||r.flow.source_ip!==meta.sourceIp||r.office.source_ip!==meta.officeIp||r.context.approved_source!==meta.officeIp||r.context.approved_device!==device!.id||r.context.identity_result!==(blocked?'denied':'accepted')||r.flow.destination!==meta.serverId||r.login.success!==(blocked?'0':'1')||r.login.result!==(blocked?'denied':'accepted')||r.flow.session!==r.login.result||r.flow.transport!=='established'||r.login.session_device!==(approved?device!.id:'unregistered')||!(time('office')<time('login')&&time('login')<time('flow')))fail();
  hypothesis=approved?'routine':blocked?'blocked-retry':'suspicious-auth';proof=[lk(affected[0],'OBSERVED_IN','evidence:login'),lk('ip:'+meta.sourceIp,'OBSERVED_IN','evidence:flow'),lk(affected[0],'USES','device:'+device!.id)];
 }
 const ids=(i.templateId==='phishing'?['message','auth','browser','context']:i.templateId==='endpoint'?['process','network','file','context']:['login','flow','office','context']).slice(0,i.difficulty==='beginner'?2:i.difficulty==='intermediate'?3:4),actions=meta.verdict==='incident'?['contain','escalate']:['monitor'];
 if(JSON.stringify(i.successConditions.requiredEvidenceIds)!==JSON.stringify(ids)||JSON.stringify(i.board.expected.requiredEvidenceIds)!==JSON.stringify(ids)||ids.some(id=>!i.evidence.some(e=>e.id===id&&e.role==='required'))||new Set(ids.map(id=>i.evidence.find(e=>e.id===id)?.source)).size<2)fail();
 if(JSON.stringify(i.successConditions.requiredLinks)!==JSON.stringify(proof.slice(0,i.difficulty==='beginner'?2:3))||JSON.stringify(i.board.expected.requiredLinks)!==JSON.stringify(i.successConditions.requiredLinks)||JSON.stringify(i.affectedEntities)!==JSON.stringify(affected)||JSON.stringify(i.board.expected.affected)!==JSON.stringify(affected)||i.board.expected.hypothesis!==hypothesis||JSON.stringify(i.validConclusions)!==JSON.stringify([hypothesis])||JSON.stringify(i.recommendedActions)!==JSON.stringify(actions)||JSON.stringify(i.board.expected.actions)!==JSON.stringify(actions))fail();
 for(const l of i.successConditions.requiredLinks)if(!i.board.allowedLinks?.some(a=>JSON.stringify(a)===JSON.stringify(l)))fail();
}

function nodesContainProcess(i:DynamicIncident,name:string){return i.board.nodes.some(n=>n.kind==='process'&&n.id==='process:'+name&&n.label===name)}
