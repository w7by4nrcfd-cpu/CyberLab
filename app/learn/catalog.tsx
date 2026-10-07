'use client';
import {useState} from 'react';
import Link from '@/components/native-link';
import {BookOpen,Search,Bookmark,CheckCircle2} from 'lucide-react';
import {tracks,type PublicLesson} from '@/lib/curriculum';
import {guidedLesson} from '@/lib/guided-progression';
import {isCyberLesson,scopeForLesson,scopeLabels} from '@/lib/content-scope';
import {useProgress} from '../shell';
import {completedIds} from '@/lib/metrics';
import CyberLibrary from './cyber-library';
export default function Catalog({lessons,initialQuery='',initialSaved=false}:{lessons:PublicLesson[];initialQuery?:string;initialSaved?:boolean}){
 const [query,setQuery]=useState(initialQuery),[bookmarksOnly,setBookmarksOnly]=useState(initialSaved);
 const {items,learning,loading,error,user}=useProgress(),done=completedIds(items,learning);
 const {lesson:focus,continuing}=guidedLesson(done,learning.activity);
 const additionalOngoing=learning.activity.find(a=>!a.completedAt&&!done.has(a.id)&&!isCyberLesson(a.id));
 const term=query.trim().toLocaleLowerCase();
 const matches=(value?:string)=>value&&(term.length<=3&&/^[a-z]+$/.test(term)?new RegExp('(^|[^a-z])'+term,'i').test(value):value.toLocaleLowerCase().includes(term));
 const filtered=lessons.filter(l=>(!bookmarksOnly||learning.bookmarks.some(b=>b.id===l.id))&&(!term||[l.title,l.intro,l.module,tracks.find(t=>t.id===l.track)?.name,...(l.terms||[]).map(t=>t.en)].some(v=>matches(v))));
 const extra=filtered.filter(l=>!isCyberLesson(l.id));
 if(user&&(loading||error))return <div className="reading-width" role={error?'alert':'status'}>{error?'تعذر تحميل تقدمك. أعد تحميل الصفحة.':'جارٍ تحميل مراجعك وتقدمك…'}</div>;
 return <><header className="page-heading"><div><span className="eyebrow">التعلّم عند الحاجة</span><h1>مكتبة المعرفة السيبرانية</h1><p>ابدأ بالقضية، وافتح المرجع عندما تحتاج مفهومًا. هذه المكتبة للاستكشاف والعودة، وليست قائمة يجب إنهاؤها لتبدأ.</p></div><BookOpen size={32}/></header>
 <section className="guided-focus panel"><div><span className="eyebrow">العودة إلى نشاطك</span><h2>تابع تدريبك من موضعك</h2><p>افتح خطوتك التالية في لوحة التحكم. عند فتح مرجع من التدريب، استخدم «العودة إلى البلاغ» لاستئناف الفحص.</p></div><Link className="primary-button" href="/">افتح خطوتي التالية</Link></section>
 {continuing&&<p className="scope-context">تابع المرجع الذي بدأت به: <a href={'/learn/'+focus.id}>{focus.title}</a></p>}
 <a className="guided-map-link" href="/roadmap">أين أنا في خارطة الأمن السيبراني؟</a>
 <p className="library-hint">اختر موضوعًا ثم مجموعة مراجع، أو ابحث مباشرة عن مفهوم مثل DNS. لا يلزم إكمال المكتبة لبدء التدريب.</p><div className="catalog-filters"><label><Search size={19}/><input aria-label="تصفية الدروس في هذه الصفحة" placeholder="ابحث عن مفهوم تحتاجه…" value={query} onChange={e=>setQuery(e.target.value)}/></label><button type="button" className={'secondary-button '+(bookmarksOnly?'selected':'')} onClick={()=>setBookmarksOnly(v=>!v)}><Bookmark size={17}/>الإشارات المرجعية</button></div>
 {!filtered.length&&<div className="empty-state"><h2>لم نجد مرجعًا مطابقًا</h2><p>جرّب كلمة أخرى أو أزل فلتر الإشارات.</p><button className="secondary-button" onClick={()=>{setQuery('');setBookmarksOnly(false)}}>أزل الفلاتر</button></div>}
 <CyberLibrary lessons={filtered} done={done} bookmarks={learning.bookmarks.map(b=>b.id)} expanded={!!term||bookmarksOnly}/>
 {(extra.length>0||additionalOngoing)&&<details id="additional-knowledge" className="guided-disclosure scope-additional" key={!!term+'-'+bookmarksOnly} open={!!term||bookmarksOnly}><summary>المعرفة الإضافية والأرشيف</summary><p>محتوى عام خارج الرحلة السيبرانية الأساسية. يمكنك الرجوع إليه؛ إنجازاته وروابطه القديمة محفوظة.</p>
 {additionalOngoing&&<p>مرجع إضافي بدأته: <a href={'/learn/'+additionalOngoing.id}>{lessons.find(l=>l.id===additionalOngoing.id)?.title||additionalOngoing.id}</a></p>}
 <div className="lesson-list">{extra.map(l=><a href={'/learn/'+l.id} className="lesson-row" key={l.id}><span className="lesson-number">{done.has(l.id)?<CheckCircle2 size={19}/>:l.level||1}</span><div><h3>{l.title}</h3><p>{scopeLabels[scopeForLesson(l.id)]}</p></div><span className="lesson-meta">{l.minutes} دقائق</span></a>)}</div>
 </details>}
 </>;
}
