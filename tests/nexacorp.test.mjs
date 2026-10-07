import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry){const bundle=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'))}
const {nexaCorp,resolveCompanyEntity,companyEntityAnchor}=await load('lib/nexacorp.ts');
const {companyContentReferences,companyContentFor}=await load('lib/nexacorp-references.ts');
const {firstSignal}=await load('lib/campaigns.ts');
const {missions}=await load('lib/missions.ts');
const {bossMissions}=await load('lib/boss-missions.ts');
const {interactiveLabs,logEvents}=await load('lib/interactive-labs.ts');
const {socAlerts}=await load('lib/soc-alerts.ts');
for(const [kind,collection] of Object.entries({department:nexaCorp.departments,employee:nexaCorp.employees,device:nexaCorp.devices,segment:nexaCorp.segments,service:nexaCorp.services,account:nexaCorp.accounts,email:nexaCorp.emailIdentities,asset:nexaCorp.importantAssets})){
 assert.equal(new Set(collection.map(x=>x.id)).size,collection.length,kind+' IDs');
 for(const entity of collection)assert.equal(resolveCompanyEntity({kind,id:entity.id})?.id,entity.id);
}
const refs=(kind,id)=>companyContentFor(kind,id)?.entities||[];
for(const e of nexaCorp.employees){
 assert(nexaCorp.departments.some(d=>d.id===e.departmentId));assert(nexaCorp.accounts.some(a=>a.id===e.accountId&&a.employeeId===e.id));assert(nexaCorp.emailIdentities.some(a=>a.id===e.emailId&&a.employeeId===e.id));
 for(const id of e.deviceIds)assert(nexaCorp.devices.some(d=>d.id===id&&d.departmentId===e.departmentId));
 if(e.campaignPersonId)assert(firstSignal.people.some(p=>p.id===e.campaignPersonId&&p.name===e.name));
}
for(const d of nexaCorp.devices){assert(nexaCorp.departments.some(x=>x.id===d.departmentId));if(d.segmentId)assert(nexaCorp.segments.some(s=>s.id===d.segmentId));if(d.ip){const segment=nexaCorp.segments.find(s=>s.id===d.segmentId);assert(segment);assert.equal(d.ip.split('.').slice(0,3).join('.'),segment.cidr.split('.').slice(0,3).join('.'))}}
for(const s of nexaCorp.services)for(const id of s.deviceIds)assert(nexaCorp.devices.some(d=>d.id===id));
for(const a of nexaCorp.importantAssets){for(const id of a.deviceIds)assert(nexaCorp.devices.some(d=>d.id===id));for(const id of a.serviceIds)assert(nexaCorp.services.some(s=>s.id===id))}
const expected={campaign:[firstSignal.id],mission:missions.map(x=>x.id),boss:bossMissions.map(x=>x.id),lab:interactiveLabs.map(x=>x.id),soc:socAlerts.map(x=>x.id)};
for(const [kind,ids] of Object.entries(expected))for(const id of ids){const items=refs(kind,id);assert(items.length,kind+'/'+id);for(const ref of items){assert(resolveCompanyEntity(ref),`${kind}/${id} → ${ref.kind}/${ref.id}`);assert(companyEntityAnchor(ref).startsWith('/operations/nexacorp#'))}}
assert.equal(companyContentReferences.length,Object.values(expected).flat().length);
assert(refs('lab','v2-logs').some(x=>x.kind==='device'&&x.id==='WKST-02'));
assert(refs('soc','SOC-002').some(x=>x.kind==='employee'&&x.id==='layla'));
assert(refs('boss','boss-003').some(x=>x.kind==='device'&&x.id==='APP-02'));
assert.equal(nexaCorp.devices.find(d=>d.id==='WKST-02').ip,logEvents.find(e=>e.id==='L01').ip);
assert.equal(nexaCorp.devices.find(d=>d.id==='WKST-03').ip,logEvents.find(e=>e.id==='L12').ip);
assert.equal(nexaCorp.devices.find(d=>d.id==='WKST-05').ip,socAlerts.find(a=>a.id==='SOC-009').sourceIp);
assert.equal(nexaCorp.devices.find(d=>d.id==='WIN-07').ip,socAlerts.find(a=>a.id==='SOC-003').sourceIp);
assert(!nexaCorp.devices.some(d=>d.ip===socAlerts.find(a=>a.id==='SOC-002').sourceIp),'unfamiliar source is not Layla device');
assert(!nexaCorp.devices.some(d=>d.ip==='203.0.113.77'),'firewall destination is not APP-02');
const view=await readFile('app/operations/nexacorp/view.tsx','utf8');assert(view.includes('company-reference')&&view.includes('hashchange'));assert(!view.includes('fetch(')&&!view.includes("method:'POST'"),'reference page does not fetch or mutate learner activity');
console.log('PASS: company references, network scopes, campaign identities, existing content coverage and optional reference without activity writes.');
