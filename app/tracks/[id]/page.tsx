import { notFound } from 'next/navigation';
import TrackDetail from './view';
import { tracks } from '@/lib/curriculum';

export default async function TrackPage({ params }: { params: Promise<{id: string}> }) {
  const { id } = await params;
  const track = tracks.find(t => t.id === id);
  if (!track) notFound();
  return <TrackDetail track={track}/>;
}
