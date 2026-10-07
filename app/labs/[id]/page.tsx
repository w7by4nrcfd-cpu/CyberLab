import { notFound } from 'next/navigation';
import { labs } from '@/lib/curriculum';
import LabLauncher from './launcher';
export default async function Lab({ params, searchParams }: {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{track?:string;start?:string}>;
}) { const { id } = await params; const lab = labs.find(l => l.id === id); if (!lab)
    notFound(); const query = await searchParams; return <LabLauncher key={id} lab={lab} trackId={query.track} started={query.start === '1'}/>; }
