import {dynamicReturnPath} from '@/lib/dynamic-presentation';
import {defensiveReturnPath} from '@/lib/soc-expansion';
import {trackLessonReturnPath} from '@/lib/offensive-minimum';
import {assessmentReturnPath} from '@/lib/offensive-pilot';
import { notFound } from 'next/navigation';
import { publicLessons } from '@/lib/curriculum';
import LessonView from './view';
import {isCyberLesson} from '@/lib/content-scope';
import {pilotReturnPath} from '@/lib/mission-first-pilot';
export default async function LessonPage({ params,searchParams }: {
    params: Promise<{
        id: string;
    }>;
    searchParams:Promise<{return_to?:string}>;
}) { const [{ id },query] = await Promise.all([params,searchParams]); const all = publicLessons(); const index = all.findIndex(l => l.id === id); if (index < 0)
    notFound(); const next=all.slice(index+1).find(l=>l.track===all[index].track&&isCyberLesson(l.id)); return <LessonView key={id} lesson={all[index]} next={next?.id} returnTo={dynamicReturnPath(query.return_to||'')||defensiveReturnPath(query.return_to||'')||trackLessonReturnPath(query.return_to||'')||assessmentReturnPath(query.return_to||'')||pilotReturnPath(query.return_to||'')}/>; }
