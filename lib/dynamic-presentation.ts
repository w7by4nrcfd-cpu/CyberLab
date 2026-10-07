/** UI-only knowledge mappings. No expected answers or generator metadata. */
export const dynamicSteps=['brief','observe','connect','decide','result'] as const;
export function dynamicReturnPath(input:string){
 try{const u=new URL(input,'https://local.invalid');if(u.origin!=='https://local.invalid'||!/^\/investigations\/dynamic-(phishing|endpoint|network-auth)-[0-9a-f]{8}$/.test(u.pathname))return null;
 const q=new URLSearchParams(),step=u.searchParams.get('step'),field=u.searchParams.get('field');if(step&&(dynamicSteps as readonly string[]).includes(step))q.set('step',step);if(field&&/^[a-z0-9-]{1,40}$/.test(field))q.set('field',field);return u.pathname+(q.size?'?'+q:'');}catch{return null}
}
export const dynamicKnowledge:Record<string,{title:string;text:string;lessonId:string}>={
 email:{title:'مسار البريد والهوية',text:'اسم العرض ليس إثباتًا. قارن مسار البريد والوجهة بسجل المؤسسة، ثم اربطهما بأحداث الهوية.',lessonId:'security-8'},
 account:{title:'المحاولة أم الجلسة؟',text:'وصول اتصال أو وجود محاولات فاشلة لا يثبت دخولًا. افحص نتيجة المصادقة ومصدر الجلسة والجهاز.',lessonId:'security-5'},
 process:{title:'ربط نشاط العملية',text:'اسم الأداة وحده لا يثبت اختراقًا. طابق معرف العملية والحساب والملف والوجهة مع سياق التشغيل المعتمد.',lessonId:'soc-3'},
 file:{title:'الملف وسياق التشغيل',text:'قارن توقيع الملف ومعرف الأثر بالعملية والتغيير المعتمد. ملف غير موقع وحده ليس استنتاجًا كاملًا.',lessonId:'soc-3'},
 network:{title:'اتصال الشبكة ونتيجته',text:'طابق المصدر والوجهة والتوقيت مع سجل الهوية أو العملية. اتصال established يثبت النقل، ولا يثبت نجاح المصادقة.',lessonId:'net-3'},
 links:{title:'لماذا أربط الأدلة؟',text:'وثّق الملاحظة التي تثبت العلاقة: معرف العملية أو الحساب أو الحدث والتوقيت. تشابه الأسماء وحده لا يكفي.',lessonId:'soc-2'}
};
