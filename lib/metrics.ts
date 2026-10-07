import type {Learning,Item} from '@/app/shell';
import {lessons,tracks} from './curriculum';
export function completedIds(items:Item[],learning:Learning){return new Set([...items.filter(i=>i.kind==='quiz').map(i=>i.id),...learning.activity.filter(a=>a.completedAt).map(a=>a.id)])}
export function learningMetrics(items:Item[],learning:Learning){
 const done=completedIds(items,learning);
 const totalSeconds=learning.activity.reduce((s,a)=>s+a.seconds,0);
 const dates=new Set([...learning.dailyTime.map(a=>a.day),...items.map(i=>i.completedAt.slice(0,10))]);
 let streak=0;const day=new Date();day.setUTCHours(0,0,0,0);if(!dates.has(day.toISOString().slice(0,10)))day.setUTCDate(day.getUTCDate()-1);while(dates.has(day.toISOString().slice(0,10))){streak++;day.setUTCDate(day.getUTCDate()-1)}
 const today=new Date().toISOString().slice(0,10);const todayMinutes=Math.floor((learning.dailyTime.find(a=>a.day===today)?.seconds||0)/60);
 const xp=items.reduce((s,i)=>s+i.xp,0);
 const badges=[{id:'first',title:'الخطوة الأولى',earned:done.size>=1,description:'أكمل درسًا واحدًا'},{id:'five',title:'مواظب',earned:done.size>=5,description:'أكمل خمسة دروس'},{id:'explorer',title:'مستكشف المسارات',earned:new Set(lessons.filter(l=>done.has(l.id)).map(l=>l.track)).size>=3,description:'تعلم في ثلاثة مسارات'},{id:'labs',title:'مجرّب آمن',earned:items.some(i=>i.kind==='lab'),description:'أكمل مختبرًا آمنًا'},{id:'streak',title:'عادة التعلم',earned:streak>=3,description:'تعلم ثلاثة أيام متتالية'},{id:'track',title:'مسار مكتمل',earned:tracks.some(t=>lessons.filter(l=>l.track===t.id).every(l=>done.has(l.id))),description:'أكمل مسارًا كاملًا'}];
 return {done,totalSeconds,streak,todayMinutes,xp,badges};
}
