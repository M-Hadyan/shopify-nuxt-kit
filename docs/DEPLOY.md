# دليل إطلاق رواج: Vercel + سلة

الدليل خطوة بخطوة. أينما ترى `DOMAIN` حط رابط موقعك **بدون** `/` في آخره، مثل `rawaj.vercel.app` أو دومينك الخاص.

> **لا ترسل المفاتيح لأحد في محادثة.** كل مفتاح يتحط في إعدادات Vercel فقط.

---

## الخطوة ١: دمج الشغل في `main`

Vercel ينشر من فرع `main`. افتح الـPR في GitHub وادمجه:
https://github.com/M-Hadyan/shopify-nuxt-kit/pull/1

---

## الخطوة ٢: رفع المشروع على Vercel

1. ادخل [vercel.com](https://vercel.com) وسجّل بحساب GitHub.
2. اضغط **Add New… ← Project**، واختر الريبو `shopify-nuxt-kit`، ثم **Import**.
3. Vercel يتعرف على Nuxt تلقائيًا. لا تغيّر شي في إعدادات البناء.
4. لا تضغط Deploy الحين. كمّل الخطوة ٣ أول.

---

## الخطوة ٣: قاعدة البيانات (Upstash Redis)

رواج يحفظ المتاجر والسجل والاستخدام هنا، والخطة المجانية تكفي للبداية.

1. في مشروعك على Vercel افتح تبويب **Storage**.
2. اضغط **Create Database** واختر **Upstash** ← **Redis**، والمنطقة الأقرب (Frankfurt مثلًا).
3. اربطها بالمشروع (**Connect Project**).

Vercel يضيف مفاتيح القاعدة (`KV_REST_API_URL` و `KV_REST_API_TOKEN`) تلقائيًا، ورواج يقرأها بنفسه.

---

## الخطوة ٤: المتغيرات (Environment Variables)

في **Settings ← Environment Variables** أضف هذي. خلّ القيم الخاصة بسلة فاضية الحين، وترجع لها في الخطوة ٦.

| الاسم | القيمة |
|---|---|
| `NUXT_SESSION_PASSWORD` | نص عشوائي طويل (٣٢ حرف أو أكثر). ولّده بأمر `openssl rand -hex 32` في الطرفية، أو من مدير كلمات المرور |
| `NUXT_ANTHROPIC_API_KEY` | مفتاح Claude من [console.anthropic.com](https://console.anthropic.com) (API Keys) |
| `NUXT_TOKEN_ENCRYPTION_KEY` | نص عشوائي طويل **مختلف** عن اللي فوق، لتشفير توكنات سلة. لا تغيّره بعد الإطلاق، لأن التوكنات القديمة ما راح تنفك |
| `NUXT_ADMIN_TOKEN` | كلمة سر لتقرير التكاليف، ٢٤ حرف أو أكثر |
| `NUXT_DEMO_DAILY_RUNS` | (اختياري) سقف تشغيلات المتجر التجريبي اليومي لكل الزوار، الافتراضي ٢٠٠ |
| `NUXT_PUBLIC_APP_URL` | `https://DOMAIN` |
| `NUXT_DEMO_MODE` | `true` (يخلي زر المتجر التجريبي شغال، وحطها `false` بعد الإطلاق) |
| `NUXT_SALLA_REDIRECT_URI` | `https://DOMAIN/api/auth/salla/callback` |
| `NUXT_SALLA_CLIENT_ID` | من سلة (الخطوة ٦) |
| `NUXT_SALLA_CLIENT_SECRET` | من سلة (الخطوة ٦) |
| `NUXT_SALLA_WEBHOOK_SECRET` | من سلة (الخطوة ٦) |
| `NUXT_PUBLIC_SALLA_APP_STORE_URL` | رابط صفحة رواج في متجر تطبيقات سلة (بعد النشر) |

بعدها اضغط **Deploy**.

**ما تعرف الرابط قبل النشر؟** انشر مرة، وخذ الرابط من Vercel (مثل `rawaj-xxxx.vercel.app`)، ثم عدّل `NUXT_PUBLIC_APP_URL` و `NUXT_SALLA_REDIRECT_URI` وسوّ **Redeploy**.

---

## الخطوة ٥: تأكد إن الموقع شغال

1. افتح `https://DOMAIN`. المفروض تطلع صفحة رواج.
2. اضغط **جرّب المتجر التجريبي** وشغّل أي مهارة. لو طلعت نتيجة، فـClaude شغال.
3. في Vercel افتح **Logs** ودوّر على `[rawaj] storage: Upstash Redis`. وجودها يعني إن قاعدة البيانات مربوطة.

---

## الخطوة ٦: تطبيق رواج في بوابة شركاء سلة

1. ادخل [portal.salla.partners](https://portal.salla.partners) وسجّل حساب شريك.
2. من **تطبيقاتي** اضغط **إنشاء تطبيق** واختر **تطبيق عام**. التصنيف: **التسويق**.
3. **بيانات التطبيق:**
   - الاسم: رواج
   - الأيقونة: `public/favicon.svg` من المشروع (حوّلها PNG لو طلبوا)
   - رابط الموقع: `https://DOMAIN`
4. **طريقة الربط (OAuth Mode): اختر Custom Mode.** رواج يستلم التاجر على رابط الرجوع.
   - **Callback / Redirect URL:** `https://DOMAIN/api/auth/salla/callback`
5. **الصلاحيات (Scopes)، قراءة فقط:**
   - Settings (Read)
   - Products (Read)
   - Orders (Read)
   - Customers (Read)
   - Marketing (Read)
   - Carts (Read)
   - Reviews (Read)
   - وفعّل **Offline access** لو كان خيار مستقل
6. **الويبهوك (Webhooks):**
   - الرابط: `https://DOMAIN/api/webhooks/salla`
   - طريقة الحماية: **Signature**
   - انسخ **Webhook Secret**
   - الأحداث: كل أحداث التطبيق (`app.installed`، `app.uninstalled`، `app.store.authorize`، `app.trial.*`، `app.subscription.*`)
7. انسخ **Client ID** و **Client Secret** و **Webhook Secret** إلى Vercel (الخطوة ٤)، ثم سوّ **Redeploy**.

---

## الخطوة ٧: الباقات في سلة

في قسم **التسعير / الباقات** بالتطبيق، سوّ ٣ باقات. **لازم يكون اسم كل باقة فيه الكلمة الإنجليزية** عشان رواج يتعرف عليها:

| اسم الباقة في سلة | شهري | سنوي |
|---|---|---|
| انطلاقة Starter | ٧٩ | ٧٩٠ |
| نمو Growth | ١٩٩ | ١٩٩٠ |
| احتراف Pro | ٤٤٩ | ٤٤٩٠ |

وفعّل **فترة تجربة مجانية ٧ أيام**.

---

## الخطوة ٨: التجربة على متجر

1. من البوابة سوّ **متجر تجريبي** وثبّت عليه رواج، وتأكد إن التثبيت يوديك لرواج وتشوف المهارات.
2. لتجربته على متجرك الحقيقي (خشب العود): شوف في البوابة خيار التثبيت على متجرك قبل النشر (تطبيق خاص أو رابط تثبيت). لو ما لقيته، قدّم التطبيق للمراجعة، وبعد القبول ثبّته من متجر التطبيقات.
3. بعد التثبيت ادخل من `https://DOMAIN` واضغط **دخول التجار**.

**قائمة التحقق بعد الربط:**
- [ ] اسم متجرك يطلع في الشريط العلوي، ومعه شارة "سلة".
- [ ] تشغيل مهارة (مثل كتابة النصوص) يذكر منتجاتك الحقيقية في النتيجة.
- [ ] الإعدادات تعرض حالة الربط "متصل بسلة".
- [ ] تقرير التكاليف يشتغل:
  ```bash
  curl -H "x-admin-token: <NUXT_ADMIN_TOKEN>" https://DOMAIN/api/admin/costs
  ```

---

## لو صار شي

| المشكلة | السبب الغالب |
|---|---|
| خطأ 500 في كل الصفحات | `NUXT_SESSION_PASSWORD` ناقص أو أقصر من ٣٢ حرف |
| "مفتاح Claude API غير مضبوط" | `NUXT_ANTHROPIC_API_KEY` ناقص أو غلط، أو ما سويت Redeploy بعد إضافته |
| الدخول يرجع "طلب تسجيل دخول غير صالح" | `NUXT_SALLA_REDIRECT_URI` مختلف عن الرابط اللي في بوابة سلة (حتى حرف أو `/` زايدة) |
| البيانات تختفي | Upstash غير مربوط، ارجع للخطوة ٣ |
| الويبهوك يرجع 401 | `NUXT_SALLA_WEBHOOK_SECRET` مختلف عن اللي في البوابة |
| بيانات المتجر ناقصة في النتائج | صلاحية ناقصة في الخطوة ٦، أضفها وأعد تثبيت التطبيق |
