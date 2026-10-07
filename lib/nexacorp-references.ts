import {nexaCorp,type EntityRef} from './nexacorp';
import {firstSignal} from './campaigns';
import {missions} from './missions';
import {bossMissions} from './boss-missions';
import {interactiveLabs} from './interactive-labs';
import {socAlerts} from './soc-alerts';

export type CompanyContentKind='campaign'|'mission'|'boss'|'lab'|'soc';
export type CompanyContentRef={kind:CompanyContentKind;id:string;entities:EntityRef[];context:string};
const employee=(id:string):EntityRef=>({kind:'employee',id});
const device=(id:string):EntityRef=>({kind:'device',id});
const account=(id:string):EntityRef=>({kind:'account',id});
const service=(id:string):EntityRef=>({kind:'service',id});
const segment=(id:string):EntityRef=>({kind:'segment',id});
const m:Record<string,EntityRef[]>={
 '001':[employee('sami'),device('FIN-01'),segment('practice-50')],
 '002':[employee('sami'),segment('practice-50')],
 '003':[employee('layla'),service('mail')],
 '004':[account('admin'),device('AUTH-01')],
 '005':[account('atlas'),service('application')]
};
const b:Record<string,EntityRef[]>={
 'boss-001':[employee('sami'),employee('layla'),segment('practice-40')],
 'boss-002':[employee('layla'),account('layla'),service('identity'),service('mail')],
 'boss-003':[employee('maya'),device('APP-02'),device('FILE-01')]
};
const l:Record<string,EntityRef[]>={
 'v2-attack-surface':[{kind:'asset',id:'surface-training'}],
 'v2-auth-session':[{kind:'asset',id:'session-training'},employee('sara'),account('sara')],
 'v2-access-control':[{kind:'asset',id:'access-training'},employee('sara'),account('sara'),employee('layla'),account('layla')],
 'v2-terminal':[account('atlas'),device('APP-02')],
 'v2-logs':[employee('layla'),device('WKST-02'),employee('sara'),device('WKST-03'),device('APP-02'),account('atlas')],
 'v2-email':[employee('layla'),service('mail')],
 'v2-network':[device('FIN-01'),device('IT-02'),segment('practice-50')],
 'v2-http':[device('WEB-01'),service('portal')]
};
const socOverrides:Record<string,EntityRef[]>={
 'SOC-001':[account('admin'),employee('adam')],
 'SOC-002':[employee('layla'),account('layla')],
 'SOC-003':[employee('adam'),device('WIN-07')],
 'SOC-004':[employee('maya'),device('APP-02')],
 'SOC-005':[employee('maya'),device('APP-02'),device('FILE-01')],
 'SOC-006':[employee('layla'),device('MAIL-01')],
 'SOC-007':[employee('adam'),device('DC-01')],
 'SOC-008':[account('backup'),device('FILE-01')],
 'SOC-009':[employee('maya'),device('WKST-05')],
 'SOC-010':[device('APP-01')]
};
// Alerts' sourceIp is an observation, never an address assignment for the host.
const socEntities=(id:string,host:string)=>[...(nexaCorp.devices.some(d=>d.id===host)?[device(host)]:[]),...(socOverrides[id]||[])].filter((r,i,a)=>a.findIndex(x=>x.id===r.id&&x.kind===r.kind)===i);
export const companyContentReferences:CompanyContentRef[]=[
 {kind:'campaign',id:firstSignal.id,entities:[employee('sami'),employee('layla'),employee('maya'),employee('adam'),device('APP-02'),device('FILE-01')],context:'تسلسل القضية عبر الدعم والبريد والعمليات الأمنية.'},
 ...missions.map(x=>({kind:'mission' as const,id:x.id,entities:m[x.id]||[],context:'مهمة ضمن سياق الشركة أو بيئة التدريب المعزولة.'})),
 ...bossMissions.map(x=>({kind:'boss' as const,id:x.id,entities:b[x.id]||[],context:'تحقيق موسّع مرتبط بفريق الشركة وأصولها.'})),
 ...interactiveLabs.map(x=>({kind:'lab' as const,id:x.id,entities:l[x.id]||[],context:x.id==='v2-network'?'محاكاة شبكة معزولة، عناوينها لا تعرّف الأجهزة في سجلات المكتب.':'مختبر يستخدم سياق NexaCorp أو سجلاتها.'})),
 ...socAlerts.map(x=>({kind:'soc' as const,id:x.id,entities:socEntities(x.id,x.host),context:`${x.type} · ${x.host} · مصدر الحدث ${x.sourceIp} (ليس بالضرورة عنوان الجهاز).`}))
];
export const companyContentFor=(kind:CompanyContentKind,id:string)=>companyContentReferences.find(r=>r.kind===kind&&r.id===id);
export function companyContentHref(item:Pick<CompanyContentRef,'kind'|'id'>){return ({campaign:'/campaigns/',mission:'/missions/',boss:'/bosses/',lab:'/labs/v2/',soc:'/soc/alerts/'} as const)[item.kind]+encodeURIComponent(item.id)}
export function companyContentTitle(item:Pick<CompanyContentRef,'kind'|'id'>){return item.kind==='campaign'?firstSignal.title:item.kind==='mission'?missions.find(m=>m.id===item.id)?.title:item.kind==='boss'?bossMissions.find(m=>m.id===item.id)?.title:item.kind==='lab'?interactiveLabs.find(l=>l.id===item.id)?.title:socAlerts.find(a=>a.id===item.id)?.title}
