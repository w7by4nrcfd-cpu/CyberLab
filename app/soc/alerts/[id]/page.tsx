import DefensiveWorkspace from './defensive';
import {isDefensiveId} from '@/lib/soc-expansion';
import {notFound} from 'next/navigation';
import {socAlertById} from '@/lib/soc-alerts';
import AlertWorkspace from './workspace';
import FirstSocGuided from './guided';
export default async function AlertPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{view?:string}>}){const {id}=await params;if(!socAlertById(id))notFound();const query=await searchParams;return isDefensiveId(id)&&query.view==='defensive'?<DefensiveWorkspace id={id}/>:id==='SOC-002'&&query.view==='guided'?<FirstSocGuided/>:<AlertWorkspace id={id}/>}
