import type {TaskBrief as Brief} from '@/lib/practical-training';
export default function TaskBrief({brief}:{brief:Brief|undefined}){if(!brief)return null;return <dl className="practical-brief"><div><dt>سؤال التحقيق</dt><dd>{brief.question}</dd></div><div><dt>المطلوب تسليمه</dt><dd>{brief.deliverable}</dd></div><div><dt>معيار الاستنتاج</dt><dd>{brief.check}</dd></div></dl>}
