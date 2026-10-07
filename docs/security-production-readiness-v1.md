# CyberLab — Security & Production Readiness v1

راجعت Version 53 بتاريخ 2026-09-30. الإصلاحات في هذا التقرير **محلية وغير منشورة**. Production ما زالت Version 53، وVersion 52 وأرشيف مصدرها موجودان للرجوع. لم تُغيّر صلاحيات النشر أو OAuth أو قواعد Cloudflare أو بيانات Production.

## القرار

**NOT READY — BLOCKERS REMAIN** بالنسبة إلى Production الحالية.

المانع المثبت: تحتوي Version 53 على `react-server-dom-webpack@19.2.6` المتأثر بالتنبيه العالي `GHSA-wx67-qw84-cm4g / CVE-2026-44907`. التطبيق يستخدم RSC في Vinext، وحزمة الخادم ومسار معالجة Server Functions موجودان. لم أرسل طلب استغلال أو اختبار حجب خدمة. التحديث التصحيحي إلى 19.2.8 مُجهّز ومختبر محليًا، لكنه لم يصل إلى Production. يلزم اعتماد الإصدار التصحيحي ونشره قبل اعتماد النسخة الحالية للـClosed Beta.

بنود التحقق اليدوي أدناه ليست ثغرات مثبتة، ولا أعتبر تعذر OAuth أو حظر أدوات التحقق Bug في CyberLab.

## المشاكل المثبتة والإصلاحات

| المشكلة | Severity | الدليل | الإصلاح المحلي |
|---|---|---|---|
| اعتماد RSC متأثر بتنبيه DoS معروف | High | إصدار 19.2.6 في المصدر المنشور/lockfile، وتشغيل RSC في حزمة الخادم | React وReact DOM وRSC إلى 19.2.8 متوافقة؛ دون تحديثات major أو تغيير Framework |
| قراءة جسم الطلب كاملًا قبل حد الحجم؛ الحد القديم يحسب حروفًا لا UTF-8 bytes | Medium | مراجعة المسارات واختبار جسم UTF-8 يتجاوز الحد | قراءة Stream محدودة، إلغاء القراءة عند التجاوز و413؛ حد معلن ومقاس فعليًا |
| أخطاء D1 ذات نص عربي قد تُصنف كتعليمات للمستخدم وتُعاد بتفاصيلها | Medium | Trigger محلي مؤقت تسبب بخطأ D1 يحتوي عبارة عربية: أعاد المسار 400 بدل 503 | قبول رسائل المحركات العربية المتوقعة فقط، واستبعاد أخطاء driver/SQL/JS؛ إعادة رسالة حفظ عامة قابلة لإعادة المحاولة |
| `null` وArrays والحقول غير المعروفة/الأنواع المحوّلة لا تُرفض باستمرار | Low | `learning null` يعيد 503؛ `theme:['dark']` مقبول؛ filters تُسقط قيمًا غير صالحة؛ حقول XP/userId تُتجاهل | Runtime validation عند حدود API: IDs وأنواع وEnums وحدود النصوص والحقول المسموحة؛ لا coercion |
| TypeError داخلي يظهر في رد `/api/submit` | Low | طلب `null` محلي أعاد نص TypeError إنجليزيًا | 400 عربي عام للمدخل غير الصالح، دون تفاصيل داخلية |
| التسجيل الخام لـException قد يتضمن SQL أو نص مستخدم | Low | `console.error(label,error)` في المسارات؛ لم يُثبت تسريب Secret حقيقي | سجل ثابت يحتوي event/category فقط؛ اختبار عدم تسجيل message أو stack أو note/token تجريبي |
| تكرار معامل البحث قد يكسر `.trim()` | Low | مراجعة كود Search السابق واختبار معاملات مكررة بعد الإصلاح | رفض المعامل المكرر/أكثر من 100 حرف برسالة عربية؛ الإبقاء على البحث السليم |
| غياب Headers أساسية على استجابات التطبيق الحالية | Low | GET ناجح للصفحة العامة وAPI في Production دون Headers المذكورة | `nosniff` وReferrer Policy وPermissions Policy محليًا؛ CSP/frame/HSTS لم تُفرض بلا تحقق |

