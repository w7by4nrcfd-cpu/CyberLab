import { notFound } from 'next/navigation';
import PathDetail from './view';
import { paths } from '@/lib/paths';

export default async function PathPage({ params }: { params: Promise<{id: string}> }) {
  const { id } = await params;
  const path = paths.find(p => p.id === id);
  if (!path) notFound();
  return <PathDetail path={path}/>;
}
