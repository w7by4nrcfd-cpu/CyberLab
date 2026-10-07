export const defensiveIds=['SOC-004','SOC-010'] as const;
export const defensivePhases=['brief','triage','evidence','correlate','assess','respond','verify','report','result'] as const;
export type DefensivePhase=typeof defensivePhases[number];
export const isDefensiveId=(id:string)=>defensiveIds.includes(id as typeof defensiveIds[number]);
export function defensiveHref(id:string){return '/soc/alerts/'+id+(isDefensiveId(id)?'?view=defensive':'');}
export function defensiveReturnPath(value:string){try{if(!value.startsWith('/'))return null;const u=new URL(value,'https://cyberlab.invalid');if(u.origin!=='https://cyberlab.invalid'||u.searchParams.get('view')!=='defensive'||!defensiveIds.some(id=>u.pathname==='/soc/alerts/'+id))return null;const step=u.searchParams.get('step');return u.pathname+'?view=defensive&step='+(defensivePhases.includes(step as DefensivePhase)?step:'evidence')}catch{return null}}
export const responsePlans=[{id:'complete',label:'عزل الخادم، إنهاء الجلسة، حفظ السجلات',response:'contain' as const},{id:'file-only',label:'حجر الملف فقط',response:'contain' as const},{id:'scoped-close',label:'إغلاق التنبيه المحدد وإبقاء التشغيل والمراقبة',response:'dismiss' as const},{id:'disable',label:'إيقاف المهمة وتعطيل مراقبة المهام',response:'contain' as const}];
