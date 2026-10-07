import {notFound} from 'next/navigation';
import {campaignById} from '@/lib/campaigns';
import CampaignHub from './view';
import FirstSignalGuided from './guided';
export default async function CampaignPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{view?:string}>}){const [{id},query]=await Promise.all([params,searchParams]);if(!campaignById(id))notFound();return id==='first-signal'&&query.view!=='full'?<FirstSignalGuided/>:<CampaignHub id={id}/>}
