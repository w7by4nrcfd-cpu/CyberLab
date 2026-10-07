import {Building2} from 'lucide-react';
import {companyContentFor,type CompanyContentKind} from '@/lib/nexacorp-references';
import {companyEntityAnchor,nexaCorp,type EntityRef} from '@/lib/nexacorp';

function label(ref:EntityRef){switch(ref.kind){case 'employee':return nexaCorp.employees.find(e=>e.id===ref.id)?.name;case 'device':return ref.id;case 'service':return nexaCorp.services.find(s=>s.id===ref.id)?.name;case 'segment':return nexaCorp.segments.find(s=>s.id===ref.id)?.name;case 'account':return ref.id;default:return ref.id}}
export default function CompanyContext({kind,id}:{kind:CompanyContentKind;id:string}){const content=companyContentFor(kind,id);if(!content?.entities.length)return null;return <details className="company-context practical-context"><summary><Building2 size={18}/> مرجع سياق NexaCorp</summary><div><p>{content.context}</p><div>{content.entities.slice(0,5).map(ref=><a href={companyEntityAnchor(ref)} key={ref.kind+ref.id}>{label(ref)}</a>)}<a href="/operations/nexacorp">عرض الشركة ←</a></div></div></details>}
