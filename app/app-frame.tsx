'use client';
import type {ReactNode,CSSProperties} from 'react';
import {UserRound,LogOut,ArrowUpLeft,Terminal} from 'lucide-react';
import {Sidebar,SidebarProvider,SidebarContent,SidebarHeader,SidebarFooter,SidebarTrigger} from '@/components/ui/sidebar';
import {Progress} from '@/components/ui/progress';
import {points} from '@/lib/progression';
import {levelFor} from '@/lib/simulations';
import {RankExperience} from './rank/experience';
import {SiteNavigation,SiteBreadcrumbs,SiteSearch} from './navigation-ui';
import {useProgress} from './shell';

// Same application frame; Focus activities do not load its navigation/dialog code.
export default function AppFrame({children,path,signInHere}:{children:ReactNode;path:string;signInHere:string}){
 const {items,loading,error,refresh,user}=useProgress();
 const xp=items.reduce((sum,item)=>sum+item.xp,0),level=levelFor(xp),progressUnavailable=!!user&&(loading||!!error);
 return <SidebarProvider style={{ '--sidebar-width': '204px' } as CSSProperties}><Sidebar side="right" className="app-sidebar"><SidebarHeader><a href="/" className="brand" dir="ltr"><span className="brand-icon"><Terminal size={25}/></span>Cyber<span>Lab</span></a></SidebarHeader><SidebarContent><SiteNavigation key={path} path={path}/></SidebarContent><SidebarFooter><div className="level-card">{progressUnavailable ? <span role="status">{error ? 'تعذر تحميل التقدم' : 'جارٍ تحميل التقدم…'}</span> : <><div className="between"><span>المستوى {level}</span><b>{xp} نقطة</b></div><Progress value={(xp % 200) / 2} aria-label="التقدم للمستوى التالي"/><small>{points(200 - xp % 200)} للمستوى التالي</small><a href="/progress" className="level-card-link">تفاصيل تقدمي</a></>}</div><a href="/account" className="account-link"><span className="avatar"><UserRound size={18}/></span><span>{user ? 'حساب المتعلم' : 'زائر CyberLab'}<small>{user ? 'التقدم مرتبط بحسابك' : 'سجّل الدخول لحفظ تقدمك'}</small></span></a></SidebarFooter></Sidebar><div className="workspace"><header className="topbar"><div className="top-path"><SidebarTrigger aria-label="فتح القائمة"/><SiteBreadcrumbs path={path}/></div><div className="top-actions"><SiteSearch/>{user ? <a href="/signout-with-chatgpt?return_to=/" target="_top" aria-label="تسجيل الخروج"><LogOut size={18}/></a> : <a href={signInHere} target="_top" className="signin">تسجيل الدخول <ArrowUpLeft size={16}/></a>}</div></header><main id="main" tabIndex={-1} className="main-content">{error && <div role="alert" className="error">{error}<button onClick={() => void refresh()}>إعادة المحاولة</button></div>}{children}</main><footer className="site-footer"><span dir="ltr">CYBERLAB / LEARN BY DOING</span></footer></div>{user&&<RankExperience xp={xp} ready={!progressUnavailable} accountKey={user.email}/>}</SidebarProvider>;
}
