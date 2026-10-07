import {deepPracticeQuestions} from './deep-practice';

// This module is imported only by server grading. No answers live in the client lesson model.
type AnswerKey={first:number;second:number[];aliases:string[];feedback:[string,string,string]};
const keys:Record<string,AnswerKey>={
 'it-10':{first:0,second:[0,1],aliases:['pid'],feedback:['المسار المؤقت، غياب التوقيع، وأب هو عارض البريد تبرر حفظ تفاصيل العملية وتصعيد الفحص؛ نسبة CPU المنخفضة لا تبرئها.','سلسلة التشغيل والمسار والتوقيع أدلة عملية؛ الاسم أو استهلاك الموارد منفردان لا يحسمان شرعية العملية.','PID يربط العملية بسجلات أخرى حتى إذا تشابهت الأسماء.']},
 'it-11':{first:0,second:[0,1],aliases:['read','read only','read-only','r'],feedback:['حدد حق قراءة ملف واحد بعد تحقق من الموافقة؛ لا تمنح تطبيقًا صلاحية مدير نظام لأداء هذه المهمة.','أقل امتياز ومراجعة مدة الإذن يقللان الأثر إذا أسيء استخدام الحساب.','Read يسمح بعرض الملف؛ Write وAdmin يزيدان الصلاحيات بلا حاجة.']},
 'net-3':{first:0,second:[0,1],aliases:['udp'],feedback:['يمكن لتطبيق المكالمة اختيار UDP لتجنب انتظار إعادة إرسال الصوت القديم مع معالجة الفقد بحسب الحاجة.','TCP يوفر ترتيبًا وإعادة إرسال؛ UDP لا يضمنهما في طبقة النقل، ويمكن للتطبيق إضافة آلياته. لا يعني أي منهما تشفيرًا تلقائيًا.','UDP لا يضمن ترتيب الحزم في طبقة النقل.']},
 'network-7':{first:0,second:[0,1],aliases:['default gateway','gateway','بوابة افتراضية','البوابة الافتراضية'],feedback:['البوابة المضبوطة ‎.254‎ لا تستجيب، بينما الموجّه المعتمد ‎.1‎؛ صحح إعداد الجهاز واختبر قبل تعديل مسارات الموجّه.','المقارنة بين مقصد محلي وبين البوابة ومقصد بعيد تعزل نقطة الفشل؛ فحص الاسم وحده لا يفسر فشل IP.','Default Gateway هي البوابة التي يستخدمها الجهاز للوجهات خارج شبكته.']},
 'network-10':{first:0,second:[0,1],aliases:['pat','port address translation','nat overload'],feedback:['تصل PC-B إلى البوابة لكن لا تُنشأ ترجمة لمصدرها؛ راجع سياسة وجدول NAT قبل افتراض عطل DNS.','المنفذ العام في PAT يحدد اقتران الجلسة بالعنوان والمنفذ الداخليين عند الرد؛ NAT لا يشفّر.','PAT أو Port Address Translation يميز مصادر متعددة بمنافذ على عنوان عام.']},
 'security-9':{first:0,second:[0,1],aliases:['isolation','isolate','host isolation','network isolation','عزل','عزل المضيف'],feedback:['التوقيع وتذكرة الصيانة وغياب اتصال غريب قرائن مشروعة؛ تحقق منها ووثّق قبل تصنيف التنبيه.','الملف غير الموقع بعد جلسة شاذة واتصال خارجي بلا موافقة مؤشرات مترابطة تزيد خطر APP-02.','Isolation يفصل المضيف المتأثر وفق خطة الاستجابة؛ لا يمحو أدلة القرص.']},
 'sec-4':{first:0,second:[0,1],aliases:['salt','unique salt','random salt','الملح','ملح'],feedback:['استخدم دالة اشتقاق مخصصة لكلمات المرور مع ملح فريد؛ تشفير قابل للفك وSHA-256 سريع وحده لا يؤديان الوظيفة نفسها.','التشفير يحمي السرية بالمفتاح؛ مقارنة التجزئة مع مرجع موثوق تساعد في كشف تغيير الملف، لكنها لا تخفي محتواه.','Salt قيمة فريدة تدخل في اشتقاق بيانات التحقق من كلمة المرور.']},
 'soc-3':{first:0,second:[0,1],aliases:['parent process','parent','parentprocess','العملية الأم'],feedback:['سلسلة التنفيذ والجلسة والاتصال الخارجي تغير تفسير اسم update؛ اجمعها وصعّد للنظر في احتواء متناسب.','سجل الدخول واتصال العملية بالشبكة يوفران تأكيدًا مستقلًا لحدث الجهاز؛ الاسم أو الأيقونة لا يكفيان.','Parent process هي العملية التي بدأت عملية فرعية.']},
 'soc-4':{first:0,second:[0,1],aliases:['netflow','network flow','flow log','flow logs','network flow log'],feedback:['اربط التدفق المتكرر بالعملية غير الموقعة ثم صعّد؛ NetFlow لا يثبت محتويات ما نُقل، فلا تدّع تسريبًا مؤكدًا.','الوجهة والتذكرة والجدول تؤيد نسخ FILE-01؛ التكرار الخارجي دون تغيير معتمد يزيد أهمية APP-02.','NetFlow أو Network Flow يسجل بيانات وصفية للتدفق، لا مضمون الملف المنقول.']},
 'response-6':{first:0,second:[0,1],aliases:['containment','contain','احتواء'],feedback:['لدينا تحديث موقع وموافقة ولا دليل مؤيد آخر؛ تحقق ووثّق بدل تعطيل جهاز إنتاجي بسبب وسيط واحد.','في APP-02 النشاط جارٍ مع أدلة متقاطعة: احفظ الحد الأدنى من الأدلة، ثم نسق العزل وإلغاء الجلسة وفق الخطة.','Containment يحد استمرار النشاط أو انتشاره؛ القرار يتناسب مع الدليل والخطر.']},
 'soc-12':{first:0,second:[0,1],aliases:['soc-005','soc 005','soc005'],feedback:['اذكر وقت التنبيه والوجهة والتذكرة لتفسير إغلاق SOC-008، وافصل الحدث عن SOC-005 ما لم يثبت ارتباط.','الأوقات ومعرفات الأدلة تجعل الوقائع قابلة للمراجعة؛ حدود الثقة والخطوة التالية والمالك تجعل تسليم القضية عمليًا.','SOC-005 يتعلق باتصال APP-02، بينما SOC-008 نقل نسخة احتياطية من FILE-01.']}
};
const normalize=(s:string)=>s.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g,' ');
export function gradeDeepPracticeQuiz(id:string,answers:unknown){
 const key=keys[id],questions=deepPracticeQuestions[id];if(!key||!questions)return null;
 if(!Array.isArray(answers)||answers.length!==3)throw Error('أجب عن جميع الأسئلة.');
 const [first,second,third]=answers;
 if(!Number.isInteger(first)||Number(first)<0||Number(first)>=questions[0].options.length)throw Error('اختر قرارًا صالحًا.');
 if(!Array.isArray(second)||second.length!==new Set(second).size||second.some(v=>!Number.isInteger(v)||v<0||v>=questions[1].options.length))throw Error('اختر أدلة صالحة دون تكرار.');
 if(typeof third!=='string'||!third.trim()||third.length>100)throw Error('اكتب إجابة قصيرة صالحة.');
 const chosen=[first,second,third],expected=[key.first,key.second,key.aliases[0]];
 const correct=[first===key.first,second.length===key.second.length&&key.second.every(v=>second.includes(v)),key.aliases.some(alias=>normalize(third)===normalize(alias))];
 const feedback=questions.map((q,i)=>({correct:correct[i],answer:expected[i],chosen:chosen[i],explanation:key.feedback[i],topic:q.topic||q.prompt,options:q.options}));
 const score=correct.filter(Boolean).length;
 // The independent case must be solved. A remembered acronym and one evidence
 // checkbox cannot complete a practical lesson while the actual decision is wrong.
 return {score,total:3,passed:correct[0]&&score>=2,feedback,reviewTopics:feedback.filter(f=>!f.correct).map(f=>f.topic)};
}
