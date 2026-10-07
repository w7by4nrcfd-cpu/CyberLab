'use client';
import {useState} from 'react';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import TechnicalText from '@/components/technical-text';
export type PracticeCase={id:string;title:string;facts:string;prompt:string;choices:{label:string;correct:boolean;feedback:string}[]};

// Optional coaching only: never calls a grading API or changes saved progress.
export default function PracticeCheck({scenario,activity='البلاغ'}:{scenario:PracticeCase;activity?:string}){
 const [choice,setChoice]=useState(''),[checked,setChecked]=useState(false);
 const selected=scenario.choices[Number(choice)];
 return <details className="pilot-secondary practice-check"><summary>{scenario.title}</summary>
  <p className="practice-check-facts"><TechnicalText text={scenario.facts}/></p>
  <fieldset><legend><TechnicalText text={scenario.prompt}/></legend>
   <RadioGroup dir="rtl" value={choice} onValueChange={value=>{setChoice(value);setChecked(false)}} aria-label={scenario.prompt}>
    {scenario.choices.map((item,i)=><label className="practice-check-option" key={i} htmlFor={`${scenario.id}-${i}`}><RadioGroupItem id={`${scenario.id}-${i}`} value={String(i)}/><span><TechnicalText text={item.label}/></span></label>)}
   </RadioGroup>
  </fieldset>
  <button className="secondary-button" type="button" disabled={!choice||checked} onClick={()=>setChecked(true)}>راجع استنتاجك</button>
  {checked&&selected&&<div className={'feedback '+(selected.correct?'success':'wrong')} role="status"><strong>{selected.correct?'استنتاج مناسب.':'راجع الدليل.'}</strong><p><TechnicalText text={selected.feedback}/></p></div>}
  <small>تمرين اختياري بلا نقاط؛ لا يغيّر إنجاز {activity}.</small>
 </details>;
}
