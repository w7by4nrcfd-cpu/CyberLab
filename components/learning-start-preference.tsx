'use client';
import {useEffect,useState} from 'react';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {parseStartPreference,type StartPreference} from '@/lib/learning-start';

const experiences=[['new','أبدأ من الصفر'],['foundation','لدي أساس في الحاسب والشبكات'],['practiced','سبق أن مارست تدريبات تقنية']];
const goals=[['support','الدعم الفني والشبكات'],['defense','تحليل الرسائل والتحقيق الأمني'],['explore','استكشاف الأمن السيبراني']];
export function useStartPreference(account:string){
 const key='cyberlab-start-preference:'+encodeURIComponent(account);
 const [saved,setSaved]=useState<{key:string;value:StartPreference|null}>({key:'',value:null}),[notice,setNotice]=useState('');
 useEffect(()=>{let value:StartPreference|null=null;try{value=parseStartPreference(JSON.parse(localStorage.getItem(key)||'null'))}catch{}setSaved({key,value});setNotice('')},[key]);
 function apply(value:StartPreference|null){setSaved({key,value});try{if(value)localStorage.setItem(key,JSON.stringify(value));else localStorage.removeItem(key);setNotice(value?'حُفظ تفضيل البداية على هذا الجهاز.':'أُلغي تخصيص البداية؛ تبقى خطوتك التالية حسب تقدمك.')}catch{setNotice('طُبق الاختيار الآن، لكن تعذر حفظ التفضيل على هذا الجهاز.')}}
 return {preference:saved.key===key?saved.value:null,apply,notice};
}
export default function LearningStartPreference({preference,onApply,notice,started}:{preference:StartPreference|null;onApply:(value:StartPreference|null)=>void;notice:string;started:boolean}){
 const [experience,setExperience]=useState(''),[goal,setGoal]=useState('');
 useEffect(()=>{setExperience(preference?.experience||'');setGoal(preference?.goal||'')},[preference]);
 const valid=parseStartPreference({experience,goal});
 return <details className="start-preference"><summary>{preference?'عدّل تفضيل بدايتك':'اختر بداية تناسبك · سؤالان اختياريان'}</summary>
  <p>{started?'نشاطك المحفوظ له الأولوية؛ تعديل التفضيل لا ينقلك إلى بداية أخرى.':'يمكنك التخطي والبدء بالتدريب المقترح مباشرة. اختيار الخبرة يساعد في الاقتراح، ولا يثبت إتقان المهارة.'}</p>
  <fieldset><legend>ما خبرتك الحالية؟</legend><RadioGroup value={experience} onValueChange={setExperience} dir="rtl" aria-label="خبرتك الحالية">{experiences.map(([id,label])=><label className="start-choice" key={id} htmlFor={'start-experience-'+id}><RadioGroupItem value={id} id={'start-experience-'+id}/><span>{label}</span></label>)}</RadioGroup></fieldset>
  <fieldset><legend>ما هدفك الأول؟</legend><RadioGroup value={goal} onValueChange={setGoal} dir="rtl" aria-label="هدفك الأول">{goals.map(([id,label])=><label className="start-choice" key={id} htmlFor={'start-goal-'+id}><RadioGroupItem value={id} id={'start-goal-'+id}/><span>{label}</span></label>)}</RadioGroup></fieldset>
  <div className="start-preference-actions"><button className="secondary-button" type="button" disabled={!valid} onClick={()=>{if(valid)onApply(valid)}}>طبّق اقتراح البداية</button><button className="email-secondary-link" type="button" onClick={()=>{setExperience('');setGoal('');onApply(null)}}>{preference?'استخدم البداية الافتراضية':'تخطَّ التخصيص'}</button></div>
  {notice&&<p role="status">{notice}</p>}<p className="pilot-footnote">تفضيل البداية خاص بهذا الجهاز. تقدم التدريب يُحفظ في حسابك بعد تسجيل الدخول؛ تغيير التفضيل لا يكمل نشاطًا أو يغيّر متطلبات فتحه.</p>
 </details>;
}
