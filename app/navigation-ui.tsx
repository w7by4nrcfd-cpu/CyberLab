'use client';
import Link from '@/components/native-link';
import {Activity,BookOpen,FlaskConical,LayoutDashboard,Search,TrendingUp,UserRound} from 'lucide-react';
import {useSidebar} from '@/components/ui/sidebar';
import {crumbsForPath,groupForPath,navigationGroups} from '@/lib/site-navigation';

const icons={learn:BookOpen,practice:FlaskConical,operations:Activity,progress:TrendingUp,profile:UserRound};
export function SiteNavigation({path}:{path:string}){
 const {setOpenMobile}=useSidebar(),active=groupForPath(path);
 const navigate=()=>setOpenMobile(false);
 return <nav className="site-navigation compact-navigation" aria-label="أقسام CyberLab"><Link className={'site-nav-home '+(path==='/'?'active':'')} href="/" aria-current={path==='/'?'page':undefined} onClick={navigate}><LayoutDashboard size={19}/>الرئيسية</Link>{navigationGroups.map(group=>{const Icon=icons[group.id as keyof typeof icons];return <Link className={'site-nav-home '+(active===group.id?'active':'')} href={group.href} key={group.id} onClick={navigate} aria-current={path===group.href?'page':undefined}><Icon size={19}/>{group.label}</Link>})}</nav>;
}

export function SiteBreadcrumbs({path}:{path:string}){const crumbs=crumbsForPath(path);return <nav className="site-breadcrumbs" aria-label="مسار الصفحة"><Link href="/" aria-label="لوحة التحكم">الرئيسية</Link>{crumbs.map((c,i)=><span key={i} className="site-breadcrumb"><span aria-hidden="true">/</span>{i===crumbs.length-1?<span aria-current="page">{c.label}</span>:<a href={c.href}>{c.label}</a>}</span>)}</nav>}

export function SiteSearch(){return <form role="search" action="/search" className="global-search"><input name="q" aria-label="البحث في CyberLab" placeholder="ابحث في CyberLab…" maxLength={100}/><button type="submit" aria-label="بحث"><Search size={18}/></button></form>}
