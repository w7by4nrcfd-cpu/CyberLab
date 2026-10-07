'use client';
import {useState} from 'react';
import type {LabSession} from '@/lib/interactive-lab-engine';
import {labReport} from '@/lib/practical-training';
export default function LabReport({id,title,session}:{id:string;title:string;session:LabSession}){
 const [message,setMessage]=useState(''),report=labReport(id,title,session);
 if(!report)return null;
 function download(){try{const url=URL.createObjectURL(new Blob([report!],{type:'text/markdown;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='cyberlab-'+id+'-report.md';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('جُهّز ملخص الفحص للتحميل.')}catch{setMessage('تعذر التحميل. يمكنك نسخ النص من معاينة الملخص.')}}
 return <section className="practical-report"><h3>ملخص فحصك</h3><p>فحوص هذه المحاولة وأدلتها ونتيجتها، من الجلسة المحفوظة.</p><button className="secondary-button" type="button" onClick={download}>تحميل ملخص الفحص</button><details><summary>معاينة الملخص</summary><pre dir="auto">{report}</pre></details>{message&&<p role="status">{message}</p>}</section>;
}
