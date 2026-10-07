# Production Verification & Beta Gate v1

تاريخ المراجعة: 2026-09-30. Baseline: Version 55. استئناف بعد Mobile Visual QA.

**الحكم: BETA GATE BLOCKED — أدلة التحقق الإلزامية لم تكتمل.**

لم يُكتشف Bug جديد في هذه المراجعة. هذا الحكم لا يثبت عيبًا في OAuth أو تسريبًا بين الحسابات؛ يعني أن بوابة إطلاق Beta لم تحصل على الإثبات المطلوب. لم تُعدَّل ملفات التطبيق أو configuration أو WAF أو D1، ولم يُنشأ إصدار أو يُنفَّذ نشر جديد. لم تبدأ Closed Beta أو Commercial Readiness.

## الحالة والأدلة الفعلية

| المجال | الحالة | ما ثبت | ما لم يثبت |
|---|---|---|---|
| Production OAuth | PASS | تحقق يدوي أبلغ به مالك المشروع على Production Version 55 باستخدام iPhone/Safari: login، persistence after Refresh، sign-out، sign-in again، واستعادة التقدم | لم ينفذ الوكيل هذه الدورة بنفسه؛ PASS يعتمد على إفادة الاختبار اليدوي المحددة أدناه |
| Cross-account isolation | BLOCKED | حسابا A/B جاهزان ومصرح بهما حسب المستخدم؛ المصدر يشتق الهوية server-side؛ اختبار security-readiness المحلي نجح مجددًا | جلسات المستخدم المنفصلة غير متاحة لأداة المتصفح؛ لم تُنفَّذ قراءة/كتابة A→B وB→A على Production |
| WAF / Rate limiting | BLOCKED | إعدادات التطبيق المتاحة فُحصت دون تعديل؛ الاستخدام الطبيعي على Safari نجح وفق المستخدم | Rules الفعلية، حدود الطلبات الموثقة، Security Events، وحماية هوية Dispatcher غير متاحة عبر الأدوات الحالية |
| Backup / Recovery | BLOCKED | أُعيد تأكيد أرشيفي 55 و54 وProduction binding DB و23 جدولًا؛ خطة تشغيل مع أوامر ومسؤوليات أدناه | DB UUID وصلاحيات النسخ، retention الفعلي، export حديث ونجاح استعادته إلى قاعدة منفصلة، واستعادة configuration الخارجي |
| iPhone / Safari | PASS | تحقق يدوي أبلغ به مالك المشروع: Dashboard/Menu/layout، overflow، Mission-First، Knowledge return، SOC/Investigation، Offensive Assessment، keyboard/touch | موديل الجهاز وإصدار iOS/Safari غير محددين في الإفادة؛ لا يُعمم هذا PASS على كل أجهزة وإصدارات Safari |

لم يُثبت BLOCKER أمني جديد؛ العوائق الحالية هي غياب أدلة الإطلاق للعزل بين الحسابات وWAF/rate limiting وBackup/Recovery. نتيجتا OAuth وSafari أُغلقتا بإفادة التحقق اليدوي، دون نسبتهما إلى الوكيل.

### سجل التحقق اليدوي الذي أبلغه مالك المشروع

سُجل في 2026-09-30، على Production Version 55 باستخدام iPhone/Safari. مصدر الدليل: رسالة المستخدم الصريحة، وليس اختبارًا نفذه الوكيل. لم تُرسل Cookies أو Tokens أو بيانات دخول.

| الفحص | نتيجة المستخدم |
|---|---|
| Production login | PASS |
| Session persistence after Refresh | PASS |
| Dashboard / Menu / Mobile layout | PASS |
| No problematic horizontal overflow | PASS |
| Mission-First | PASS |
| Knowledge Lesson → return to case | PASS |
| SOC / Investigation | PASS |
| Offensive Assessment | PASS |
| iOS keyboard / touch interaction | PASS |
| Sign out | PASS |
| Sign in again | PASS |
| Existing progress restored correctly | PASS |

لا يُطلب تكرار هذه الفحوص لإغلاق البنود الثلاثة المتبقية. لا تُستنتج منها نتائج cross-account access أو WAF configuration أو recovery. الفحوص التقنية التاريخية أدناه محفوظة كسجل، وليست طلبًا لإعادة فتح OAuth/Safari.

### النشر والنسخ المحفوظة

