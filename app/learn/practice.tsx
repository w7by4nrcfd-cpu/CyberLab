'use client';
import {useState} from 'react';
import type {Lesson} from '@/lib/curriculum';
export default function Practice({practice}:{practice:NonNullable<Lesson['practice']>}){
 const [answer,setAnswer]=useState('');
 const [checked,setChecked]=useState(false);
 const [hint,setHint]=useState(false);
 const correct=answer.trim()===practice.expected;
 return <section className="practice-box"><span className="eyebrow">تطبيق سريع · توقع نتيجة الكود</span><h2>جرّب قبل الاختبار</h2><p>{practice.prompt}</p><label htmlFor="practice-answer">النتيجة التي تتوقعها</label><input id="practice-answer" dir="ltr" value={answer} maxLength={200} onChange={e=>{setAnswer(e.target.value);setChecked(false);}} placeholder="اكتب النتيجة هنا"/><div className="button-row"><button className="primary-button" disabled={!answer.trim()} onClick={()=>setChecked(true)}>تحقق من توقعي</button><button className="secondary-button" onClick={()=>setHint(h=>!h)}>{hint?'إخفاء التلميح':'أحتاج تلميحًا'}</button></div>{hint&&<p className="practice-hint">{practice.hint}</p>}{checked&&<p role="status" className={correct?'success':'wrong'}>{correct?'صحيح! فهمت أثر التغيير على الكود.':'لم تطابق النتيجة بعد. راجع المثال واستعن بالتلميح ثم حاول ثانية.'}</p>}<small className="muted">هذا تمرين توقع، وليس تنفيذًا للكود. لا يضيف نقاطًا؛ تُحفظ نقاط الدرس بعد اجتياز الاختبار.</small></section>;
}
