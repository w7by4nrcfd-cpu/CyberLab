// Server boundary validation only. Content, grading, unlocks and rewards stay in their existing engines.
type ObjectValue = Record<string, unknown>;
type Check = (value: unknown) => boolean;
const object = (v: unknown): v is ObjectValue => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (max: number, min = 0): Check => v => typeof v === 'string' && v.length <= max && v.trim().length >= min;
const id: Check = v => typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,119}$/.test(v);
const oneOf = (...values: string[]): Check => v => typeof v === 'string' && values.includes(v);
const integer = (min: number, max: number): Check => v => Number.isInteger(v) && Number(v) >= min && Number(v) <= max;
const list = (check: Check, max: number): Check => v => Array.isArray(v) && v.length <= max && v.every(check);
const shape = (v: unknown, fields: Record<string, Check>, required = Object.keys(fields)): boolean => object(v) && required.every(k => Object.hasOwn(v, k)) && Object.entries(v).every(([k, value]) => Object.hasOwn(fields, k) && fields[k](value));
const noFields = (v: unknown, action: string) => shape(v, {action: oneOf(action)});
const decision: Check = v => shape(v, {hypothesis:id,action:id,affected:list(id,8),evidenceIds:list(id,40)});
const report: Check = v => shape(v, {finding:id,impact:id,evidence:list(id,20),fix:text(80),asset:id}, ['finding','impact','evidence']);
const caseNote: Check = v => shape(v, {observation:text(500,15),evidenceRefs:list(id,15),assessment:text(500,15),actionTaken:oneOf('contain','escalate','monitor','dismiss'),owner:text(100,3),nextStep:text(500,12)});
const answers: Check = v => object(v) && Object.keys(v).length <= 20 && Object.entries(v).every(([k,s]) => id(k) && text(160)(s));
const quizAnswer: Check = v => integer(0,100)(v) || text(100)(v) || list(integer(0,100),20)(v);
export type PayloadKind = 'learning'|'submit'|'mission'|'lab'|'board'|'soc'|'case'|'campaign'|'incident'|'incident-chain';

