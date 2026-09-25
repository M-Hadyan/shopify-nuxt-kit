# رواج — مساعد التسويق الذكي لتجار سلة

رواج منصة SaaS لتجار **سلة**. تقرأ بيانات المتجر (المنتجات، الطلبات، العملاء، السلات المتروكة، التقييمات، الكوبونات)، وتشغّل عليها «بطاقات» تسويقية بالذكاء الاصطناعي. كل بطاقة مبنية على منهجيات [marketingskills](https://github.com/coreyhaines31/marketingskills). وتقدر المنصة **تكتب** على المتجر أيضًا (تحديث المنتجات وإنشاء الكوبونات)، لكن بعد موافقة التاجر فقط.

## المزايا

| الجزء | الوصف |
|---|---|
| **صفحة الهبوط** | تعريف بالمنصة، طريقة العمل، البطاقات، الباقات، والأسئلة الشائعة |
| **لوحة التحكم** | مؤشرات آخر ٣٠ يوم، رسم المبيعات اليومية، الأكثر مبيعًا، وآخر النتائج |
| **البطاقات التسويقية (١٤)** | تحليل المتجر، أوصاف المنتجات، استرجاع السلات، العروض، الإعلانات، السوشال، SEO، المواسم، آراء العملاء، الشرائح والولاء، الرسائل، المؤثرين، خطة ٩٠ يوم، رفع التحويل |
| **المنتجات** | اقتراح اسم ووصف وبيانات SEO جديدة لأي منتج، مع معاينة قوقل، ثم «طبّق على متجري» |
| **مساعد رواج** | محادثة تقرأ المتجر بأدوات، وتقترح تعديلات (منتج أو كوبون) تظهر كبطاقة «قبل/بعد» ولا تُنفّذ إلا بعد ضغط «تطبيق» |
| **السجل** | كل نتائج البطاقات محفوظة ويمكن نسخها أو تحميلها |
| **الباقات** | فوترة من داخل سلة عبر ويبهوكات الاشتراك، مع حد تشغيلات شهري لكل باقة |
| **المتجر التجريبي** | متجر عطور وهمي كامل لتجربة المنصة قبل ربط سلة |

## التقنيات

- **Nuxt 4** + Vue 3 + TypeScript
- **Tailwind CSS v4**، واجهة عربية RTL، وخط IBM Plex Sans Arabic
- **Claude API** (`@anthropic-ai/sdk`): النموذج `claude-opus-5` مع adaptive thinking، بث مباشر للنتائج، مخرجات منظمة (JSON schema) لتحسين المنتجات، استخدام الأدوات للمساعد، prompt caching لمراجع المهارات، و `fallbacks: "default"` (لو رفض النموذج طلبًا يُعاد تلقائيًا على نموذج بديل)
- **Salla Admin API v2** + OAuth 2.0 + Webhooks
- التخزين عبر Nitro `useStorage` (ملفات محلية في التطوير، ويمكن تبديله إلى Redis أو Postgres أو غيرها بتغيير الـ driver)

## التشغيل محليًا

```bash
npm install
cp .env.example .env    # عبّ NUXT_ANTHROPIC_API_KEY على الأقل
npm run dev             # http://localhost:3000
```

اضغط «جرّب المتجر التجريبي» في الصفحة الرئيسية، وتدخل بمتجر وهمي كامل.

| الأمر | الوظيفة |
|---|---|
| `npm run dev` | خادم التطوير |
| `npm run build` | بناء نسخة الإنتاج (`.output/`) |
| `npm run typecheck` | فحص الأنواع |
| `npm run sync-skills <path>` | تحديث ملفات المهارات من نسخة محلية من ريبو marketingskills |

## ربط سلة (الخطوة الجاية)

1. أنشئ تطبيقًا في [بوابة شركاء سلة](https://portal.salla.partners).
2. **Redirect URL**: `https://<دومينك>/api/auth/salla/callback`
3. **Webhook URL**: `https://<دومينك>/api/webhooks/salla`. اختر استراتيجية التوقيع (Signature)، وضع السر في `NUXT_SALLA_WEBHOOK_SECRET`.
4. **الصلاحيات (Scopes)**: `offline_access settings.read products.read_write orders.read customers.read marketing.read_write carts.read reviews.read`
5. **الباقات**: عرّف باقات التطبيق في سلة بأسماء تحتوي `basic` أو `pro` أو `business`. الربط مع باقات رواج يصير في `shared/utils/plans.ts`.
6. عبّ `NUXT_SALLA_CLIENT_ID` و `NUXT_SALLA_CLIENT_SECRET` و `NUXT_SALLA_REDIRECT_URI`.
7. في الإنتاج: `NUXT_DEMO_MODE=false` ونص عشوائي طويل في `NUXT_SESSION_PASSWORD`.

**الويبهوكات المدعومة:** `app.store.authorize` (وضع Easy Mode لاستلام التوكن)، `app.installed`، `app.uninstalled`، `app.trial.started`، `app.trial.expired`، `app.subscription.started`، `app.subscription.renewed`، `app.subscription.expired`، `app.subscription.canceled`.

> ربط الحقول مع Salla API مكتوب بشكل دفاعي في `server/utils/salla/live.ts`. راجع أسماء الحقول مع توثيق سلة عند أول ربط حقيقي، خصوصًا السلات المتروكة والتقييمات والكوبونات.

## هيكل المشروع

```
app/
  pages/index.vue            صفحة الهبوط
  pages/app/…                لوحة التحكم (الرئيسية، البطاقات، المساعد، المنتجات، السجل، الإعدادات)
  components/                SkillCard، StatCard، SalesChart، MarkdownView…
  layouts/dashboard.vue      الشريط الجانبي
  assets/css/main.css        ألوان الهوية (غيّرها هنا)
shared/
  utils/skills.ts            تعريف البطاقات (العنوان، المهارات المصدر، البيانات، المدخلات، المهمة)
  utils/plans.ts             الباقات والحدود
  types/                     الأنواع المشتركة
server/
  api/                       المسارات (auth، webhooks، store، skills، assistant، actions، runs)
  utils/ai.ts                Claude: التعليمات، تحميل المهارات، تحسين المنتج
  utils/assistant.ts         المساعد: الأدوات، حلقة الأدوات، الاقتراحات
  utils/store-api.ts         ملخص المتجر وسياق الذكاء الاصطناعي
  utils/salla/               عميل سلة الحقيقي والتجريبي وOAuth
  assets/skills/             ملفات SKILL.md من marketingskills (MIT)
```

## إضافة بطاقة جديدة

أضف عنصرًا في `shared/utils/skills.ts`:

```ts
{
  slug: 'my-card',
  title: 'عنوان البطاقة',
  tagline: '…',
  description: '…',
  icon: 'Sparkles',            // من AppIcon.vue
  tone: 'violet',
  category: 'sales',
  sources: ['offers', 'pricing'], // أسماء ملفات server/assets/skills
  data: ['products', 'orders'],   // البيانات اللي تُرسل للنموذج
  inputs: [],
  task: 'المطلوب بالتفصيل…',
}
```

## الترخيص

ملفات المهارات في `server/assets/skills/` من ريبو [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) تحت رخصة MIT (نص الرخصة في `server/assets/skills/LICENSE`).