- المشروع: `appgprj_6aad034a90188191a9b1a65637579e97`.
- الموقع: https://cyberlab-ki.idbri.chatgpt.site ؛ Site active، latest version 55، Auth configured.
- نشر 55: `appgdep_6abd2a3d3f9c8191b00e03f152157cde`.
- Version 55: `appgprj_6aad034a90188191a9b1a65637579e97~appgver_166f34b7a66081919a3a06f2f222aea5`، archive_storage موجود.
- Source المنشور: `c9d9f5f48ce083edd8380b213d5857950771df90`. التحديثات التالية لهذا التقرير توثيق محلي فقط؛ لا تغير المصدر المنشور.
- Rollback المباشر Version 54: `appgprj_6aad034a90188191a9b1a65637579e97~appgver_182d96059b4481919f3c2fb7b835f8b0`؛ archive_storage موجود، Source `a48132bf517e72cfbf9f2bc43c26398fd8e55a67`. لم يُنفَّذ rollback فعلي. 52 تسبق إصلاحات 54 ولا تُختار تلقائيًا.
- Runtime environment revision: 0، لا متغيرات مضافة عبر Sites. لا يثبت ذلك أن إعدادات OAuth/WAF المملوكة للاستضافة خالية أو محفوظة في المصدر.
- DB overview أعاد 23 اسم جدول. لم تُقرأ صفوف مستخدمين أو تُعدَّل بيانات.

### GET checks السابقة — Version 54، ليست إعادة اختبار Version 55

ستة طلبات فقط، بدون Cookies أو identity headers أو POST أو bypass أو اختبار كثافة طلبات:

| المسار | النتيجة |
|---|---|
| `/` | 200 |
| `/api/progress` | 401؛ response يحتوي error فقط |
| `/api/missions` | 401؛ response يحتوي error فقط |
| `/api/interactive-labs/v2-access-control` | 401؛ response يحتوي error فقط |
| `/api/investigations/soc-SOC-002` | 401؛ response يحتوي error فقط |
| `/api/soc/alerts/SOC-002` | 401؛ response يحتوي error فقط |

جميعها أعادت nosniff وstrict-origin-when-cross-origin وPermissions-Policy لتعطيل camera/microphone/geolocation. لم يظهر 403/1010 لهذه الطلبات السابقة. ذلك لا يثبت أن كل المتصفحات الطبيعية مسموحة أو أن rate limiting فعّال.

### التحقق السابق — Version 55، ليس إعادة اختبار OAuth

- المتصفح الفعلي Chrome عرض تحقيق `/investigations/soc-SOC-002` للزائر مع طلب تسجيل الدخول، دون بيانات تحقيق محفوظة. الضغط على زر الدخول نقل المتصفح إلى `auth.openai.com/choose-an-account` مع اسم CyberLab.
- في تلك المحاولة لم تُنشأ جلسة Production. رفضت مراجعة الموافقة التلقائية اختيار حساب شخصي غير محدد كأحد حسابَي الاختبار؛ لم يُجرَ التفاف على الرفض. إجابة عدم الجاهزية كانت تاريخية، وقد استبدلها المستخدم لاحقًا بتأكيد جاهزية حسابَي A/B وملكيتهما والتصريح باختبارهما. الجاهزية في متصفح المستخدم لا تثبت توفر الجلسة في أداة الوكيل.
- طلب GET واحد جديد إلى `/` دون Cookies أو identity headers أعاد 403. أُوقف مسار الطلبات المباشرة؛ لم تُجرَ بقية GETs المخططة ولم يُحاول bypass أو تغيير بصمة العميل. النص المتاح لا يكفي لتحديد Rule أو إثبات bot detection. الوصول بالمتصفح سبق هذا الطلب ونجح حتى اختيار حساب OAuth؛ لا يُستنتج تعطل الخدمة لكل المستخدمين.
- لا يثبت بدء redirect نجاح callback أو صلاحية Session أو رفضها بعد sign-out/expiry.

### حدود البيئة

حسابا Production A/B مملوكان للمستخدم ومصرح باستخدامهما، وجاهزان في متصفحَيه المنفصلين حسب إفادته. فحص inventory الفعلي في هذا الاستئناف أعاد Chrome واحدًا وتبويب about:blank فقط؛ لا توجد جلسة A أو B متاحة للوكيل. لم يُطلب password/token/cookie ولم تبدأ دورة OAuth أخرى. حسابا Miniflare المحليان ليسا حسابَي Production. لا يُستبدل دخولهما بـSIWC bypass credential أو identity headers مزيفة.

