'use client';
import {useState} from 'react';
import {useProgress} from '@/app/shell';
import type {PublicLesson} from '@/lib/curriculum';

export function notesMarkdown(lessons:PublicLesson[],notes:{id:string;content:string}[]){
 return '# ملاحظاتي في CyberLab\n\n'+notes.filter(n=>n.content.trim()&&lessons.some(l=>l.id===n.id)).map(n=>'## '+lessons.find(l=>l.id===n.id)!.title+'\n\n'+n.content+'\n').join('\n');
}
export default function LearningDesk({lessons}:{lessons:PublicLesson[]}){
 const {learning,user,loading,error}=useProgress(),[message,setMessage]=useState('');
 if(!user||loading||error)return null;
 const valid=new Set(lessons.map(l=>l.id)),bookmarks=(learning.bookmarks||[]).filter(b=>valid.has(b.id)),notes=(learning.notes||[]).filter(n=>valid.has(n.id)&&n.content.trim()).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 if(!bookmarks.length&&!notes.length)return null;
 function download(){try{const url=URL.createObjectURL(new Blob([notesMarkdown(lessons,notes)],{type:'text/markdown;charset=utf-8'})),anchor=document.createElement('a');anchor.href=url;anchor.download='cyberlab-notes.md';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('جُهّز ملف ملاحظاتك للتحميل.')}catch{setMessage('تعذر تجهيز الملف. يمكنك فتح الدرس ونسخ ملاحظتك.')}}
 return <details className="atlas-desk"><summary>مكتبي الدراسي <span>{bookmarks.length} مراجع محفوظة · {notes.length} ملاحظات</span></summary>
  <div className="atlas-desk-columns"><section><h2>مراجعي المحفوظة</h2>{bookmarks.length?<ul>{bookmarks.slice(0,4).map(b=><li key={b.id}><a href={'/learn/'+b.id}>{lessons.find(l=>l.id===b.id)!.title}</a></li>)}</ul>:<p>احفظ مرجعًا من داخل الدرس ليظهر هنا.</p>}<a href="/learn?saved=1">عرض المراجع المحفوظة</a></section>
  <section><h2>آخر ملاحظاتي</h2>{notes.length?<><ul>{notes.slice(0,3).map(n=><li key={n.id}><a href={'/learn/'+n.id+'#study-tools'}>{lessons.find(l=>l.id===n.id)!.title}</a><p>{n.content.slice(0,140)}{n.content.length>140?'…':''}</p></li>)}</ul><button type="button" className="secondary-button" onClick={download}>تحميل ملاحظاتي</button></>:<p>اكتب ملاحظتك داخل الدرس واحفظها في حسابك.</p>}</section></div>
  {message&&<p role="status">{message}</p>}
 </details>;
}
