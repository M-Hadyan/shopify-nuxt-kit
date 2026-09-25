# دليل إطلاق رواج: Coolify + سلة

الدليل خطوة بخطوة. أينما ترى `DOMAIN` حط دومين رواج **بدون** `https://` وبدون `/` في آخره، مثل `rawaj.example.com`.

> **لا ترسل المفاتيح لأحد في محادثة.** كل مفتاح يتحط في إعدادات Coolify فقط.

---

## الخطوة ١: دمج الشغل في `main`

Coolify يبني من فرع `main`. ادمج الـPR المفتوح في GitHub أول.

---

## الخطوة ٢: الدومين

1. في لوحة الدومين عندك (Cloudflare أو غيرها)، سوّ سجل **A** للدومين الفرعي (مثل `rawaj`) يشير إلى IP سيرفر Coolify.
2. لو تستخدم Cloudflare: خلّ البروكسي (السحابة البرتقالية) **مطفي** في البداية لين يطلع Coolify شهادة SSL، وبعدين شغّله لو تبي.

---

## الخطوة ٣: Redis (قاعدة البيانات)

1. في Coolify افتح المشروع ← **+ New** ← **Database** ← **Redis**.
2. خلّ الإعدادات الافتراضية واضغط **Start**.
3. من صفحة Redis انسخ **Redis URL (internal)**، وشكله `redis://default:كلمة_السر@اسم-الخدمة:6379`.

> بدون Redis رواج يحفظ في ملفات على قرص دائم (الخطوة ٤)، ويشتغل. لكن Redis أسرع وأنسب للإنتاج.

---

## الخطوة ٤: التطبيق

1. **+ New** ← **Application** ← **GitHub** (أو Public Repository)، واختر `M-Hadyan/shopify-nuxt-kit` والفرع `main`.
2. **Build Pack: اختر `Dockerfile`** (موجود في جذر المشروع).
3. **Ports Exposes:** `3000`
4. **Domains:** `https://DOMAIN`
5. **Persistent Storage** (مهم لو ما استخدمت Redis، ومستحسن حتى لو استخدمته):
   - **+ Add** ← Volume
   - Destination Path: `/app/.data`
6. **Health Check:** مفعّل تلقائيًا من الـ Dockerfile (`/api/health`).

---

## الخطوة ٥: المتغيرات (Environment Variables)

في صفحة التطبيق ← **Environment Variables** أضف هذي. خلّ القيم الخاصة بسلة فاضية الحين، وترجع لها في الخطوة ٧.