أدوات Sites تعرض metadata النشر وruntime وأسماء جداول D1، ولا تعرض WAF/rate configuration أو export/restore/retention أو DB UUID الفعلي. لم تُقرأ صفوف مستخدمين ولم تُرسل طلبات كتابة Production. لا يوجد iPhone/Safari فعلي متاح للوكيل؛ إفادة المستخدم السابقة كافية لبنديهما المغلقين دون إعادة اختبار. هذه قيود إثبات، وليست Bugs مثبتة في CyberLab.

## إجراء OAuth المرجعي — أُغلق بإفادة المستخدم

المسؤول: مالك المشروع أو مختبر مصرح به. استخدم حساب اختبار، دون إكمال نشاط أو إرسال قرار يمنح مكافأة.

1. افتح رابط تحقيق موجود من نافذة خاصة؛ سجّل الدخول من زر الموقع. تحقق من العودة للتحقيق نفسه، لا صفحة لا علاقة لها به.
2. افتح بياناتك المحفوظة، ثم Refresh وأعد فتح التبويب: يجب أن تبقى الجلسة والسياق والبيانات.
3. Sign out؛ افتح `/api/progress` في التبويب نفسه: المتوقع 401 بلا Progress. صفحة التحقيق تعرض طلب الدخول دون بيانات محفوظة؛ ظهور shell عام بـ200 جائز. Sign in مرة أخرى وتحقق من نفس الحساب والتقدم والسياق.

الدليل المطلوب: وقت الاختبار، الجهاز والمتصفح، مسار العودة، نتائج status فقط، وعدم فقد بيانات. لا تحفظ أو ترسل Cookies أو tokens أو HAR غير منقّح. انتهاء الجلسة الحقيقي يحتاج جلسة منتهية/مبطلة فعليًا؛ غياب الجلسة المحلي لا يثبته.

## إغلاق العزل يدويًا بحسابَي اختبار فقط

المسؤول: مختبر مخوّل يملك الوصول الفعلي إلى جلستَي A/B الجاهزتين. استخدم هذين الحسابين فقط، ولا تستخدم معرفات مستخدمين آخرين. لا تُكمل Mission/Lab/Quiz ولا تختبر concurrent rewards على Production. لا تصدّر Cookies أو tokens أو HAR غير منقح. يحفظ المختبر نتائج status ومقارنة الحالة فقط.

1. وثّق ملخص Progress وLab/Mission/Investigation لكل حساب، دون نسخ بيانات شخصية. اختر حالات مختلفة موجودة بالفعل. إن لم يوجد حسابان/حالات متمايزة، لا تسجّل PASS.
2. في كل جلسة اقرأ `/api/progress` و`/api/missions` و`/api/interactive-labs/v2-access-control` و`/api/soc/alerts/SOC-002` و`/api/investigations/soc-SOC-002` عندما تكون متاحة. Evidence وRelationships ضمن جواب التحقيق. يجب أن تظهر حالة صاحب الجلسة فقط. أعد القراءة في A مع `?userId=<test-B-id>`: يجب ألا تتغير هوية النتائج إلى B. كرر بالاتجاه B→A وسجل كل مجال مستقلًا.
3. إن لدى B تحقيق Dynamic موجود، افتح `/api/investigations/dynamic-<B-instanceId>` بجلسة A. المتوقع 404 عند غياب instance خاص بـA. جرّب POST بنفس الجلسة `{ "action": "review", "evidenceId": "isolation-probe-nonexistent" }` على المعرف نفسه؛ المتوقع 404 لأن instance غير مملوك للجلسة، دون أي تعديل. تأكد مسبقًا أن evidenceId التجريبي غير موجود. لا تستخدم reopen أو قرارًا أو completion صالحًا. إن لم يوجد هذا النوع، وثّق أن اختبار ownership لمعرّف instance لم يكتمل، ولا تُنشئ حادثًا على حساب حقيقي لإتمامه.
4. اختبر POST مباشرًا لكل مجال يسمح بالكتابة، باستخدام endpoint/payload الحاليين بعد مراجعتهما من الكود، مع إضافة `userId` الخاص بحساب الاختبار الآخر: المتوقع رفض حقول الملكية غير المدعومة دون تعديل B. لا ترسل completion/reward صالحًا. في التحقيق جرّب Evidence غير موجود في تعريف تحقيق A أو تابع لـinstance B الخاص؛ المتوقع الرفض دون تغيّر B. الأدلة الثابتة التي لها نفس ID عند A/B تُقبل فقط كدليل ضمن حالة A، ولا ينبغي أن تُعدِّل B. جرّب إضافة `xp` إلى payload صالح: المتوقع 400، وليس تحديد مقدار المكافأة من Client. لا تُرسل identity headers مزيفة قبل توثيق حماية Dispatcher.
5. لا تحفظ ملاحظة جديدة أو تعدل إعدادات الإنتاج لإتمام Gate. لمحاولة كتابة آمنة عبر `/api/learning`، استخدم payload الإعدادات الحالي مع إضافة `userId` للحساب الآخر؛ المتوقع 400 قبل الكتابة. استخدم الاختبارات السلبية المماثلة للـAPIs الحالية مع رفض حقول الملكية غير المدعومة، وراجع snapshots الحسابين بعد الطلبات. نجاح رفض payload لا يغني عن اختبار resource ownership في الخطوة 3. تبادل A/B ثم أعد القراءة بعد Refresh وتأكد أن جميع الحالات والمكافآت والإعدادات بقيت كما كانت.

