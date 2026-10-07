import Link from '@/components/native-link';
import {Search} from 'lucide-react';
import {searchSite} from '@/lib/site-search';
import SearchResults from './results';
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string|string[]}>}){
 const {q=''}=await searchParams,invalid=typeof q!=='string'||q.length>100,query=invalid?'':q.trim(),results=invalid?[]:searchSite(query);
 return <div className="reading-width site-search-page"><div className="page-heading"><div><span className="eyebrow">اكتشف المحتوى</span><h1>البحث في CyberLab</h1><p>تظهر المعرفة والتدريبات السيبرانية أولًا، وتُميّز المراجع المساندة والمعرفة الإضافية بوضوح.</p></div><Search size={31}/></div><form role="search" action="/search" className="site-search-form"><input name="q" aria-label="عبارة البحث" placeholder="مثال: NAT" defaultValue={query} maxLength={100} autoFocus/><button className="primary-button" type="submit">بحث</button></form>{invalid?<p role="alert">عبارة البحث غير صالحة. أدخل عبارة واحدة لا تتجاوز 100 حرف.</p>:query?results.length?<SearchResults results={results}/>:<p>لا توجد نتائج مطابقة. جرّب كلمة أقصر أو انتقل إلى <Link href="/learn">مكتبة المعرفة</Link>.</p>:<div className="panel"><p>يمكنك البحث في المحتوى التعليمي والتدريب العملي والعمليات وتقدمك من حقل البحث أعلى الموقع.</p></div>}</div>
}
