import {notFound} from 'next/navigation';
import {missionById} from '@/lib/missions';
import MissionWorkspace from './workspace';
export default async function MissionPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{campaign?:string}>}){const {id}=await params;const mission=missionById(id);if(!mission||mission.kind==='boss')notFound();return <MissionWorkspace mission={mission} campaign={(await searchParams).campaign==='first-signal'}/>}