### مصفوفة الموارد المطلوبة بالاتجاهين

| المجال | القراءة والتحقق | محاولة التعديل السلبية |
|---|---|---|
| Progress / XP / Skills / Career / Adaptive | `/api/progress`، `/api/skills`، `/api/career`، `/api/adaptive`؛ إضافة userId الآخر لا تبدل صاحب النتائج | `/api/submit` مع userId أو xp إضافي؛ يجب رفضه قبل الحفظ، دون إجابات completion صالحة |
| Profile / Settings / Notes / Bookmarks / Activity | `/profile` و`/account` و`/api/learning`؛ الهوية من session والإعدادات/الملاحظات/السجل تخص صاحبها | `/api/learning` بحقول الملكية غير المدعومة؛ لا تغيير ملاحظات أو إعدادات |
| Labs | تعريفات `/api/interactive-labs` عامة عمدًا؛ الحالة الشخصية في `/api/interactive-labs/<existing-id>` | payload غير صالح مع userId الآخر، بدون start/submit/replay صالح |
| Missions / Campaign | `/api/missions` و`/api/campaigns/first-signal` مع IDs ومراجع مشتركة وحالات متمايزة | رفض userId/ownership غير المدعوم دون إرسال قرار أو إكمال صالح |
| SOC | `/api/soc`، `/api/soc/alerts/<existing-id>`، `/api/soc/cases/<existing-case-id>` | تغيير case ID إلى حالة الحساب الآخر وpayload غير مدمر/غير صالح؛ لا قرار containment/close صالح |
| Investigations / Evidence / Relationships / Notes | `/api/investigations/<id>`؛ تضم الأدلة والروابط والملاحظات؛ dynamic instance الآخر يجب ألا يُقرأ | الخطوة 3؛ evidence/reference غير موجود، وحقول userId غير المدعومة؛ لا collect/annotate/link/decide صالح على Production |
| Dynamic incidents | `/api/incidents` ومراجع instance الحالي | تغيير instance/reference للحساب الآخر مع payload غير صالح، بدون mode:new أو replay صالح |

لكل صف سجل A→B وB→A: status، هل عاد أي state خاص بالآخر، وهل تغير snapshot بعد محاولة الكتابة. اقرأ schema الحالي لتحديد payload endpoint؛ بعض APIs تقبل IDs داخل body لا في URL. 400 على مدخل غير صالح يثبت validation فقط، وليس ownership وحده. Profile لا يملك API تعديل مستقلًا في المصدر؛ هويته من session، وتفضيلاته وبياناته عبر progress/learning/career. لا تُختبر عمليات تغيير حساب ChatGPT خارج CyberLab.

معرفات الدروس والمهمات والمختبرات الثابتة مشتركة بين المستخدمين: 200 لنفس ID قد يكون صحيحًا إذا عاد **state الخاص بصاحب الجلسة**. لا تشترط 403/404 لمجرد أن الحساب الآخر يستخدم نفس Lesson/Mission ID. المطلوب رفض الوصول إلى السجل المملوك للآخر، لا حجب تعريف المحتوى العام. افحص أيضًا أن intermediary caching لا يعيد JSON حساب آخر؛ الردود الشخصية تحمل no-store.

## إغلاق WAF / Rate limiting

المسؤول: مسؤول استضافة Sites/Cloudflare الفعلي، بالتنسيق مع مالك المشروع. الأدوات المتاحة لا تعرض zone rules أو rate limit bindings. إن كانت الحماية مُدارة بواسطة Sites، اطلب إثباتًا من مسؤول المنصة؛ لا تفترض امتلاك حساب Cloudflare أو zone.