لم يُثبت IDOR أو تجاوز ملكية أو حقن SQL أو XSS أو تكرار XP/Skill XP. لم أغيّر منطق المكافآت أو شروط الفتح أو بيانات التعليم. تصحيح التحقق من المدخلات لا يعيد حساب أي إنجاز قديم.

## Production Checklist

PASS هنا يعني النطاق المحدد في عمود الدليل، وليس شهادة بأن OAuth أو Cloudflare اجتازا اختبارًا محليًا.

| المجال | الحالة | الدليل وحدود التحقق |
|---|---|---|
| Auth guards | PASS — Local + one Production API | APIs الشخصية تشتق userId من `getChatGPTUser()`؛ 401 دون الهوية أو بدون ID/email معًا. GET Production `/api/progress` أعاد 401 |
| Sign in/out، Session restore/expiry | MANUAL VERIFICATION REQUIRED | Dispatcher يملك OAuth/Cookies. اختُبر غياب الهوية واستعادة D1 وإعادة طلبات بحسابين محاكيين؛ لم يُختبر انتهاء Token حقيقي أو دورة OAuth |
| Redirect بعد الدخول | PASS — Local | رفض روابط خارجية و`//` وbackslash وروابط auth المحجوزة؛ return_to الداخلي يحتفظ بسياقه |
| Authorization / IDOR | PASS — Local + source audit | مراجعة ملفات API الخمسة عشر واستعلامات التخزين؛ user_id في الملكية؛ حساب A لا يقرأ/يعدّل Dynamic Instance للحساب B حتى مع معرفه الصحيح؛ الموارد العامة لا تحمل بيانات حساب آخر |
| Trusted identity headers | MANUAL VERIFICATION REQUIRED | اختبار التطبيق يحقن Headers موثوقة لمحاكاة Dispatcher. يلزم تأكيد أن حدود الاستضافة تزيل/تستبدل Headers التي يرسلها الزائر. لا يوجد دليل محلي يثبت ذلك على منصة الاستضافة |
| Reward integrity | PASS — Local | XP مشتق Server-side؛ رفض xp/score/userId الزائدة؛ تزامن وإعادة إكمال الدرس والمسار الهجومي وMissions/SOC بلا مكافآت إضافية |
| Runtime validation | FIXED — Local | الأجسام والـIDs والـEnums والأنواع والحدود تُفحص قبل المحركات؛ منع القيم المُحوّلة والـJSON المعطوب والـUTF-8 الزائد |
| SQL injection / XSS | PASS — reviewed/tested surfaces | Prepared/bound SQL؛ النص الخبيث يبقى ملاحظة فقط؛ Search HTML مُهَرَّب. Notes/Evidence/Profile تُعرض كنص React. استخدام innerHTML الوحيد Style مولّد من ChartConfig برمجية، بلا استخدام من صفحات التطبيق أو User input |
| CSRF | PASS/FIXED — Local; cookies MANUAL | جميع POST التطبيقية تشترط JSON صحيحًا وOrigin مطابقًا إذا وُجد؛ إضافة رفض Sec-Fetch-Site cross-site حتى بدون Origin. لا CORS permissive في التطبيق. Cookies الحقيقية يملكها Dispatcher ولم تُفحص |
| Secrets | PASS — bounded scan/review | 752 Git blobs تاريخية، و698 ملف مصدر/حزمة في الفحص النهائي: صفر مطابقة لأنماط مفاتيح/private keys/JWT/credential URLs. لا يُعد الفحص إثباتًا لاستحالة وجود سر غير معروف النمط |
| Environment separation | PASS — Local config; hosted mapping MANUAL | اختبارات Miniflare تستخدم D1 مؤقتة وcf:false؛ Binding المحلي UUID placeholder. لا وصول محلي إلى Production D1؛ لا Staging مستقل مُثبت |
| D1 integrity | PASS — Local; live constraints MANUAL | Composite PKs وunique reward keys؛ batch reward/progress/activity/skills؛ فشل إدخال المهارة المُحقَن محليًا يُرجع الدفعة ثم تنجح إعادة المحاولة. جدول attempts مستقل/اختياري خارج دفعة الإنجاز |
| Security headers | FIXED — Local; partial MANUAL | Headers الثلاثة على `/` وSearch و401 API في Worker المبني. CSP وHSTS وframe restrictions تحتاج تحققًا مستضافًا قبل فرضها |
| Abuse / rate limiting | MANUAL VERIFICATION REQUIRED | حدود أجسام ومدخلات، dedup rewards/evidence، وعدد Variants محدود موجود مسبقًا. لا limiter عام في التطبيق أو Binding مُثبت له. WAF/Bot لا يثبت وجود حصة للطلبات الموثقة |
| Error handling / Logging | FIXED — Local; platform logs MANUAL | ردود حفظ عامة قابلة لإعادة المحاولة، دون SQL/Stack؛ سجلات event/category فقط. استعلام أخطاء Worker لفترة محدودة أعاد صفر أحداث؛ لا يثبت Retention أو Auth logs أو عدم وجود أخطاء خارج الفترة |
| Dependencies | FIXED — Local RSC; BLOCKER — current Production | تحديث ثلاثة packages فقط إلى patch متوافق. بقي 51 advisory في dependency graph؛ التفصيل أدناه، دون الادعاء بأنها 51 ثغرة قابلة للاستغلال في Worker |
| Backup / recovery | MANUAL VERIFICATION REQUIRED | أرشيف 52 و53 متاحان؛ 53 نشر succeeded. صلاحية إجراء rollback والـD1 retention/export/restore لم تُختبر تدميريًا |

