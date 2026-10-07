type Props={hints:readonly [string,string,string]};

export default function ProgressiveHints({hints}:Props){
 return <details className="pilot-secondary"><summary>تحتاج مساعدة؟ تلميحات تدريجية</summary>
  <p><strong>1 · حدّد المقارنة:</strong> {hints[0]}</p>
  <details className="pilot-secondary"><summary>التلميح الثاني</summary>
   <p><strong>2 · اربط الأدلة:</strong> {hints[1]}</p>
   <details className="pilot-secondary"><summary>التلميح الثالث</summary><p><strong>3 · راجع القرار:</strong> {hints[2]}</p></details>
  </details>
 </details>;
}
