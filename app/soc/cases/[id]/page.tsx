import {notFound} from 'next/navigation';
import {socCaseById} from '@/lib/soc-alerts';
import CaseWorkspace from './view';
export default async function CasePage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!socCaseById(id))notFound();return <CaseWorkspace id={id}/>}
