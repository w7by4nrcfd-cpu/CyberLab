import {lessons,tracks} from './curriculum';
import {paths} from './paths';
export type NavigationItem={href:string;label:string};
export type NavigationGroup={id:string;label:string;href:string;items:NavigationItem[]};

// The original routes remain canonical so bookmarks, saved lessons and return URLs keep working.
export const navigationGroups:NavigationGroup[]=[
 {id:'learn',label:'التعلّم',href:'/learn',items:[{href:'/roadmap',label:'خارطة التعلم'},{href:'/guide',label:'دليل CyberLab'}]},
 {id:'practice',label:'التدريب',href:'/practice',items:[{href:'/labs',label:'المختبرات'},{href:'/missions',label:'المهمات'},{href:'/bosses',label:'التحقيقات المتقدمة'}]},
 {id:'operations',label:'العمليات',href:'/operations',items:[{href:'/operations/nexacorp',label:'NexaCorp'},{href:'/soc',label:'مركز العمليات SOC'},{href:'/campaigns',label:'الحملة القصصية'}]},
 {id:'progress',label:'تقدمي',href:'/progress',items:[{href:'/skills',label:'المهارات والإتقان'},{href:'/career',label:'المسار المهني'},{href:'/profile#ranks',label:'الرتبة والمستوى'},{href:'/achievements',label:'الإنجازات'}]},
 {id:'profile',label:'حسابي',href:'/profile',items:[{href:'/history',label:'سجل التعلم'},{href:'/settings',label:'الإعدادات'},{href:'/notifications',label:'الإشعارات'},{href:'/account',label:'إدارة الحساب'}]}
];
export type Crumb={href:string;label:string};
const crumb=(href:string,label:string):Crumb=>({href,label});
export function crumbsForPath(path:string):Crumb[]{
 const p=path.split('/').filter(Boolean),group=navigationGroups.find(g=>g.href==='/' + p[0]||g.items.some(i=>!i.href.includes('#')&&i.href==='/' + p[0]));
 if(!p.length)return [];
 if(p[0]==='search')return [crumb('/search','البحث')];
 if(p[0]==='tracks')return [crumb('/learn','التعلّم'),crumb('/learn','المسارات'),crumb(path,tracks.find(t=>t.id===p[1])?.name||'تفاصيل المسار')];
 if(p[0]==='paths')return [crumb('/learn','التعلّم'),crumb('/roadmap','خارطة التعلم'),crumb(path,paths.find(x=>x.id===p[1])?.name||'تفاصيل الرحلة')];
 if(p[0]==='learn'&&p[1]){const lesson=lessons.find(l=>l.id===p[1]);if(!lesson)return [crumb('/learn','التعلّم'),crumb(path,'الدرس')];const track=tracks.find(t=>t.id===lesson.track),level=lesson.level||1,all=lessons.filter(l=>l.track===lesson.track&&(l.level||1)===level),modules=[...new Set(all.map(l=>l.module||'الأساسيات'))],index=modules.indexOf(lesson.module||'الأساسيات');return [crumb('/learn','التعلّم'),crumb('/tracks/'+lesson.track,track?.name||'المسار'),crumb('/tracks/'+lesson.track+'#module-'+level+'-'+index,lesson.module||'الأساسيات'),crumb(path,lesson.title)];}
 if(p[0]==='labs'&&p.length>1)return [crumb('/practice','التدريب'),crumb('/labs','المختبرات'),crumb(path,'المختبر')];
 if(p[0]==='missions'&&p[1])return [crumb('/practice','التدريب'),crumb('/missions','المهمات'),crumb(path,'المهمة')];
 if(p[0]==='bosses'&&p[1])return [crumb('/practice','التدريب'),crumb('/bosses','التحقيقات المتقدمة'),crumb(path,'التحقيق')];
 if(p[0]==='campaigns'&&p[1])return [crumb('/operations','العمليات'),crumb('/campaigns','الحملة القصصية'),crumb(path,'First Signal')];
 if(p[0]==='soc'&&p[1])return [crumb('/operations','العمليات'),crumb('/soc','مركز العمليات SOC'),crumb(path,p[1]==='alerts'?'التحقيق في تنبيه':'القضية')];
 if(p[0]==='guide')return [crumb('/learn','التعلّم'),crumb(path,'دليل المشروع')];
 if(group){const item=group.items.find(i=>i.href.split('#')[0]===path);return [crumb(group.href,group.label),...(item&&item.href!==group.href?[crumb(path,item.label)]:[])];}
 return [crumb(path,'الصفحة')];
}
export function groupForPath(rawPath:string){const path=rawPath.split(/[?#]/)[0];if(path==='/')return null;if(path.startsWith('/tracks/')||path.startsWith('/paths/')||path.startsWith('/guide'))return 'learn';if(path.startsWith('/search'))return null;return navigationGroups.find(g=>path===g.href||path.startsWith(g.href+'/')||g.items.some(i=>!i.href.includes('#')&&(path===i.href||path.startsWith(i.href+'/'))))?.id??null;}
