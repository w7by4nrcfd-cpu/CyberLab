import {notFound,redirect} from 'next/navigation';
import {investigationBoardById} from '@/lib/investigation-board';
import InvestigationView from './view';
import CoreInvestigation from './guided';
export default async function InvestigationPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{journey?:string}>}){const {id}=await params;if(!investigationBoardById(id)&&!/^dynamic-(phishing|endpoint|network-auth)-[0-9a-f]{8}$/.test(id))notFound();if(['soc-SOC-004','soc-SOC-010'].includes(id))redirect('/soc/alerts/'+id.slice(4)+'?view=defensive&step=correlate');return id==='soc-SOC-002'&&(await searchParams).journey==='core'?<CoreInvestigation/>:<InvestigationView id={id}/>}
