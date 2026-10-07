import type { Metadata,Viewport } from 'next';
import './globals.css';
import './progression/progression.css';
import './mobile-accessibility.css';
import './training-simplified.css';
import './atlas.css';
import './control-fixes.css';
import { getChatGPTUser, chatGPTSignInPath } from './chatgpt-auth';
import Shell from './shell';
export const metadata: Metadata = { title: 'CyberLab | تدريب الأمن السيبراني', description: 'تعلّم الأمن السيبراني عبر قضايا ومحاكاة آمنة داخل NexaCorp: أساسيات أمنية، دفاع وتحقيق واستجابة للحوادث.', icons: { icon: '/favicon.svg' } };
export const dynamic = 'force-dynamic';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover'};
export default async function RootLayout({ children }: {
    children: React.ReactNode;
}) {
    const user = await getChatGPTUser();
    return <html lang="ar" dir="rtl"><body><a className="skip-content" href="#main">انتقل إلى المحتوى</a><Shell user={user ? { name: user.fullName || user.email, email: user.email } : null} signIn={chatGPTSignInPath('/')}>{children}</Shell></body></html>;
}
