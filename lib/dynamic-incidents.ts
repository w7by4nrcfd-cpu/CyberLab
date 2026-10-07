import {applyIncidentVariation,type IncidentIntegrity} from './dynamic-variation';
import type {ChainContext} from './incident-chain';
import {nexaCorp,resolveCompanyEntity} from './nexacorp';
import {type BoardDefinition,type BoardEvidence,type BoardNode,type RelationshipType,validBoardDefinition} from './investigation-board';
import {difficulties,incidentTemplates,type Difficulty,type IncidentTemplateId} from './incident-catalog';
export {difficulties,incidentTemplates};
export type {Difficulty,IncidentTemplateId};

type Link={fromId:string;relation:RelationshipType;toId:string};
export type DynamicIncident= {generationVersion?:2;objective?:string;recheckObservation?:string;integrity?:IncidentIntegrity;chain?:ChainContext;templateId:IncidentTemplateId;instanceId:string;seed:number;difficulty:Difficulty;title:string;brief:string;guidance:string;affectedEntities:string[];timeline:{time:string;summary:string}[];events:{id:string;source:string;time:string;summary:string}[];evidence:BoardEvidence[];distractors:string[];successConditions:{requiredEvidenceIds:string[];requiredLinks:Link[]};validConclusions:string[];recommendedActions:string[];board:BoardDefinition;review:{explanation:string;evidence:Record<string,string>;links:Link[]}};
const subjects=['layla','sara','adam','maya'] as const;
const node=(kind:BoardNode['kind'],id:string,label:string,detail?:string,companyRef?:BoardNode['companyRef']):BoardNode=>({kind,id:`${kind}:${id}`,label,detail,companyRef});
const link=(fromId:string,relation:RelationshipType,toId:string):Link=>({fromId,relation,toId});
function random(seed:number){let x=(seed^0x9e3779b9)>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}};
export function difficultyFromSeed(seed:number):Difficulty{if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Seed غير صالح.');const tier=seed>>>30;if(tier>2)throw Error('درجة الصعوبة غير صالحة.');return difficulties[tier]}
export function makeIncidentSeed(difficulty:Difficulty){const tier=difficulties.indexOf(difficulty);if(tier<0)throw Error('درجة الصعوبة غير صالحة.');const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);return ((tier<<30)|(bytes[0]&0x3fffffff))>>>0}
export function generateIncident(templateId:IncidentTemplateId,seed:number,context?:{employeeId:string;remote:string;baseTime:string},generationVersion:1|2=1):DynamicIncident{
 const template=incidentTemplates.find(t=>t.id===templateId);if(!template)throw Error('القالب غير موجود.');
 const difficulty=difficultyFromSeed(seed),roll=random(seed),subject=subjects[Math.floor(roll()*subjects.length)];
 const employee=nexaCorp.employees.find(e=>e.id===(context?.employeeId||subject));if(!employee)throw Error('موظف الحادث غير موجود.');
 const account=nexaCorp.accounts.find(a=>a.id===employee.accountId)!;
 const email=nexaCorp.emailIdentities.find(e=>e.id===employee.emailId)!;
 const device=nexaCorp.devices.find(d=>d.id===employee.deviceIds[0])!;
 const generatedRemote=`203.0.113.${20+Math.floor(roll()*180)}`;const remote=context?.remote||generatedRemote; // RFC 5737 documentation range, never a real target.
 const minute=10+Math.floor(roll()*40),hour=9+Math.floor(roll()*6);
 const at=(offset:number)=>new Date((context?Date.parse(context.baseTime):Date.UTC(2026,8,24,hour,minute))+offset*60000).toISOString().replace('.000Z','Z');
 const base=[node('employee',employee.id,employee.name,employee.role,{kind:'employee',id:employee.id}),node('account',account.id,account.username,'حساب الشركة',{kind:'account',id:account.id}),node('device',device.id,device.id,device.description,{kind:'device',id:device.id}),node('ip',device.ip!,device.ip!,'عنوان جهاز الشركة في شبكة المكتب'),node('ip',remote,remote,'عنوان خارجي تمثيلي؛ ليس جهاز الشركة')];
 const actor=`employee:${employee.id}`,acct=`account:${account.id}`,workstation=`device:${device.id}`,external=`ip:${remote}`;
 const evidence:BoardEvidence[]=[],nodes=[...base];
 const add=(id:string,type:BoardEvidence['type'],title:string,source:string,time:string,raw:string,role:BoardEvidence['role'],entities:string[])=>{
  evidence.push({id,type,title,source,timestamp:time,raw,role,entities});nodes.push(node('evidence',id,id));
 };
 const links:Link[]=[link(actor,'USES',acct),link(actor,'USES',workstation)];let keyLinks:Link[]=[];
 let title='',brief='',explanation='',expectedHypothesis='',actions=['contain','escalate'],affected=[acct,workstation];
 if(templateId==='phishing'){
  const spoof=['identity-check.example','account-verify.example','review-alert.example'][Math.floor(roll()*3)];
  const file=`attachment-${1+Math.floor(roll()*4)}.html`;
  nodes.push(node('email','message',`رسالة إلى ${email.address}`),node('process','browser','browser.exe'),node('file',file,file),node('connection','session',`اتصال ${device.id} → ${remote}`),node('alert','mail','تنبيه بريد'),node('log','identity','سجل الهوية'));
  add('message','email','ترويسة ورسالة بريد','MAIL-01',at(0),`To: ${email.address}\nFrom: support@${spoof}\nReply-To: verify@${spoof}\nSubject: راجع حسابك\nLink: https://${spoof}/verify\nAttachment: ${file}`,'required',['email:message',acct]);
  add('auth','account','حدث دخول الحساب','IDP-01',at(3),`account=${account.username} source=${remote} result=success after email opened device=unknown; known_office_device=${device.id}`,'required',[acct,external,'log:identity']);
  add('browser','process','أثر فتح الرابط','Endpoint Events',at(2),`device=${device.id} user=${account.username} process=browser.exe url=https://${spoof}/verify file=${file}`,'supporting',[workstation,'process:browser',`file:${file}`]);
  add('normal-mail','email','رسالة دورية من الشركة','MAIL-01',at(1),`To: ${email.address}\nFrom: reports@nexacorp.example\nSubject: تقرير داخلي دوري؛ لا يشير إلى ${spoof}`,'distractor',['email:message']);
  links.push(link(acct,'RECEIVED','email:message'),link(acct,'OBSERVED_IN','log:identity'),link(acct,'LOGGED_IN_TO',workstation));
  keyLinks=[link(acct,'RECEIVED','email:message'),link(acct,'OBSERVED_IN','log:identity'),link(acct,'LOGGED_IN_TO',workstation)];
  title='تحقيق رسالة وهوية الحساب';brief=`تلقى ${employee.name} رسالة تحقق غير متوقعة. تحقق مما إذا ارتبطت بنشاط الحساب ${account.username}.`;
  expectedHypothesis='phishing';explanation='تطابق ترويسة الرسالة ووجهة الرابط مع دخول غير مألوف للحساب بعد فتحها؛ الرسالة الدورية المنفصلة لا تثبت الاختراق.';
 }else if(templateId==='endpoint'){
  const process=['powershell.exe','wscript.exe','mshta.exe'][Math.floor(roll()*3)],parent=['outlook.exe','browser.exe'][Math.floor(roll()*2)],filename=`invoice-${100+Math.floor(roll()*800)}.tmp`;
  nodes.push(node('process',process,process),node('process',parent,parent),node('file',filename,filename),node('connection','outbound',`اتصال ${device.id} → ${remote}`),node('alert','endpoint','تنبيه الجهاز'),node('log','process','سجل العمليات'));
  add('process','process','سلسلة تشغيل العمليات',device.id,at(0),`device=${device.id} account=${account.username} parent=${parent} child=${process} pid=${1000+Math.floor(roll()*5000)}`,'required',[workstation,acct,`process:${parent}`,`process:${process}`,'log:process']);
  add('network','network','اتصال العملية بالشبكة','Network Events',at(3),`device=${device.id} process=${process} destination=${remote}:443 connection=outbound`,'required',[workstation,`process:${process}`,external,'connection:outbound']);
  add('file','file','بيانات ملف أنشأته العملية',device.id,at(2),`file=${filename} created_by=${process} owner=${account.username} simulated=true`,'supporting',[`file:${filename}`,`process:${process}`,acct]);
  add('maintenance','log','فحص صيانة مجدول','IT Operations',at(1),`device=${device.id} scheduled inventory scan; no child=${process} and no destination=${remote}`,'distractor',[workstation]);
  links.push(link(acct,'LOGGED_IN_TO',workstation),link(`process:${parent}`,'SPAWNED',`process:${process}`),link(`process:${process}`,'CONNECTED_TO',external));
  keyLinks=[link(`process:${parent}`,'SPAWNED',`process:${process}`),link(`process:${process}`,'CONNECTED_TO',external),link(acct,'LOGGED_IN_TO',workstation)];
  title='تحقيق جهاز واتصال صادر';brief=`ظهر نشاط عملية غير متوقع على ${device.id}. اربط العملية بالاتصال وسياق الحساب قبل اتخاذ قرار.`;
  expectedHypothesis='suspicious-endpoint';explanation='سلسلة العمليات واتصال العملية نفسها بعنوان خارجي يربطان الحدثين؛ سجل الصيانة لا يفسر تلك السلسلة.';
 }else{
  nodes.push(node('server','IDP-01','IDP-01','خدمة الهوية',{kind:'device',id:'IDP-01'}),node('connection','auth-flow',`اتصال ${remote} → IDP-01`),node('alert','network-auth','تنبيه جلسة'),node('log','login','سجل الدخول'),node('log','flow','سجل الشبكة'));
  add('login','account','محاولات الدخول','IDP-01',at(0),`account=${account.username} source=${remote} failures=3 success=1 device=unknown`,'required',[acct,external,'server:IDP-01','log:login']);
  add('flow','network','تدفق الشبكة','Network Events',at(2),`src=${remote} dst=IDP-01 service=identity account=${account.username} result=established`,'required',[external,'server:IDP-01','connection:auth-flow','log:flow']);
  add('office','account','جلسة المكتب المعروفة','IDP-01',at(3),`account=${account.username} device=${device.id} ip=${device.ip} recognized=true; separate from source=${remote}`,'supporting',[acct,workstation,`ip:${device.ip}`]);
  add('unrelated','log','تنبيه خدمة غير مرتبط','WEB-01',at(1),`routine portal health check; source=192.0.2.83; no account=${account.username}`,'distractor',['server:IDP-01']);
  links.push(link(acct,'OBSERVED_IN','log:login'),link(external,'OBSERVED_IN','log:flow'),link('connection:auth-flow','CONNECTED_TO','server:IDP-01'));
  keyLinks=[link(acct,'OBSERVED_IN','log:login'),link(external,'OBSERVED_IN','log:flow'),link('connection:auth-flow','CONNECTED_TO','server:IDP-01')];
  title='تحقيق مصادقة وتدفق شبكة';brief=`سُجلت محاولات دخول لحساب ${account.username}. قارن مصدرها باتصال الهوية وجلسة المكتب المعروفة.`;
  expectedHypothesis='suspicious-auth';explanation='تطابق مصدر محاولات الدخول مع اتصال IDP-01 في سجل الشبكة؛ جلسة المكتب عنوان داخلي منفصل ولا تثبت سلامة المصدر الخارجي.';
 }
 if(difficulty!=='beginner'){
  add('context','log','سجل سياق إضافي','SOC Console',at(5),`account=${account.username} device=${device.id} source=${remote} investigation correlation required`,'supporting',[acct,workstation,external]);
  add('noise','network','حركة شبكة أخرى','Network Events',at(4),`src=192.0.2.83 dst=WEB-01 routine portal traffic; not source=${remote}`,'distractor',[workstation]);
 }
 if(difficulty==='advanced'){
  add('identity-history','account','سجل سياق الهوية','IDP-01',at(6),`account=${account.username} owner=${employee.name} home_device=${device.id} office_ip=${device.ip}`,'supporting',[acct,actor,workstation]);
 }
 const required=evidence.filter(e=>e.role==='required').map(e=>e.id);
 const requiredLinks=difficulty==='advanced'?keyLinks:keyLinks.slice(0,2);
 const hypotheses=[{id:expectedHypothesis,label:templateId==='phishing'?'رسالة تصيد مرتبطة بنشاط الحساب':templateId==='endpoint'?'عملية غير مألوفة اتصلت بعنوان خارجي':'محاولة دخول غير مألوفة مرتبطة بتدفق الشبكة'},{id:'routine',label:'نشاط اعتيادي مؤكد دون حادث'},{id:'unrelated',label:'الأحداث المرصودة غير مترابطة'}];
 const board:BoardDefinition={id:`dynamic-${templateId}-${seed.toString(16).padStart(8,'0')}`,title,subtitle:brief,sourceHref:'/incidents',sourceKind:'dynamic',sourceId:templateId,nodes,evidence,hypotheses,actions:[{id:'contain',label:'احتواء الحساب أو الجهاز المتأثر'},{id:'escalate',label:'تصعيد الحالة مع الأدلة المرتبطة'},{id:'monitor',label:'مراقبة فقط'}],expected:{hypothesis:expectedHypothesis,actions,affected,requiredLinks,requiredEvidenceIds:required},allowedLinks:links};
 if(!validBoardDefinition(board)||!nodes.every(n=>!n.companyRef||resolveCompanyEntity(n.companyRef))||new Set(evidence.map(e=>e.id)).size!==evidence.length)throw Error('تعارض في توليد الحادث.');
 const eventList=evidence.map(e=>({id:e.id,source:e.source,time:e.timestamp,summary:e.title})).sort((a,b)=>a.time.localeCompare(b.time));
 const incident:DynamicIncident={templateId,instanceId:`${templateId}-${seed.toString(16).padStart(8,'0')}`,seed,difficulty,title,brief,guidance:difficulty==='beginner'?'ابدأ بسجل المصدر ثم قارنه بأثر الحساب أو الجهاز.':difficulty==='intermediate'?'قارن مصدرين مستقلين، ثم ميّز السجل الدوري عن الحدث المرتبط.':'ابنِ التسلسل الزمني عبر المصادر الثلاثة قبل اعتماد العلاقة.',affectedEntities:affected,timeline:eventList.map(e=>({time:e.time,summary:e.summary})),events:eventList,evidence,distractors:evidence.filter(e=>e.role==='distractor').map(e=>e.id),successConditions:{requiredEvidenceIds:required,requiredLinks},validConclusions:[expectedHypothesis],recommendedActions:actions,board,review:{explanation,evidence:Object.fromEntries(evidence.map(e=>[e.id,e.role==='distractor'?'هذا السجل منفصل عن مصدر الحادث ولا يثبت الفرضية.':e.role==='required'?'مصدر ضروري للربط بين الحدثين.':'سياق داعم يمكن استخدامه دون أن يكون شرطًا للإغلاق.'])),links:requiredLinks}};
 return generationVersion===2?applyIncidentVariation(incident):incident;
}