## Authentication وحدود الاستضافة

هوية التطبيق تُشتق Server-side من Headers التي يتوقع حقنها بواسطة Sites Dispatcher. لا يثق التطبيق في userId داخل POST أو Query لتحديد ملكية السجلات. إخفاق الهوية يعيد 401 للبيانات الحساسة، بينما صفحة النشاط العامة تُبقي حالة تسجيل الدخول أو القفل؛ إخفاء الواجهة ليس حماية APIs.

`/api/submit` يسمح بتصحيح تعليمي للضيف مع `saved:false` دون حفظ Progress أو XP. قراءة فهرس المختبرات للضيف سلوك موجود. قراءة الصفحة العامة لا تعني صلاحية الوصول إلى بيانات المستخدم.

لا يوجد OAuth client secret داخل التطبيق، ولا جداول Tokens/Cookies خاصة به. لم أغيّر provider أو helper الخاص بالهوية. Mock auth في Dev plugin محلي ومقيد بـlocalhost/socket، ويُعطّل في managed-linux ولا يُضمّن في حزمة النشر.

ملفات `.env*` متجاهلة في Git. لا يوجد `.env.example` حاليًا، ولا متغير Secret تطبيقي مطلوب لإنشاء قالب أسماء له؛ إعدادات Sites المقروءة أعادت revision 0 دون Runtime env entries. D1 هو Binding مُدار، وليس credential يُرسل للعميل. هذا لا يفحص أسرار البنية الداخلية لمنصة الاستضافة.

التحقق اليدوي المطلوب: Sign in/out، العودة الآمنة، انتهاء الجلسة الحقيقي، رفض Header spoofing على حد الاستضافة، Attributes لـCookie الجلسة الفعلية، وظهور البيانات الصحيحة بعد إعادة الدخول بحساب اختبار. Cookie الخاصة بـCloudflare ليست دليلًا على Cookie جلسة CyberLab.

## نطاق الاختبارات الأمنية

`tests/security-readiness.test.mjs` يشغّل Worker المبني وD1 مؤقتة جديدة، ولا يكتب إلى Production. يختبر:

