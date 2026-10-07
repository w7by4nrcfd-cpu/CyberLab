import type {ReactNode} from 'react';

// Static placeholders reserve reading space without motion or invented data.
export default function LoadingState({children}:{children:ReactNode}){
 return <div className="loading-state" role="status" aria-live="polite" aria-busy="true"><p>{children}</p><div className="loading-lines" aria-hidden="true"><span/><span/><span/></div></div>;
}
