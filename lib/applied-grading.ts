import {appliedQuestions} from './curriculum-expansion';

// Server-only answers: keep outside client-imported lesson data.
const key:Record<string,{answers:[number,number[]|number,string[]];reasons:[string,string,string]}>= {
 'it-2':{answers:[1,[0,1],['ram']],reasons:['قارن استهلاك الذاكرة لكل عملية بدل افتراض أن القرص أو الشبكة هو السبب.','RAM مؤقتة للتشغيل، بينما القرص يحفظ الملفات بعد الإيقاف؛ لا يزيل القرص الأكبر ضغط RAM.','RAM هي ذاكرة الوصول العشوائي أثناء التشغيل.']},
 'it-12':{answers:[1,[0,1,2],['troubleshooting','trouble shooting']],reasons:['جهاز ثانٍ يميز عطل جهاز واحد عن عطل الوجهة المشتركة.','ابدأ بالعرض، ثم اختبار فرضية واحدة، ثم أعد القياس ووثّق.','Troubleshooting تعني استكشاف الأعطال منهجيًا.']},
 'network-5':{answers:[0,[0,1],['/24','24']],reasons:['‎192.168.51.10‎ خارج شبكة ‎192.168.50.0/24‎ ويحتاج إلى بوابة.','‎192.168.50.1‎ و‎192.168.50.30‎ ضمن نطاق ‎/24‎ نفسه.','القناع ‎255.255.255.0‎ يساوي ‎/24‎.']},
 'network-8':{answers:[0,[0,1],['nslookup']],reasons:['نجاح IP وفشل الاسم يشيران أولًا إلى المحلل أو عنوان DNS المضبوط.','اجمع نجاح الاتصال عبر IP مع فشل استعلام الاسم قبل تغيير أي إعداد.','nslookup يستعلم عن سجلات الاسم؛ ping إلى IP يختبر الوصول بصورة منفصلة.']},
 'network-9':{answers:[0,[0,1,2],['dhcp']],reasons:['غياب البوابة والعنوان الذاتي قرينتان على عدم اكتمال التأجير؛ افحص الوصلة وDHCP.','اقرأ الإعداد، قارن الوصلة بجهاز سليم، ثم جدد التأجير واختبر من جديد.','DHCP يمنح إعدادات مثل IP والقناع والبوابة وDNS.']},
 'security-1':{answers:[0,[0,1],['integrity']],reasons:['التغيير دون إذن يمس سلامة البيانات (Integrity) مع بقاء الملف متاحًا.','النسخ الاحتياطي يدعم التوافر وتقييد القراءة يدعم السرية.','Integrity تعني سلامة البيانات وعدم تغييرها دون تصريح.']},
 'security-8':{answers:[0,[0,1],['reply-to','reply to','replyto']],reasons:['تحقق من الطلب بقناة مستقلة، واحفظ الرسالة والترويسة للتحقيق.','اختلاف Reply-To وطلب رمز MFA خارج القناة المعتادة دليلان أقوى من الشعار.','Reply-To يحدد عنوان الرد؛ قد يختلف عن From الظاهر.']},
 'soc-2':{answers:[0,[0,1,2],['authentication log','authentication logs','auth log','auth logs','login log','login logs']],reasons:['اجمع نشاط الجلسة التي نتجت من النجاح لفهم الأثر والنطاق.','حدد الحساب والوقت، رشح المصدر والنتيجة، ثم افحص النشاط بعد النجاح.','Authentication log أو Login log يسجل أحداث محاولة الدخول.']},
 'soc-7':{answers:[0,[0,1],['false positive','false-positive']],reasons:['تثبت الموافقة والسجل المستقل إذا كانت المهمة مشروعة؛ الشدة وحدها لا تكفي.','سجل التغيير والتوقيع والمالك يدعمون استنتاج النشاط المشروع.','False Positive تنبيه تحقق منه المحلل ولم يجد الحادث الذي زعمه التنبيه.']}
};
const normalize=(v:string)=>v.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g,' ');
export function gradeAppliedQuiz(id:string,answers:unknown){
 const entry=key[id],questions=appliedQuestions[id];if(!entry||!questions)return null;
 if(!Array.isArray(answers)||answers.length!==questions.length)throw Error('أجب عن جميع الأسئلة.');
 const feedback=questions.map((q,i)=>{
  const chosen=answers[i],expected=entry.answers[i];
  if(i===0&&(!Number.isInteger(chosen)||Number(chosen)<0||Number(chosen)>=q.options.length))throw Error('اختر إجابة صالحة.');
  if(i===1&&(!Array.isArray(chosen)||chosen.length!==new Set(chosen).size||chosen.some(v=>!Number.isInteger(v)||v<0||v>=q.options.length)))throw Error('اختر ترتيبًا أو خيارات صالحة.');
  if(i===2&&(typeof chosen!=='string'||chosen.length>100))throw Error('اكتب إجابة قصيرة صالحة.');
  const correct=i===0?chosen===expected:i===1?Array.isArray(expected)&&Array.isArray(chosen)&&expected.length===chosen.length&&expected.every((v,j)=>q.type==='multi'?chosen.includes(v):chosen[j]===v):Array.isArray(expected)&&typeof chosen==='string'&&expected.some(v=>typeof v==='string'&&normalize(v)===normalize(chosen));
  return {correct,answer:i===2?(expected as string[])[0]:expected,chosen,explanation:entry.reasons[i],topic:q.topic||q.prompt,options:q.options};
 });
 const score=feedback.filter(f=>f.correct).length;
 return {score,total:3,passed:score>=2,feedback,reviewTopics:feedback.filter(f=>!f.correct).map(f=>f.topic)};
}