- جميع مجموعات API الشخصية: رفض الضيف/الهوية الناقصة، وحالة انتهاء الجلسة المحاكاة.
- Negative IDOR ضد Incident لحساب آخر، ورفض userId/XP المُزوّرة في POST، وعزل النصوص والسجلات.
- عدم كشف expected/allowedLinks أو Review قبل القرار، وعدم تكرار Evidence، ورفض العلاقات/التصنيفات غير الصالحة.
- JSON معطوب/null/array/coercion/unknown keys/Enums/IDs/أطوال غير صالحة؛ UTF-8 byte limits وإلغاء Stream زائد.
- Origin وFetch Metadata وContent-Type، وReturn URLs خارجية ومحجوزة.
- حفظ نص SQL/HTML كنص فقط وتهريب HTML في Search؛ هذا ليس اختبار XSS شاملًا في Browser.
- خمس طلبات إكمال متزامنة ثم Replay: سجل XP واحد وSkill awards/progress بلا تكرار.
- Trigger فشل محلي مؤقت داخل دفعة المكافآت: لا Progress أو activity أو skills جزئية؛ إعادة المحاولة تنجح.
- Trigger خطأ D1 عربي محلي: عدم تسريب النص الداخلي وعدم تصنيفه كرسالة تعليمية.
- Worker restart واستعادة بيانات نفس الحساب، وعدم انتقالها لحساب آخر.
- Headers الأساسية للصفحة الرئيسية وSearch وAPI حتى عند رفض الضيف.

تشمل Regression السابقة الرحلتين Mission-First وOffensive، Existing/Completed/Locked users، Refresh، Knowledge Return، Direct URLs، Search، SOC، Investigation، Evidence، Replay وConcurrent completion. اختبارات UI عبارة عن مكونات مترجمة/handlers وWorker فعلي محلي؛ ليست Browser أو human usability/OAuth tests.

لا اختبارات هجوم/DoS أو credential attacks أو طلبات استغلال على Production. لم تُنفّذ عملية destructive recovery أو Migration جديدة.

## Dependency security

قبل الإصلاح: 52 advisory entries، منها 26 High و19 Moderate و7 Low، وصفر Critical. بعد تحديث React/DOM/RSC فقط: 51 entry، منها 25 High و19 Moderate و7 Low، وصفر Critical. عدة entries تشير إلى package واحد/مسارات transitive متعددة.

تغيّر إصدار ثلاث حزم فقط: React وReact DOM وreact-server-dom-webpack من 19.2.6 إلى 19.2.8. التغييرات الواسعة في lockfile إعادة ربط Peer snapshots، ولم يُضف تحديث إصدار لحزمة رابعة. حزمة Worker المبنية الجديدة لا تحتوي version literal 19.2.6 وتحتوي 19.2.8؛ RSC يدخل تشغيل التطبيق حتى مع كونه مصنفًا devDependency.

باقي التنبيهات قُيّمت بحسب المسار، لا بحسب devDependency label فقط:

| المجموعة | المسار/التعرض | القرار |
|---|---|---|
| Vite 8.0.13 | تنبيهان متعلقان بـDev Server/Windows/NTFS أو UNC؛ التشغيل الحالي Linux Worker | لا تغيير واسع للإطار. تحديث patch قبل Dev exposure على Windows؛ لم تُثبت ثغرة Production بهذه الشروط |
| Undici 7.24.8 / ws 8.18.0 | Miniflare/Wrangler/Vite plugin؛ tooling المحلي، لا استيراد في Worker المنشور | عدم تعريض Dev tooling للشبكات غير الموثوقة. تحديث الأدوات المخطط منفصلًا؛ ليس حكمًا عامًا بأن التنبيهات آمنة |
| esbuild، js-yaml، brace-expansion، fflate | build/lint/CLI/sourcemaps وDrizzle tooling | Build من مصدر موثوق فقط؛ لا تنفيذ CI على PR غير موثوق يحمل Secrets. لا major upgrades بلا حاجة |
| Babel / browserslist / baseline-browser-mapping | compiler وstyled-jsx وWebpack target resolution | لا استخدام لمدخلات زائر في compilation. لم تظهر markers هذه الحزم في JS Worker المبني؛ لم يُثبت مسار Runtime ضعيف |
| fast-uri | AJV/Resolvers أو Webpack schema؛ Resolvers غير مستعملة من صفحات التطبيق | لا parsing بـfast-uri لمدخلات API؛ لم تُثبت reachable vulnerability؛ لا claim أن كل transitive dependency بلا خطر |
| image-size | Vinext tooling | لا استيراد من التطبيق أو marker في حزمة Worker؛ لا رفع صور من المستخدمين. لا تغيير optimizer أو Architecture دون أثر مثبت |