| الاسم | القيمة |
|---|---|
| `REDIS_URL` | الرابط اللي نسخته في الخطوة ٣ |
| `NUXT_SESSION_PASSWORD` | نص عشوائي ٣٢ حرف أو أكثر. ولّده بأمر `openssl rand -hex 32` |
| `NUXT_TOKEN_ENCRYPTION_KEY` | نص عشوائي ثاني **مختلف**، لتشفير توكنات سلة. **لا تغيّره بعد الإطلاق**، لأن التوكنات المحفوظة ما راح تنفك |
| `NUXT_ANTHROPIC_API_KEY` | مفتاح Claude من [console.anthropic.com](https://console.anthropic.com) |
| `NUXT_ADMIN_TOKEN` | كلمة سر لتقرير التكاليف، ٢٤ حرف أو أكثر |
| `NUXT_PUBLIC_APP_URL` | `https://DOMAIN` |
| `NUXT_DEMO_MODE` | `true` (يخلي زر المتجر التجريبي شغال) |
| `NUXT_DEMO_DAILY_RUNS` | (اختياري) سقف تشغيلات المتجر التجريبي اليومي لكل الزوار، الافتراضي `200` |
| `NUXT_SALLA_REDIRECT_URI` | `https://DOMAIN/api/auth/salla/callback` |
| `NUXT_SALLA_CLIENT_ID` | من سلة (الخطوة ٧) |
| `NUXT_SALLA_CLIENT_SECRET` | من سلة (الخطوة ٧) |
| `NUXT_SALLA_WEBHOOK_SECRET` | من سلة (الخطوة ٧) |
| `NUXT_PUBLIC_SALLA_APP_STORE_URL` | رابط صفحة رواج في متجر تطبيقات سلة (بعد النشر) |

بعدها اضغط **Deploy**.

---

## الخطوة ٦: تأكد إن الموقع شغال

1. افتح `https://DOMAIN/api/health`، المفروض يطلع `{"ok":true}`.
2. افتح `https://DOMAIN` واضغط **جرّب المتجر التجريبي**، وشغّل أي مهارة. لو طلعت نتيجة، فـClaude شغال.
3. في **Logs** بـ Coolify دوّر على `[rawaj] storage: Redis`. وجودها يعني إن قاعدة البيانات مربوطة.

---

## الخطوة ٧: تطبيق رواج في بوابة شركاء سلة

1. ادخل [portal.salla.partners](https://portal.salla.partners) وسجّل حساب شريك.
2. من **تطبيقاتي** اضغط **إنشاء تطبيق** واختر **تطبيق عام**. التصنيف: **التسويق**.
3. **بيانات التطبيق:**
   - الاسم: رواج
   - الأيقونة: `public/favicon.svg` من المشروع (حوّلها PNG لو طلبوا)
   - رابط الموقع: `https://DOMAIN`
4. **طريقة الربط (OAuth Mode): اختر Custom Mode.**
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
7. انسخ **Client ID** و **Client Secret** و **Webhook Secret** إلى Coolify (الخطوة ٥)، ثم سوّ **Redeploy**.

---

## الخطوة ٨: الباقات في سلة

في قسم **التسعير / الباقات** بالتطبيق، سوّ ٣ باقات. **لازم يكون اسم كل باقة فيه الكلمة الإنجليزية** عشان رواج يتعرف عليها:

| اسم الباقة في سلة | شهري | سنوي |
|---|---|---|
| انطلاقة Starter | ٧٩ | ٧٩٠ |
| نمو Growth | ١٩٩ | ١٩٩٠ |
| احتراف Pro | ٤٤٩ | ٤٤٩٠ |

وفعّل **فترة تجربة مجانية ٧ أيام**.

---

## الخطوة ٩: التجربة على متجر

1. من البوابة سوّ **متجر تجريبي** وثبّت عليه رواج، وتأكد إن التثبيت يوديك لرواج وتشوف المهارات.
2. لتجربته على متجرك الحقيقي: شوف في البوابة خيار التثبيت على متجرك قبل النشر (تطبيق خاص أو رابط تثبيت). لو ما لقيته، قدّم التطبيق للمراجعة، وبعد القبول ثبّته من متجر التطبيقات.
3. بعد التثبيت ادخل من `https://DOMAIN` واضغط **دخول التجار**.

**قائمة التحقق بعد الربط:**
- [ ] اسم متجرك يطلع في الشريط العلوي، ومعه شارة "سلة".
- [ ] تشغيل مهارة يذكر منتجاتك الحقيقية في النتيجة.
- [ ] الإعدادات تعرض حالة الربط "متصل بسلة".
- [ ] تقرير التكاليف يشتغل:
  ```bash
  curl -H "x-admin-token: <NUXT_ADMIN_TOKEN>" https://DOMAIN/api/admin/costs
  ```

---

## لو صار شي

| المشكلة | السبب الغالب |
|---|---|
| البناء يفشل | تأكد إن Build Pack هو `Dockerfile`، وإن السيرفر فيه ذاكرة ٢ جيجا أو أكثر وقت البناء |
| الحاوية Unhealthy | شوف Logs. غالبًا `NUXT_SESSION_PASSWORD` ناقص أو أقصر من ٣٢ حرف |
| "مفتاح Claude API غير مضبوط" | `NUXT_ANTHROPIC_API_KEY` ناقص، أو ما سويت Redeploy بعد إضافته |
| الدخول يرجع "طلب تسجيل دخول غير صالح" | `NUXT_SALLA_REDIRECT_URI` مختلف عن الرابط اللي في بوابة سلة (حتى حرف أو `/` زايدة) |
| البيانات تختفي بعد كل Deploy | ما فيه `REDIS_URL` ولا Volume على `/app/.data` |
| الدخول ما يثبت (يطلعك كل مرة) | الموقع مو على HTTPS. الكوكي آمن ويحتاج HTTPS |
| الويبهوك يرجع 401 | `NUXT_SALLA_WEBHOOK_SECRET` مختلف عن اللي في البوابة |
| بيانات المتجر ناقصة في النتائج | صلاحية ناقصة في الخطوة ٧، أضفها وأعد تثبيت التطبيق |

---

## بديل: Vercel

المشروع يشتغل على Vercel بدون تعديل. بدل الخطوات ٣ و٤: اربط **Upstash Redis** من تبويب Storage (المتغيرات تنضاف تلقائيًا)، وخلّ باقي المتغيرات زي ما هي بدون `REDIS_URL`.
