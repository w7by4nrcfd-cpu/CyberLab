'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {clientJson} from '@/lib/client-json';
import type {Item,Learning} from './shell';

export const emptyLearning=():Learning=>({activity:[],notes:[],bookmarks:[],attempts:[],dailyTime:[],preferences:{dailyGoal:15,theme:'dark'}});
type Snapshot={owner:string;items:Item[];learning:Learning;loading:boolean;error:string};
const blank=(owner:string):Snapshot=>({owner,items:[],learning:emptyLearning(),loading:!!owner,error:''});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
export function validProgress(v:unknown):v is {items:Item[]}{return object(v)&&Array.isArray(v.items)&&v.items.every(i=>object(i)&&typeof i.id==='string'&&typeof i.kind==='string'&&finite(i.xp)&&finite(i.score)&&typeof i.completedAt==='string')}
export function validLearning(v:unknown):v is Learning{
 if(!object(v)||!object(v.preferences)||!finite(v.preferences.dailyGoal)||typeof v.preferences.theme!=='string'||!['dark','light'].includes(v.preferences.theme))return false;
 const arrays=['activity','notes','bookmarks','attempts','dailyTime'] as const;
 if(!arrays.every(key=>Array.isArray(v[key])))return false;
 return (v.activity as unknown[]).every(a=>object(a)&&typeof a.id==='string'&&finite(a.seconds)&&typeof a.startedAt==='string'&&typeof a.lastAt==='string'&&(a.completedAt===null||typeof a.completedAt==='string'))
  &&(v.notes as unknown[]).every(n=>object(n)&&typeof n.id==='string'&&typeof n.content==='string'&&typeof n.updatedAt==='string')
  &&(v.bookmarks as unknown[]).every(b=>object(b)&&typeof b.id==='string'&&typeof b.createdAt==='string')
  &&(v.attempts as unknown[]).every(a=>object(a)&&typeof a.id==='string'&&finite(a.score)&&finite(a.total)&&typeof a.createdAt==='string')
  &&(v.dailyTime as unknown[]).every(d=>object(d)&&typeof d.day==='string'&&finite(d.seconds));
}
export function useSavedProgress(accountKey:string){
 const [snapshot,setSnapshot]=useState<Snapshot>(()=>blank(accountKey));
 const owner=useRef(accountKey);owner.current=accountKey;
 const pending=useRef<{version:number;controller:AbortController|null}>({version:0,controller:null});
 const load=useCallback(async()=>{
  pending.current.controller?.abort();
  const version=++pending.current.version,controller=new AbortController();pending.current.controller=controller;
  const current=()=>owner.current===accountKey&&pending.current.version===version&&!controller.signal.aborted;
  if(!accountKey){setSnapshot(blank(''));return true}
  setSnapshot(previous=>({...((previous.owner===accountKey)?previous:blank(accountKey)),loading:true,error:''}));
  try{
   const [progress,learning]=await Promise.all([clientJson<unknown>('/api/progress',{signal:controller.signal}),clientJson<unknown>('/api/learning',{signal:controller.signal})]);
   if(!validProgress(progress)||!validLearning(learning))throw Error('تعذر قراءة سجل التقدم بشكل صحيح. أعد تحميله؛ لم تُغيّر بياناتك المحفوظة.');
   if(!current())return false;
   setSnapshot({owner:accountKey,items:progress.items,learning,loading:false,error:''});return true;
  }catch(e){if(current())setSnapshot(previous=>({...previous,loading:false,error:e instanceof Error?e.message:'تعذر تحميل التقدم.'}));controller.abort();return false}
 },[accountKey]);
 useEffect(()=>{void load();return()=>{pending.current.controller?.abort();pending.current.version++}},[load]);
 const refresh=useCallback(async()=>{await load()},[load]);
 const update=useCallback(async(action:Record<string,unknown>)=>{
  if(!accountKey||owner.current!==accountKey)throw Error('سجّل الدخول لحفظ تقدمك.');
  const result=await clientJson<{ok?:boolean}>('/api/learning',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)},{writing:true,message:'تعذر تأكيد الحفظ. أعد تحميل تقدمك قبل المحاولة مجددًا.'});
  if(owner.current!==accountKey)throw Error('تغير الحساب. أعد فتح الصفحة لعرض تقدم الحساب الحالي.');
  if(!result||result.ok!==true)throw Error('لم يصل تأكيد الحفظ. أعد تحميل تقدمك قبل تكرار العملية.');
  if(!await load())throw Error('تم تأكيد الحفظ، لكن تعذر تحديث العرض. أعد تحميل تقدمك لعرض النتيجة.');
 },[accountKey,load]);
 // Mask the previous account before effects run, not merely after a fetch resolves.
 const visible=snapshot.owner===accountKey?snapshot:blank(accountKey);
 return {...visible,refresh,update};
}