المصدر الأساسي لتحديث RSC: https://github.com/react/react/security/advisories/GHSA-wx67-qw84-cm4g . النشرة تؤكد High وإصلاح 19.2.8؛ لم أختبر استغلالها. يعاد audit عند إصدار التصحيح لأن بيانات advisories تتغير.

## Production verification وCloudflare

تم التحقق من Sites أن Version 53 هي latest/current deployment succeeded، ومن بقاء archive/source/deployment لـ52، ومن وجود archive/source لـ51 أيضًا. Binding `DB` موجود وظهرت أسماء الجداول الـ23 المتوقعة عبر metadata فقط؛ لم أقرأ سجلات مستخدمين.

فحوص GET ناجحة باستخدام curl العادي دون تغيير User-Agent أو Cookies حساب:

- `/`: 200، عنوان CyberLab الصحيح، دون Headers الأمنية المذكورة.
- `/api/progress`: 401 ورسالة دخول عامة، دون بيانات حساب.
- `/investigations/soc-SOC-002?journey=core`: 200 لهيكل الصفحة العام.

عميل Python الافتراضي تلقى Cloudflare 403/1010 على مجموعة المسارات الأخرى. اختلاف العميل متسق مع Browser/Bot signature blocking، لكنه لا يثبت سبب Rule أو أن مستخدم Safari العادي يتأثر/لا يتأثر. لم أُعدّل WAF أو Bot protection أو أستخدم bypass token أو جلسة Production. لا أعتبر هذه الفحوص Smoke Test مسجل الدخول ولا أدّعي نجاح كل المسارات على Production.

## Security Headers وAbuse — ما يلزم قبل فرض إعدادات إضافية

الإضافات المحلية فقط: X-Content-Type-Options: nosniff؛ Referrer-Policy: strict-origin-when-cross-origin؛ Permissions-Policy يمنع camera/microphone/geolocation التي لا يستخدمها المنتج الحالي. `/(.*)` يغطي `/` وبقية المسارات في matcher الحالي، وقد اختُبرت النتيجة على Worker الفعلي؛ `/:path*` لم يغط `/` في هذا Runtime.

لم أضع CSP ذات unsafe-inline/unsafe-eval لتجاوز مشاكل توافق، أو frame-ancestors قد يمنع تضمين Sites، أو HSTS includeSubDomains/preload. الخطوة المناسبة: تحقق سياسات Dispatcher/TLS/embed أولًا، ثم CSP Report-Only مبنية على scripts/styles/fonts/connect الفعلية ومن دون تقارير تحوي بيانات خاصة؛ اختبار OAuth وAssets والتضمين قبل Enforcement. HSTS وframe restrictions تحتاج ملكية/أصول موثوقة مؤكدة.

لا يوجد proof لRate Limiting موجود عند Cloudflare. يحتاج مسؤول الاستضافة فحص Security Events وRules وطلب عادي من iPhone، وتأكيد تغطية authenticated write routes حسب المستخدم، وGuest grading حسب IP. إعداد متدرج يبدأ بالمراقبة ثم حصة تسمح بالاستخدام الطبيعي، و429/Retry-After، دون Captcha لكل شيء. Cloudflare Rate Limiting binding متاح كقدرة عامة، لكن لم تُثبت إتاحته لهذا Site ولم يُضف Binding أو limiter في الذاكرة يدّعي حماية موزعة.

Logging الجديدة تحافظ على اسم العملية وتصنيف الخطأ دون بيانات شخصية. لا تسجيل لكل 401 لتجنب تحويلها إلى مصدر ضوضاء/abuse. يلزم تأكيد سجلات Dispatcher لـauth، request correlation IDs وretention وصلاحيات القراءة والتنبيه على ارتفاع failures لدى مزود الاستضافة؛ لم تُبنَ منصة Observability جديدة.

## Backup / Recovery plan

وجود نسخة Site يضمن مادة Code rollback، ولا يعني نسخة احتياطية من D1. لم تُثبت إعدادات الجدولة أو صلاحية Export/Time Travel للحساب المستضيف من أدوات Sites المتاحة.

