import Catalog from './catalog';
import { publicLessons } from '@/lib/curriculum';
export default async function Learn({searchParams}:{searchParams:Promise<{q?:string;saved?:string}>}) { const {q='',saved=''}=await searchParams;return <Catalog lessons={publicLessons()} initialQuery={q.slice(0,100)} initialSaved={saved==='1'}/>; }
