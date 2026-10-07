'use client';
import {dynamicReturnPath} from '@/lib/dynamic-presentation';
import { usePathname,useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, lazy, Suspense } from 'react';
import LoadingState from '@/components/loading-state';
import {emptyLearning,useSavedProgress} from './use-saved-progress';
const AppFrame=lazy(()=>import('./app-frame'));
export type Item = {
    id: string;
    kind: string;
    score: number;
    xp: number;
    completedAt: string;
};
type State = {
    items: Item[];
    loading: boolean;
    error: string;
    refresh: () => Promise<void>;
    user: {
        name: string;
        email: string;
    } | null;
    learning: Learning;
    update: (action:Record<string,unknown>)=>Promise<void>;
};
export type Learning={activity:{id:string;startedAt:string;lastAt:string;seconds:number;completedAt:string|null}[];notes:{id:string;content:string;updatedAt:string}[];bookmarks:{id:string;createdAt:string}[];attempts:{id:string;score:number;total:number;createdAt:string}[];dailyTime:{day:string;seconds:number}[];preferences:{dailyGoal:number;theme:string}};
const blank:Learning=emptyLearning();
const Context = createContext<State>({ items: [], learning:blank,update:async()=>{},loading: false, error: '', refresh: async () => { }, user: null });
export const useProgress = () => useContext(Context);
export default function Shell({ children, user, signIn }: {
    children: React.ReactNode;
    user: State['user'];
    signIn: string;
}) {
    const path = usePathname();
    const query=useSearchParams();
    const {items,learning,loading,error,refresh,update}=useSavedProgress(user?.email||'');
    useEffect(()=>{document.documentElement.dataset.theme=learning.preferences.theme},[learning.preferences.theme]);
    useEffect(() => { const mc = (document as unknown as {
        modelContext?: {
            registerTool: (tool: unknown, options: unknown) => Promise<void>;
        };
    }).modelContext; if (!mc)
        return; const lifecycle = new AbortController(); try {
        void Promise.resolve(mc.registerTool({ name: 'read_learning_progress', description: 'Read the signed-in learner progress currently visible in CyberLab.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: (input: unknown) => { if (!input || typeof input !== 'object' || Object.keys(input).length)
                throw Error('Expected an empty object'); return { signedIn: !!user, loading, error, items, xp: items.reduce((s, i) => s + i.xp, 0) }; } }, { signal: lifecycle.signal })).catch(() => { });
    }
    catch { } return () => lifecycle.abort(); }, [items, loading, error, user]);
    const signInHere = path && !['/', '/callback', '/signin-with-chatgpt', '/signout-with-chatgpt'].includes(path) ? `/signin-with-chatgpt?return_to=${encodeURIComponent(path)}` : signIn;
    if(/^\/investigations\/dynamic-(phishing|endpoint|network-auth)-[0-9a-f]{8}$/.test(path)||path.startsWith('/learn/')&&!!dynamicReturnPath(query.get('return_to')||'')||['/soc/alerts/SOC-004','/soc/alerts/SOC-010'].includes(path)&&query.get('view')==='defensive'||path.startsWith('/learn/')&&/^\/soc\/alerts\/SOC-(004|010)\?view=defensive/.test(query.get('return_to')||'')||path==='/experience/nexacorp-response'||path.startsWith('/learn/')&&(query.get('return_to')||'').startsWith('/experience/nexacorp-response?')||['/labs/v2/v2-access-control','/labs/v2/v2-attack-surface','/labs/v2/v2-auth-session'].includes(path)||['/labs/v2/v2-access-control','/labs/v2/v2-access-control?track=offensive','/labs/v2/v2-attack-surface','/labs/v2/v2-auth-session'].includes(query.get('return_to')||'')&&path.startsWith('/learn/')||path==='/experience/nexacorp-first'||path==='/experience/nexacorp-email'||path==='/campaigns/first-signal'&&query.get('view')!=='full'||path==='/soc/alerts/SOC-002'&&query.get('view')==='guided'||path==='/investigations/soc-SOC-002'&&query.get('journey')==='core')return <Context.Provider value={{items,learning,update,loading,error,refresh,user}}><main id="main" tabIndex={-1} className="pilot-root">{children}</main></Context.Provider>;
    return <Context.Provider value={{ items, learning, update, loading, error, refresh, user }}><Suspense fallback={<div className="main-content"><LoadingState>جارٍ فتح مساحة العمل…</LoadingState></div>}><AppFrame path={path} signInHere={signInHere}>{children}</AppFrame></Suspense></Context.Provider>;
}
