import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const compiled=await build({entryPoints:['lib/answer-evaluation.ts','lib/missions.ts'],bundle:true,platform:'node',format:'esm',outdir:'/virtual',write:false,logLevel:'silent'});
const imports=Object.fromEntries(await Promise.all(compiled.outputFiles.map(async file=>[file.path.split('/').at(-1).replace('.js',''),await import('data:text/javascript;base64,'+Buffer.from(file.text).toString('base64'))])));
const {missions}=imports.missions,{acceptsAnswer,normalizeAnswer}=imports['answer-evaluation'];
assert.equal(normalizeAnswer('  إِعْادة  الـDNS! '),'اعادة الdns');
const cases={
 '001':{cause:{good:['DHCP','تعطل خدمة توزيع العناوين','خدمة DHCP متوقفة عن العمل'],bad:['DNS','ليس DHCP هو السبب','تعطل DNS']},action:{good:['تجديد العنوان','إعادة تشغيل خدمة DHCP وتجديد IP','تشغيل DHCP ثم طلب عنوان جديد'],bad:['تغيير DNS','تشغيل الخدمة دون تجديد','لا أعيد تشغيل DHCP']}},
 '002':{cause:{good:['dns','تعذر حل أسماء المواقع','فشل خادم DNS المحلي'],bad:['DHCP','خادم DNS يعمل','ليس DNS هو السبب']},action:{good:['تغيير dns','ضبط DNS على 1.1.1.1','استبدال محلل الأسماء بخادم صالح'],bad:['تجديد عنوان IP','لا أغير DNS']}},
 '003':{clues:{good:['Return-Path,link','فشل SPF مع رابط تصيد','رابط مخادع و SPF فاشل'],bad:['SPF فقط','الرابط فقط','المرسل وحده']},action:{good:['عزل الرسالة والإبلاغ','حجر الرسالة والتبليغ عنها','لا أفتح الرابط وأبلغ فريق الأمن'],bad:['أفتح الرابط','أشارك رمز التحقق','عدم الإبلاغ وحظر الرسالة']}},
 '004':{ip:{good:['198.51.100.24','IP: 198.51.100.24'],bad:['203.0.113.18','198.51.100.2']},account:{good:['admin','حساب ADMIN'],bad:['user1','administrator']},action:{good:['حظر المصدر والإبلاغ','أبلغ الفريق وأحظر عنوان IP المشبوه','منع المصدر وتنبيه الفريق'],bad:['تجاهل المحاولات','عدم الإبلاغ مع حظر المصدر']}},
 '005':{path:{good:['config/app.conf','./config/app.conf','/srv/training/config/app.conf','مسار الملف config/app.conf'],bad:['config/test.conf','/etc/passwd']},owner:{good:['atlas','owner = atlas','المالك Atlas'],bad:['test-runner','administrator']}}
};
for(const mission of missions)for(const [field,values] of Object.entries(cases[mission.id])){
 const rule=mission.successConditions.answers[field];
 for(const answer of values.good)assert(acceptsAnswer(answer,rule),`${mission.id}/${field} rejected valid: ${answer}`);
 for(const answer of values.bad)assert(!acceptsAnswer(answer,rule),`${mission.id}/${field} accepted invalid: ${answer}`);
}
console.log('PASS: five missions accept normalized answers, aliases, and constrained keyword combinations; reject unrelated, incomplete, negated, or misleading answers.');
