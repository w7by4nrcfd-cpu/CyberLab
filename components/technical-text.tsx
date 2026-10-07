// Keep paths, addresses and English terms in reading order within Arabic prose.
export default function TechnicalText({text}:{text:string}) {
 const parts=text.split(/([/\\.]?[A-Za-z0-9_][A-Za-z0-9_./:\\@+%\-]*(?: +[A-Za-z0-9_][A-Za-z0-9_./:\\@+%\-]*)*)/g);
 return <>{parts.map((part,i)=>i%2?<bdi dir="ltr" key={i}>{part}</bdi>:part)}</>;
}
