import ExpandedAssessment from './expanded';
import {isOffensiveCase} from '@/lib/offensive-expansion';
import MinimumWorkspace from './minimum';
import {isMinimumAssessment} from '@/lib/offensive-minimum';
import OffensiveWorkspace from './offensive';
import {offensivePilot} from '@/lib/offensive-pilot';
import {notFound} from 'next/navigation';
import {interactiveLabById} from '@/lib/interactive-labs';
import InteractiveWorkspace from './workspace';
export default async function Page({params,searchParams}: {params:Promise<{id:string}>;searchParams:Promise<{track?:string}>}){const [{id},query]=await Promise.all([params,searchParams]);if(!interactiveLabById(id))notFound();return isOffensiveCase(id)?<ExpandedAssessment id={id} track={query.track==='offensive'}/>:isMinimumAssessment(id)?<MinimumWorkspace id={id}/>:id===offensivePilot.id?<OffensiveWorkspace track={query.track==='offensive'}/>:<InteractiveWorkspace id={id}/>}