- أثبت أن hostname/Worker الصحيحين تحت الحماية، وأن Rules غير disabled وأنه لا توجد Skip واسعة تتجاوز APIs الموثقة.
- وثّق تغطية sign-in/callback وPOST الحفظ/التقدم/Mission/Lab/Evidence/Incident، وحدود burst/window، ومفتاح المستخدم الموثق/IP وفق قدرة المنصة، والإجراء عند التجاوز. حدود حجم payload ومنع duplicate rewards ليست بديلًا عن rate limiting.
- أثبت أن عناوين الهوية المرسلة مباشرة من Client تُزال/تُستبدل بواسطة Dispatcher، وأن Worker غير مكشوف عبر أصل بديل يسمح بتجاوز هذا الحد. استخدم هوية اختبار فقط في أي فحص مصرح.
- راجع Security Events لوقت زيارة بشرية طبيعية على Safari ومتصفح Desktop، بما فيها OAuth redirect والـAPIs بعد الدخول. قارن 403/1010 السابق بclient/وقت/rule في السجل؛ لا تعتبر CF header وحده إثبات Rule أو تمييزًا بين bot وبشر.
- إثبات limiter يكون من configuration والسجلات أو اختبار محدود مصرح به خارج بيانات Production الحقيقية. لا تُغرق Production بطلبات لإجبار 429. وثّق استجابة التجاوز وطريقة إعادة المحاولة حسب التنفيذ، ولا تعطل WAF/Bot لتسهيل العمل.

## Backup → Retention → Restore → Responsible

هذه خطة تشغيل مقترحة قابلة للتنفيذ بواسطة الجهة المالكة للاستضافة؛ لم تُفعَّل جدولة أو خدمة نسخ جديدة. المسؤوليات أدناه تحتاج تعيينًا فعليًا قبل اعتمادها.

| العنصر | Backup ودليل النجاح | Retention المقترح/المؤكد | Restore procedure | المسؤول |
|---|---|---|---|---|
| D1 | مسؤول الاستضافة يؤكد DB الفعلية/backend ونافذة Time Travel ويستخرج bookmark مؤرخًا، ثم SQL export مع checksum ووقت UTC وschema version؛ export يشمل البيانات لا أسماء الجداول فقط | نافذة Time Travel تعتمد على الخدمة والخطة؛ يلزم تأكيدها. اقتراح: export يومي محفوظ مشفرًا خارج قاعدة Production لمدة 30 يومًا، ونسخة قبل أي migration | استورد export إلى DB منفصلة معزولة، قارن schema/row counts/uniqueness ومجموع مكافآت عيّنات اختبار، ثم اقرأ الحالات بتطبيق متوافق. تمرين restore هذا لا يكتب إلى Production | مسؤول D1 لدى Sites/Cloudflare؛ مالك المشروع يعيّنه ويحفظ وسيلة التصعيد |
| Production configuration | لقطة آمنة لكل إصدار: project/version/commit، audience، DB binding→DB الفعلية، runtime revision/أسماء المتغيرات، OAuth redirect/provider settings، WAF/rate rules IDs والإعدادات؛ حفظ Secrets منفصلًا في مخزن أسرار مع صلاحية الاستعادة | اقتراح: آخر 3 configurations مستقرة + سجل تغييرات 90 يومًا؛ لا تُخزّن قيم الأسرار في التقرير أو Git | مسؤول الاستضافة يعيد config المعتمد والمتغيرات/bindings/access policy، ثم يتحقق من OAuth وguards. deployment وحده لا يستعيد OAuth/WAF خارج archive | مسؤول الاستضافة ينفذ؛ مالك المشروع يعتمد؛ دعم Sites عند كون الإعدادات مُدارة |
| Version rollback | تحقق native الآن: 55 و54 لهما source archive وcommit ونشر محدد | النسختان متاحتان حاليًا؛ مدة الاحتفاظ المستقبلية لم تؤكد | أوقف نشر النسخة المعيبة، اختر **saved version** متوافقة مع schema/config، وانشر عبر Sites ثم افحص status وSmoke. rollback للكود لا يرجع D1 أو إعدادات المنصة تلقائيًا | مالك المشروع/ناشر Site المخوّل |

إغلاق بند D1 يتطلب: الجهة/وسيلة التواصل التي تستطيع restore، قاعدة فعلية محددة في سجل عمليات محمي، retention مؤكد، bookmark/export حديث، وإثبات استعادة النسخة إلى قاعدة منفصلة. أسماء 23 جدولًا وarchive الكود ليست Backup للبيانات.

