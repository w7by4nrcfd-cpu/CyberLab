'use client';
import {useEffect,useRef,useState} from 'react';
export default function CopyExample({text,id}:{text:string;id:string}){
 const [notice,setNotice]=useState(''),active=useRef(id);active.current=id;
 useEffect(()=>{setNotice('')},[id]);
 async function copy(){const requested=id;try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);if(active.current===requested)setNotice('نُسخ المثال.')}catch{if(active.current===requested)setNotice('يمكنك تحديد المثال ونسخه يدويًا.')}}
 return <div className="copy-example"><button type="button" className="secondary-button" onClick={()=>void copy()}>نسخ المثال</button><span role="status">{notice}</span></div>;
}
