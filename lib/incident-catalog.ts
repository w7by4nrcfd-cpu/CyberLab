export type Difficulty='beginner'|'intermediate'|'advanced';
export type IncidentTemplateId='phishing'|'endpoint'|'network-auth';
export const difficulties:Difficulty[]=['beginner','intermediate','advanced'];
export const incidentTemplates=[
 {id:'phishing',title:'رسالة مشبوهة',description:'اربط الرسالة بحركة الحساب وأثرها على الجهاز.',missionHref:'/missions/003'},
 {id:'endpoint',title:'نشاط جهاز غير مألوف',description:'قارن سلسلة العمليات والملف والاتصال.',missionHref:'/soc'},
 {id:'network-auth',title:'مصادقة واتصال شبكة',description:'اربط جلسة الهوية بحركة الشبكة وأصل الشركة.',missionHref:'/missions/004'}
] as const;
