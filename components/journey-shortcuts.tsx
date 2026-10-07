import Link from '@/components/native-link';
import {BookOpen,FlaskConical,TrendingUp} from 'lucide-react';

const links=[
 {href:'/learn',title:'مكتبة المعرفة',text:'ابحث عن مفهوم أو تابع مرجعًا بدأت به.',icon:BookOpen},
 {href:'/practice',title:'التدريب',text:'اختر مختبرًا أو مهمة تناسب ما تعلمته.',icon:FlaskConical},
 {href:'/progress',title:'تقدمي',text:'راجع المهارات والإنجازات والخطوة القادمة.',icon:TrendingUp}
];
export default function JourneyShortcuts(){return <nav className="journey-shortcuts" aria-label="المعرفة والتدريب والتقدم">{links.map(item=>{const Icon=item.icon;return <Link className="dashboard-direction" href={item.href} key={item.href}><Icon size={22} aria-hidden="true"/><strong>{item.title}</strong><p>{item.text}</p></Link>})}</nav>}