وفق [وثائق Cloudflare Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)، D1 بالـproduction backend يدعم Time Travel تلقائيًا؛ retention هو 7 أيام للـFree أو 30 للـPaid. لم نتحقق من خطة/صلاحيات DB التي تديرها Sites. الاستعادة بـTime Travel تستبدل قاعدة البيانات **في مكانها**؛ ليست وسيلة clone آمنة لتمرين الاستعادة. استخدم [SQL export/import إلى DB منفصلة](https://developers.cloudflare.com/d1/best-practices/import-export-data/) للتمرين. لا تشغّل Wrangler remote على UUID المحلي placeholder.

عند فساد/حذف Production الحقيقي: مالك المشروع يعلن الحادث ويعتمد فترة التوقف ونقطة استعادة UTC؛ مسؤول الاستضافة يحفظ export وbookmark للحالة الحالية، يوقف الكتابات المتأثرة بطريقة يتيحها المضيف، يستعيد النقطة المعتمدة، يتحقق من schema/ownership/progress/rewards/config ثم يعيد الخدمة. يُسجَّل فقد البيانات المحتمل بعد النقطة المختارة؛ لا تُعاد إرسال completions آليًا كتعويض. لا يُجرَ هذا التمرين تدميريًا في Production.

RPO المقترح للـexport: حتى 24 ساعة، ليس ضمانًا مفعّلًا. Time Travel قد يقلله بعد إثبات الإتاحة والنافذة. RTO مبدئي مستهدف: 4 ساعات؛ لا يُعتمد كالتزام حتى نجاح تمرين الاستعادة وقياس مدته. يجب أن يثبت مسؤول الاستضافة حق الوصول لمكان النسخ ومخزن configuration خارج جلسة المؤلف الحالية.

### إجراء استعادة منفصلة قابل للتنفيذ

**خطة فقط؛ لم تُنفَّذ هذه الأوامر أو أي export/restore.** ينفذها مسؤول الاستضافة صاحب صلاحية D1 الفعلية؛ مالك المشروع يعيّنه ويعتمد توقيت النسخ. إن كانت Sites تدير D1 دون إتاحة Wrangler للمالك، ينفذها دعم الاستضافة أو يوفر إجراءً مكافئًا ودليل نتيجته. لا يكفي تشغيلها على UUID الموجود في إعداد التطوير.

1. **تثبيت الهوية والصلاحيات:** سجل DB UUID الحقيقي المرتبط بـProduction binding `DB`، project/version 55/commit، خطة D1 ونافذة الاستعادة، صاحب صلاحية الوصول والبديل. أنشئ إعدادين مستقلين: export يحدد قاعدة Production المؤكدة؛ recovery يحدد قاعدة جديدة ذات UUID مختلف. مراجعة ثانية تؤكد اختلاف UUID وعدم وجود أي binding إلى Production في بيئة الاستعادة. لا تغير binding للموقع الحالي.
2. **Backup:** في نافذة هادئة معتمدة نفذ SQL export كاملًا إلى مساحة مؤقتة خاصة ومشفرة. export قد يحجب طلبات القاعدة أثناء تشغيله وفق وثائق Cloudflare؛ لذلك لا يُجرى تلقائيًا كجزء من Gate. سجل UTC، schema، checksum SHA-256، وعدد الصفوف المتوقع لكل جدول من النسخة نفسها. لا تسجل أسماء مستخدمين أو محتوى الأدلة في تقرير عام، ولا ترفع SQL إلى Git/Library/المحادثة.

   ```bash
   npx wrangler d1 export "<verified-production-db>" --remote --config "<production-export-config>" --output "<private-workdir>/cyberlab-backup.sql"
   sha256sum "<private-workdir>/cyberlab-backup.sql"
   ```

   هذه placeholders تتطلب القيم التي يتحقق منها مسؤول الاستضافة؛ لا تنفذها حرفيًا. الصلاحية بأقل نطاق تسمح به خدمة النسخ، وقيم credentials تبقى في مخزن أسرار.

3. **Retention:** احتفظ بالـexport مشفرًا في تخزين خاص منفصل، يوميًا لمدة 30 يومًا ونسخة إضافية قبل أي migration مستقبلية. تحقق من نجاح المهمة وعدم الاكتفاء بجدولتها، ومن إمكانية وصول مسؤول الاستعادة والبديل. احتفظ بآخر 3 snapshots للإعدادات وسجل تغييرات 90 يومًا. هذه سياسة مقترحة لم تُفعَّل؛ يلزم إثبات السياسة الفعلية وموقع النسخة الحديثة وتاريخها. لا تطبق حذفًا على بيانات Production.
4. **Restore to separate environment:** أنشئ قاعدة recovery جديدة فارغة، قارن UUID مرة أخرى، تحقق من checksum ثم فك تشفير النسخة داخل مساحة خاصة فقط. استورد إلى القاعدة الجديدة بإعداد recovery المستقل:

   ```bash
   npx wrangler d1 execute "<verified-recovery-db>" --remote --config "<isolated-recovery-config>" --file "<private-workdir>/cyberlab-backup.sql"
   npx wrangler d1 execute "<verified-recovery-db>" --remote --config "<isolated-recovery-config>" --command "PRAGMA foreign_key_check;"
   ```

   لا تستخدم Time Travel على Production لإثبات الاستعادة؛ إنه يستعيد القاعدة في مكانها ولا ينشئ clone. لا تستخدم اعتماد OAuth الخاص بـProduction في بيئة recovery. احصر الوصول للنسخة في المختبرين المصرح بهم؛ تحوي النسخة بيانات حساسة ولا تُنشر على URL عام. تأكيد التشفير والصلاحيات قبل نقلها.
5. **Verification:** قارن الجداول المتوقعة (23 حاليًا) وschema/constraints وعدد الصفوف بالنسخة المحفوظة، وليس بقاعدة Production التي قد تتغير لاحقًا. تحقق من نجاح import الكامل وforeign keys والـunique keys، وعدم وجود تضاعف في records. بتطبيق متوافق مع Version 55 داخل البيئة المعزولة اقرأ عينات حسابي الاختبار A/B: XP، Skill XP، Mastery، Career، completions، SOC، investigations/evidence/relationships/notes. اختبر رفض العبور بينهما هناك دون منح مكافآت أو تعديل بيانات Production. لا تعرض صفوف المستخدمين الحقيقيين أثناء اختبار الواجهة.

سجل قبول العملية: وقت backup، checksum، هوية قاعدة recovery المختلفة في سجل محمي، نتيجة كل فحص وعدد الجداول/الصفوف، مدة الاستعادة، المسؤول والمراجع. يُصبح بند recovery PASS بعد استلام هذا الدليل وتأكيد صلاحية منفذ الاستعادة وسياسة الاحتفاظ. مجرد كتابة الخطة لا يجعله PASS. RTO يُقاس بهذا التمرين؛ RPO يُؤكد من النسخ الموجودة فعلًا.

Configuration recovery منفصل: يصدّر مسؤول الاستضافة audience/access policy وbinding mapping وOAuth redirect/provider settings وWAF/rate rules/limits وأسماء المتغيرات لكل نسخة مع checksum ووقت. تُحفظ قيم الأسرار في مخزن الأسرار؛ لا تُضمَّن في snapshot التقرير. تحقَّق أن مسؤول الاستعادة يستطيع استرجاعها دون الاعتماد على جلسة المؤلف الحالية. Version rollback يختبر نسخة محفوظة متوافقة ثم smoke؛ وجود archive ليس إثبات استرجاع D1 أو الإعدادات الخارجية.

## iPhone / Safari — قائمة مرجعية أُغلقت بإفادة المستخدم

استخدم بيانات اختبار/حالات محفوظة؛ لا ترسل إجابة نهائية أو تكمل نشاطًا. إذا لم تتوفر حالات مفتوحة مسبقًا، سجّل الصفحة غير المختبرة بدل تجاوز requirements.

| الوقت | الفحص |
|---|---|
| 0:00–1:00 | افتح الرابط المحمي وسجّل الدخول في Safari. تحقق من redirect للسياق ثم Dashboard وRefresh؛ افتح/أغلق Menu |
| 1:00–2:00 | افتح Mission-First محفوظة. افحص overflow واللمس وIP/email/domain بنظام LTR داخل RTL؛ افتح Knowledge Lesson ثم ارجع لنفس موضع القضية |
| 2:00–3:00 | افتح SOC/Investigation محفوظًا؛ افتح Evidence وRelationships المتاحة؛ المس حقل ملاحظة ثم أغلق keyboard دون حفظ وتحقق من بقاء الأزرار والمحتوى مرئيين |
| 3:00–4:00 | افتح Offensive Assessment متاحًا؛ افحص requests/headers/paths والاختيارات باللمس، جرّب portrait/landscape، ثم Refresh دون completion |
| 4:00–5:00 | Sign out؛ `/api/progress` يجب أن يرفض الوصول، ثم Sign in مجددًا وتحقق من نفس التقدم والسياق |

الدليل الإضافي الممكن: نوع iPhone وإصدار iOS/Safari، screenshot فقط عند العيب بلا بيانات حساسة. لم ينفذ الوكيل هذه القائمة؛ أبلغ المستخدم بنتائج PASS الواردة في سجل التحقق اليدوي أعلاه.

## الاختبارات وعدم تغيير المستخدمين

فحص هذا الاستئناف: إعادة native metadata (active Version 55، أرشيفا 55/54، runtime revision 0، DB binding DB و23 جدولًا دون قراءة صفوف)، inventory المتصفح (about:blank فقط)، ومراجعة routes/ملف الحساب والإعدادات والمصدر الحالي. لم تُنفذ Production OAuth أو iPhone/Safari مجددًا، ولا GET probes جديدة أو ضغط أو محاولة تجاوز WAF. محاولات OAuth و403 أعلاه تاريخية. لم تُرسل كتابة Production ولم تُقارن قيمة XP لحساب مسجل.

نتائج الإصدار المنشور 55 من مرحلة النشر السابقة: Build ناجح، Type Check ناجح، 30/30 regression suites ناجحة. في هذا الاستئناف أُعيد `node tests/security-readiness.test.mjs` بنجاح (exit 0) على built Worker وD1 مؤقتة منفصلة، مع حذف قاعدة الاختبار المؤقتة فقط عند نهايته. شمل guards، رفض dynamic IDOR للقراءة والكتابة، عزل notes/settings، validation، evidence duplication، once-only/concurrent XP وSkill XP، atomic rollback/retry، وpersisted identities مصطنعة. رسالتا server failure في الخرج كانتا نتيجة fault injection المقصود داخل D1 المؤقتة؛ assertions نجحت. لم يُعد Build أو Type Check أو كامل 30 suite لأن الكود لم يتغير. لا يُنسب إثبات العزل المحلي إلى Production، ولا تدعي هذه suite تغطية profile وكل مجالات A/B بالاتجاهين على Production.

## ما يمنع إغلاق البوابة الآن

1. إثبات العزل باستخدام حسابَي اختبار Production الجاهزين، بما فيه direct requests/ownership/write-negative tests لجميع الصفوف في مصفوفة الموارد بالاتجاهين، بما فيها profile/preferences والمراجع الخاصة بالمستخدم.
2. إثبات configuration وتغطية WAF/rate limits. إفادة Safari تثبت الاستخدام الطبيعي المفحوص، لكنها لا تثبت Rules أو حدود الطلبات.
3. تأكيد مسؤول/صلاحية D1 recovery والـretention ونسخة قابلة للاستعادة إلى بيئة منفصلة، مع إجراء config recovery موثّق.

## أقل إجراءات مطلوبة من مالك المشروع الآن

1. **العزل:** اطلب من مختبر مخول لديه وصول فعلي إلى متصفحَي A/B الجاهزين تنفيذ مصفوفة API أعلاه بالاتجاهين، وإرسال تقرير منقح بالـstatus ورفض state الآخر وثبات البيانات قبل/بعد. لا تُنشئ حسابات مجددًا ولا ترسل أسرار الجلسة. لا يكفي اختلاف الواجهة. للموارد المشتركة قد يكون 200 مع state الجلسة صحيحًا؛ يلزم أيضًا اختبار المرجع الخاص بحساب آخر. لا تنفذ completion أو replay أو حفظًا صالحًا يغير البيانات.
2. **طلب واحد لمسؤول الاستضافة يغطي بندين:** (أ) إثبات WAF/rate limits المفعلة على hostname/APIs، والمسارات والحد/النافذة/المفتاح/الإجراء، وحماية Dispatcher، ومراجعة Security Events للزيارة الطبيعية السابقة؛ (ب) نسخة D1 حديثة مؤرخة مع checksum وretention فعلي والمسؤول، ثم restore إلى DB معزولة مختلفة وتقرير verification للجداول/schema/الصفوف وعينات حسابَي الاختبار، وتوثيق recovery للإعدادات وrollback 54. لا تطلب إضعاف الحماية، ولا ترسل SQL dump أو credentials، ولا تستعد فوق Production. إن كانت الخدمة مُدارة بواسطة Sites ينفذ مسؤول المنصة أو يوفر أدلة مكافئة. لا تعتبر الخطة وحدها إثبات تنفيذ.

عند إرفاق هذه الأدلة وتقييمها يمكن تغيير الحكم إلى BETA GATE PASSED — READY FOR CLOSED BETA دون نشر إصدار جديد إذا لم يظهر Bug. تبقى Production على Version 55. المشروع ليس منتهيًا؛ Mission-First Expansion v2 مؤجلة إلى موافقة المستخدم بعد إغلاق Gate. لم تبدأ Closed Beta أو Commercial Readiness أو مرحلة تطوير جديدة.