export function validPayload(kind: PayloadKind, input: unknown): input is ObjectValue {
 if (!object(input)) return false;
 const a = input.action;
 if (kind === 'submit') return input.kind === 'quiz'
  ? shape(input,{kind:oneOf('quiz'),id,answers:list(quizAnswer,20)})
  : shape(input,{kind:oneOf('lab'),id,input:v=>shape(v,{answer:v=>text(250)(v)||integer(0,100)(v),ports:list(integer(1,65535),20),action:oneOf('verify','reply','ignore','click'),clue:text(80)},[]) });
 if (kind === 'learning') {
  if (a === 'settings') return shape(input,{action:oneOf('settings'),dailyGoal:integer(5,180),theme:oneOf('dark','light')});
  const fields: Record<string,Check> = {action:oneOf('read','complete','note','bookmark'),id};
  if(a==='read')fields.seconds=integer(0,30);
  if(a==='note')fields.content=text(5000);
  if(a==='bookmark')fields.saved=v=>typeof v==='boolean';
  return shape(input,fields);
 }
 if(kind === 'campaign')return shape(input,{flagId:id});
 if(kind === 'incident-chain')return shape(input,{stage:integer(0,2)});
 if(kind === 'incident')return shape(input,{templateId:oneOf('phishing','endpoint','network-auth'),difficulty:oneOf('beginner','intermediate','advanced'),mode:oneOf('resume','new')});
 if(kind === 'case')return a==='note'?shape(input,{action:oneOf('note'),content:text(2000,3)}):shape(input,{action:oneOf('close'),conclusion:text(2000,25)});
 if(kind === 'board') {
  if(a==='reopen')return noFields(input,'reopen');
  if(a==='decide')return shape(input,{action:oneOf('decide'),decision});
  if(a==='annotate')return shape(input,{action:oneOf('annotate'),evidenceId:id,note:text(1200),classification:oneOf('relevant','uncertain','irrelevant')});
  if(a==='link'||a==='unlink') {const fields:Record<string,Check>={action:oneOf('link','unlink'),fromId:id,toId:id,relation:oneOf('USES','LOGGED_IN_TO','CONNECTED_TO','SPAWNED','SENT','RECEIVED','OBSERVED_IN','RELATED_TO')};if(a==='link')fields.reason=text(400,8);return shape(input,fields);}
  return shape(input,{action:oneOf('review','collect'),evidenceId:id});
 }
 if(kind === 'mission') {
  const fields:Record<string,Check>={id,action:oneOf('start','inspect','tool','hint','solve','replay','decide')};
  if(a==='inspect')fields.evidenceId=id;
  if(a==='tool')return shape(input,{...fields,toolId:id,command:text(120)},['id','action']) && (id(input.toolId)||text(120,1)(input.command));
  if(a==='solve')fields.answers=answers;
  if(a==='decide'){fields.decisionId=id;fields.response=text(200);}
  return shape(input,fields);
 }
 if(kind === 'soc') {
  const fields:Record<string,Check>={action:oneOf('start','triage','inspect','collect','tool','decide','respond','document','close','reopen','note','defensive','assess','response-test','verify','report')};
  if(a==='note')fields.content=text(2000,3);
  if(a==='triage'){fields.priority=oneOf('Low','Medium','High','Critical');fields.reason=text(500,12);}
  if(a==='inspect'||a==='collect')fields.evidenceId=id;
  if(a==='tool')fields.toolId=id;
  if(a==='decide'){fields.verdict=oneOf('true_positive','false_positive','benign_suspicious');fields.conclusion=text(1000,20);}
  if(a==='respond'){fields.response=oneOf('contain','escalate','monitor','dismiss');fields.reason=text(800,20);}
  if(a==='document')fields.caseNote=caseNote;
  if(a==='assess')fields.decision=decision;
  if(a==='response-test')fields.plan=oneOf('complete','file-only','scoped-close','disable');
  if(a==='verify'){fields.checks=list(oneOf('network','identity','service','monitoring'),2);fields.verification=oneOf('effective','incomplete');}
  if(a==='report')fields.reportNext=oneOf('follow-up','baseline');
  return shape(input,fields);
 }
 // Lab-specific educational checks remain in applyLabAction / applyAssessment / applyMinimum.
 if(a==='assessment-upgrade')return shape(input,{action:oneOf('assessment-upgrade'),accepted:v=>typeof v==='boolean'},['action']);
 if(a==='scope-check')return shape(input,{action:oneOf('scope-check'),scope:list(id,4)});
 if(a==='finding-report')return shape(input,{action:oneOf('finding-report'),key:oneOf('verified','incomplete'),value:oneOf('exposure','access','session')});
 const fields:Record<string,Check>={action:oneOf('start','scenario','hint','replay','inspect','filter','mark','log-auth','correlate','network-view','transport','transport-trace','network-resolve','command','classify','test','configure','submit','authorize','page','observe','hypothesis','choose','probe','evaluate','recheck','report','patch','retest','classify-start','prioritize','priority','validate','login','logout','login-again','assessment-upgrade','scope-check','finding-report'),scope:list(id,4),key:text(80),value:text(250),input:text(160),filters:v=>shape(v,Object.fromEntries(['search','type','user','host','ip','severity','from','to'].map(k=>[k,text(100)])),[]),ip:text(100),user:text(100),host:text(100),indicator:text(250),answer:text(250),field:oneOf('ip','gateway','dns','dhcp','port'),path:text(250),owner:text(250),method:text(20),unauthorized:text(20),authorized:text(20),difference:text(100),accepted:v=>typeof v==='boolean',report};
 return shape(input,fields,['action']);
}

export async function readJsonInput(request: Request, maxBytes: number, kind: PayloadKind): Promise<{data:ObjectValue;error?:never}|{error:Response;data?:never}> {
 const fail=(status:number,error:string)=>({error:Response.json({error},{status,headers:{'Cache-Control':'private, no-store'}})});
 const origin=request.headers.get('origin');
 if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return fail(403,'طلب غير مسموح.');
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return fail(415,'JSON مطلوب.');
 const declared=request.headers.get('content-length');
 if(declared&&Number(declared)>maxBytes)return fail(413,'حجم الطلب كبير.');
 let input:unknown;
 try {
  const reader=request.body?.getReader();if(!reader)return fail(400,'طلب غير صالح.');
  const chunks:Uint8Array[]=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>maxBytes){await reader.cancel();return fail(413,'حجم الطلب كبير.');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.byteLength;}
  input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 } catch{return fail(400,'طلب غير صالح.');}
 if(!validPayload(kind,input))return fail(400,'مدخلات غير صالحة. راجع الخيارات وطول النص ثم أعد المحاولة.');
 return {data:input};
}

// Never log the exception message, SQL, payload, identity or stack: drivers may include user notes or credentials.
export function reportServerError(event: string, error: unknown) {
 console.error('CyberLab server failure',{event,category:error instanceof TypeError?'type':error instanceof Error?'operation':'unknown'});
}

// Engine feedback starts in Arabic. Never classify a driver/JS exception by a word
// inside its message: SQL errors can embed Arabic notes or other submitted text.
export function isUserError(error: unknown, expected: RegExp): error is Error {
 return error instanceof Error && /^[\u0600-\u06ff]/.test(error.message)
  && !/D1_ERROR|SQLITE|database|\bSQL\b/i.test(error.message) && expected.test(error.message);
}