1. مسؤول الاستضافة يؤكد اسم/هوية DB الفعلية، من يملك restore، نافذة retention الفعلية، وطريقة دعم الاستعادة إذا كانت D1 مُدارة بواسطة Sites. لا تُستخدم UUID المحلية placeholder لأي restore.
2. قبل أي Migration مستقبلية: سجل Code version/commit وSchema version ووقت UTC وTime Travel bookmark عند توفره؛ تصدير آمن مشفر بقراءة مُصرّح بها، خارج Git، وصول محدود، checksum وretention محددة.
3. جدول مبدئي مناسب لـClosed Beta: export يومي، احتفاظ 30 يومًا إن سمحت السياسة، واختبار restore دوري إلى **قاعدة منفصلة**؛ ليست ميزة نُفذت أو ضمان RPO. اضبط RPO المستهدف ساعة عبر Time Travel إن ثبت متاحًا، وRTO المستهدف أربع ساعات بعد أول تمرين ناجح.
4. deploy فاشل بلا Migration: أعد نشر version مستقرة محفوظة وافحص الصحة، دون Restore بيانات؛ Rollback تلقائي للـDB غير مطلوب. rollback إلى52/53 يعيد أيضًا الاعتماد القديم، لذلك هو إجراء طارئ مؤقت وليس Security fix.
5. Migration فاشلة: أوقف deploy/writes المتأثرة عند الحاجة، تحقق من transaction/Schema، ثم Forward fix متوافق أو restore من bookmark/export تحت موافقة مسؤول البيانات. لا تشغّل down migration عشوائية على Production.
6. حذف/فساد: حافظ على الأدلة والسجلات وexport الحالية، أوقف الكتابات عند الضرورة، استعد أولًا في قاعدة معزولة وتحقق من row counts وownership وPKs وreward sums وsample account progress؛ ثم حدد مع المالك نقطة الاستعادة وفقد الكتابات اللاحقة المحتمل قبل الاستعادة الحية.
7. تمرين منفصل مطلوب: استعادة نسخة منزوعة البيانات الشخصية في DB غير Production، تشغيل regressions/smoke بحسابي اختبار، قياس RPO/RTO فعليين. لم تُنفذ تجربة destructive على Production.

Cloudflare توثّق أن D1 batch transaction تعود كاملة عند فشل statement: https://developers.cloudflare.com/d1/worker-api/d1-database/ . Time Travel موثق هنا: https://developers.cloudflare.com/d1/reference/time-travel/ ، وحدوده المعلنة 30 يومًا للخطة المدفوعة و7 أيام للمجانية: https://developers.cloudflare.com/d1/platform/limits/ . هذه الحدود ليست إثباتًا لخطة هذا Site أو صلاحية أداة استعادته.

## نتائج التحقق والتوقف

- Build: ناجح بعد الإصلاحات؛ Type Check: ناجح؛ Regression: 30/30 suites (29 الحالية + security-readiness).
- لا تغييرات في schema/migrations أو محتوى/IDs أو محركات XP/Skills/Mastery/Career أو شروط Unlock أو Storage business logic.
- التغيير في Server boundary validation/error logging، Search invalid-input handling، ثلاث patch dependencies، وHeaders في next.config فقط.
- بيانات Production لم تُعدّل. الحفاظ على المكافآت والتقدم القديم مثبت محليًا؛ لم تُقرأ/تُقارن بيانات حساب Production فعلي.
- غير مختبر: OAuth الفعلي وcookie/token expiry/dispatcher spoof stripping؛ Production cross-account authenticated interactions؛ Hosted rate/security rules؛ Live D1 constraints/backup restore؛ Browser XSS/كل Content flows؛ iPhone/Safari والـOAuth على الجهاز الحقيقي.
- iPhone/Safari يدويًا: دخول/خروج واستعادة؛ العودة من درس إلى القضية؛ Refresh أثناء التحقيق؛ فتح Mission-First ومسار التقييم الهجومي والتأكد من حفظ التقدم؛ OAuth وAssets بعد Headers؛ التأكد أن Cloudflare لا يمنع المستخدم الطبيعي.

لا نشر ولا Version جديدة في هذه المرحلة. توقف العمل هنا؛ لا Commercial Readiness ولا Features أخرى.
