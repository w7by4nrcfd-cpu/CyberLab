export const skillCatalog=[
 {id:'networking',name:'Networking',description:'العنونة والخدمات وتشخيص الشبكات'},
 {id:'linux',name:'Linux',description:'الطرفية والملفات والخدمات'},
 {id:'windows',name:'Windows',description:'إدارة نظام Windows وحساباته'},
 {id:'cybersecurity',name:'Cybersecurity Fundamentals',description:'مبادئ الحماية والحسابات الآمنة'},
 {id:'phishing',name:'Phishing Analysis',description:'فحص الرسائل وروابط التصيّد'},
 {id:'logs',name:'Log Analysis',description:'قراءة السجلات واستخراج الأنماط'},
 {id:'incident',name:'Incident Response',description:'اتخاذ إجراء مدروس عند رصد حادث'},
 {id:'troubleshooting',name:'Troubleshooting',description:'عزل الأعطال وتجريب الإصلاحات'}
] as const;
export type SkillId=typeof skillCatalog[number]['id'];
export const skillName=(id:string)=>skillCatalog.find(s=>s.id===id)?.name||id;
export function skillLevel(xp:number){return Math.floor(xp/200)+1}
export function skillProgress(xp:number){return Math.floor(xp%200/2)}
