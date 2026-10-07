<div dir="rtl">

# CyberLab 🛡️

[![CI](https://github.com/w7by4nrcfd-cpu/cyberlab/actions/workflows/ci.yml/badge.svg)](https://github.com/w7by4nrcfd-cpu/cyberlab/actions/workflows/ci.yml) ![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

**منصة عربية تفاعلية لتعلّم الأمن السيبراني من الصفر**: دروس قصيرة، واختبارات تُصحَّح على الخادم، ومختبرات محاكاة، وتحقيقات SOC، وتتبّع حقيقي للتقدّم.

[English below ⬇️](#english)

## المزايا

- **منهج متدرّج**: مسارات ورحلات تعلّم (الشبكات، Linux، Python، تحليل السجلات، SOC…)، ولكل درس شرح ومثال وتطبيق ومصطلح وخلاصة وأسئلة.
- **تصحيح على الخادم**: الدرجة تُحسب في `lib/grading.ts`، ولا يُعتمد على رقم يرسله المتصفح.
- **مختبرات محاكاة آمنة**: طرفية افتراضية وسيناريوهات تدريبية ببيانات وهمية، ولا تُنفَّذ أوامر على أي جهاز حقيقي.
- **مهام وتحقيقات**: مهام SOC، وحوادث ديناميكية، ولوحة تحقيق، وتقارير مختبر قابلة للتصدير.
- **تقدّم وإنجازات**: نقاط ومستويات وشارات وسجلّ نشاط، تُحفظ كلها في Cloudflare D1.
- **عربي أولاً**: واجهة RTL كاملة مهيّأة للجوال.

## التقنيات

| الطبقة | التقنية |
| --- | --- |
| الإطار | Next.js 16 على [vinext](https://github.com/cloudflare/vinext) (Vite) |
| الواجهة | React 19، Tailwind CSS 4، shadcn/ui، Radix UI |
| قاعدة البيانات | Cloudflare D1 + Drizzle ORM |
| التشغيل | Cloudflare Workers (Wrangler) |
| اللغة | TypeScript 5.9 |

## التشغيل محلياً

المتطلبات: Node.js بإصدار 22.13 أو أحدث.

```bash
pnpm install            # تثبيت الاعتماديات (pnpm 11)
npm run dev             # خادم التطوير على http://localhost:5173
npm run build           # بناء نسخة الإنتاج
npm run lint            # فحص ESLint
npm run db:generate     # توليد ترحيل لقاعدة البيانات بعد تعديل db/schema.ts
```

الاختبارات في `tests/` ملفات Node (`*.test.mjs`)، وتُشغَّل بعد التثبيت هكذا:

```bash
for t in tests/*.test.mjs; do node "$t"; done
```

## هيكل المشروع

```
app/          الصفحات وواجهات API (learn, labs, soc, missions, progress…)
components/   مكوّنات الواجهة (ومنها components/ui من shadcn)
lib/          المنهج، التصحيح، التخزين، الملاحة، المقاييس
db/           مخطط قاعدة البيانات (Drizzle)
drizzle/      ترحيلات D1
tests/        اختبارات المنطق والصفحات والـ Worker
docs/         التدقيق، سجل التطوير، دليل المطوّر
```

دليل المطوّر الكامل: [`docs/CyberLab-Guide.md`](docs/CyberLab-Guide.md)
سجل التطوير: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)
ملاحظات القالب الأصلي (vinext starter): [`docs/STARTER.md`](docs/STARTER.md)

## الترخيص

MIT — انظر [`LICENSE`](LICENSE). ملفات `vendor/` و`build/` المضمّنة لها تراخيصها الخاصة بجانبها.

## السلامة والحدود

كل عناوين IP والرسائل والسجلات في المختبرات أمثلة تدريبية مصطنعة. الطرفية قائمة أوامر مفسَّرة داخل React، ولا تنفّذ شيئاً على أي خادم. لا تضع كلمات مرور حقيقية في أي تمرين. أما الأسرار ومتغيرات البيئة (`.env*`) فمستبعدة من Git.

</div>

---

<a id="english"></a>

## English

**CyberLab** is an Arabic-first, interactive cybersecurity learning platform: bite-sized lessons, server-graded quizzes, safe simulated labs, SOC investigations, and persistent progress tracking.

### Highlights
- Structured learning journeys and tracks (networking, Linux, Python, log analysis, SOC, and more)
- Server-side grading (`lib/grading.ts`), so the browser cannot forge scores
- Simulated terminal and scenarios on synthetic data, with no real command execution
- Missions, dynamic incidents, investigation board, exportable lab reports
- XP, levels, badges, and activity history persisted in Cloudflare D1
- Full RTL, mobile-first UI

### Tech stack
Next.js 16 on vinext (Vite) · React 19 · Tailwind CSS 4 · shadcn/ui · Cloudflare Workers + D1 · Drizzle ORM · TypeScript

### Getting started
```bash
pnpm install
npm run dev          # http://localhost:5173
npm run build
npm run lint
for t in tests/*.test.mjs; do node "$t"; done
```
Requires Node.js >= 22.13.

See [`docs/CyberLab-Guide.md`](docs/CyberLab-Guide.md) for the developer guide and [`docs/STARTER.md`](docs/STARTER.md) for the original vinext starter notes (Sites hosting, auth headers, local D1 migrations).
