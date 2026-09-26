# رواج — مساعد التسويق الذكي لتجار سلة

رواج منصة تسويق فقط لتجار **سلة**. تضم كل مهارات ريبو [marketingskills](https://github.com/coreyhaines31/marketingskills) (٥٠ مهارة)، وكل مهارة بطاقة. التاجر يختار مهارة ويكتب طلبه، ورواج يطبّق منهجية المهارة على ملخص بيانات متجره في سلة (قراءة فقط) ويعطيه نتيجة جاهزة.

## المزايا

| الجزء | الوصف |
|---|---|
| **صفحة الهبوط** | تعريف بالمنصة، طريقة العمل، المهارات، الباقات، والأسئلة الشائعة |
| **المهارات (٥٠)** | كل مهارات الريبو بنفس تصنيفاته: رفع التحويل، المحتوى، SEO، الإعلانات، القياس، الاحتفاظ، النمو، الاستراتيجية، المبيعات |
| **تشغيل المهارة** | طلب حر (اختياري) والنتيجة تنكتب مباشرة، مع نسخ وتحميل Markdown |
| **السجل** | كل النتائج محفوظة |
| **الباقات** | ٣ باقات (انطلاقة، نمو، احتراف) بفوترة من داخل سلة، وتجربة مجانية ٧ أيام |
| **المتجر التجريبي** | متجر عطور وهمي لتجربة المنصة قبل ربط سلة |
| **لوحة الإدارة** (`/admin`) | دخول بـ 2FA؛ مراقبة صحة النظام والمقاييس والإيراد مقابل التكلفة؛ إدارة المتاجر (إيقاف، باقة، إهداء تشغيلات)؛ سجلات كاملة للأحداث وطلبات الـ API؛ وتنبيهات Slack/Discord/Telegram |

## الباقات

| | انطلاقة | نمو | احتراف |
|---|---|---|---|
| السعر الشهري | ٧٩ ر.س | ١٩٩ ر.س | ٤٤٩ ر.س |
| السعر السنوي | ٧٩٠ ر.س | ١٩٩٠ ر.س | ٤٤٩٠ ر.س |
| المهارات | ٢٩ (المحتوى، الإعلانات، الاستراتيجية، رفع التحويل) | كل الـ ٥٠ | كل الـ ٥٠ |
| التشغيلات الشهرية | ٦٠ | ٢٠٠ | ٥٠٠ |
| النموذج | Sonnet 5 لكل المهارات | Opus 5 للمهارات الاستراتيجية، Sonnet 5 للباقي | مثل نمو، بتحليل أعمق (`effort: high`) |

- **التجربة المجانية:** ٧ أيام على باقة نمو بحد ١٥ تشغيل (`app.trial.started`).
- **الربط مع سلة:** سمِّ باقات التطبيق في بوابة الشركاء بأسماء تحتوي `starter` أو `growth` أو `pro` (أو انطلاقة، نمو، احتراف). الربط في `shared/utils/plans.ts`.
- **التشغيل اللي يفشل ما ينحسب.**

## التكاليف (نموذج التكلفة)

**توزيع النماذج:** المهارات الخفيفة (نصوص، إعلانات، رسائل) تشتغل على `claude-sonnet-5`. المهارات الاستراتيجية الثقيلة (١٨ مهارة، القائمة في `HEAVY_SKILLS` داخل `shared/utils/skills.ts`) تشتغل على `claude-opus-5` في باقتي نمو واحتراف فقط. سقف المخرجات ١٦ ألف توكن للخفيفة و٢٤ ألف للثقيلة.

**التكلفة التقديرية لكل تشغيل:** Sonnet من ٠٫٣٥ إلى ٠٫٤٥ ر.س، وOpus من ٠٫٩٥ إلى ١٫٣ ر.س، حسب عمق التحليل.

**أسوأ حالة (التاجر يستهلك كل حده، و٣٠٪ من تشغيلاته مهارات ثقيلة):**

| الباقة | السعر | أقصى تكلفة ذكاء اصطناعي | الهامش قبل عمولة سلة |
|---|---|---|---|
| انطلاقة | ٧٩ | ~٢١ ر.س | ~٧٣٪ |
| نمو | ١٩٩ | ~١٠٦ ر.س | ~٤٧٪ |
| احتراف | ٤٤٩ | ~٣٥٣ ر.س | ~٢١٪ (وعند استهلاك ٤٠٪ من الحد تقريبًا ٦٩٪) |

> هذي تقديرات. التكلفة الفعلية لكل تشغيل تنحسب من `usage` وتنحفظ في السجل (`costSar`). راجعها بعد أول الاستخدامات الحقيقية وعدّل الحدود أو الأسعار:
>
> ```bash
> curl -H "x-admin-token: $NUXT_ADMIN_TOKEN" https://<دومينك>/api/admin/costs
> ```
>
> يعرض الإجمالي ومتوسط التشغيل حسب النموذج والمهارة والمتجر. تغيير النماذج من `NUXT_ANTHROPIC_MODEL_PREMIUM` و `NUXT_ANTHROPIC_MODEL_STANDARD`.

## التقنيات

- **Nuxt 4** + Vue 3 + TypeScript
- **Tailwind CSS v4**، واجهة عربية RTL بثيم داكن وأخضر زمردي، وخط Alexandria
- **Claude API** (`@anthropic-ai/sdk`): `claude-sonnet-5` و `claude-opus-5` حسب المهارة والباقة، مع adaptive thinking، بث مباشر للنتائج، prompt caching لمرجع المهارة، و `fallbacks: "default"` (لو رفض النموذج طلبًا يُعاد تلقائيًا على نموذج بديل)
- **Salla Admin API v2** (قراءة فقط) + OAuth 2.0 + Webhooks
- التخزين عبر Nitro `useStorage`: **Redis** (`REDIS_URL`) أو **Upstash**، أو ملفات على Volume دائم (`server/plugins/storage.ts`)

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
| `npm run test:security` | بناء واختبارات الأمان (٢٩ اختبار) — شوف [SECURITY.md](SECURITY.md) |
| `npm run admin:setup` | توليد بيانات دخول لوحة الإدارة (هاش كلمة المرور + سر 2FA) |
| `npm run sync-skills <path>` | تحديث ملفات المهارات من نسخة محلية من ريبو marketingskills |

## الإطلاق على Coolify وربط سلة

الدليل الكامل خطوة بخطوة: **[docs/DEPLOY.md](docs/DEPLOY.md)**. المشروع فيه `Dockerfile` جاهز، ويشتغل كمان على Vercel.

### ملخص الربط مع سلة

1. أنشئ تطبيقًا في [بوابة شركاء سلة](https://portal.salla.partners).
2. **Redirect URL**: `https://<دومينك>/api/auth/salla/callback`
3. **Webhook URL**: `https://<دومينك>/api/webhooks/salla`. اختر استراتيجية التوقيع (Signature)، وضع السر في `NUXT_SALLA_WEBHOOK_SECRET`.
4. **الصلاحيات (Scopes)**: `offline_access settings.read products.read orders.read customers.read marketing.read carts.read reviews.read`
5. **الباقات**: عرّف ٣ باقات في سلة بأسماء تحتوي `starter` و `growth` و `pro` (شوف قسم الباقات فوق).
6. عبّ `NUXT_SALLA_CLIENT_ID` و `NUXT_SALLA_CLIENT_SECRET` و `NUXT_SALLA_REDIRECT_URI`.
7. في الإنتاج: `NUXT_DEMO_MODE=false` ونص عشوائي طويل في `NUXT_SESSION_PASSWORD`.

**الويبهوكات المدعومة:** `app.store.authorize` (وضع Easy Mode لاستلام التوكن)، `app.installed`، `app.uninstalled`، `app.trial.started`، `app.trial.expired`، `app.subscription.started`، `app.subscription.renewed`، `app.subscription.expired`، `app.subscription.canceled`.

> ربط الحقول مع Salla API مكتوب بشكل دفاعي في `server/utils/salla/live.ts`. راجع أسماء الحقول مع توثيق سلة عند أول ربط حقيقي، خصوصًا السلات المتروكة والتقييمات والكوبونات.

## هيكل المشروع

```
app/
  pages/index.vue            صفحة الهبوط
  pages/app/index.vue        كل المهارات (بحث وتصنيفات)
  pages/app/skills/[slug]    تشغيل مهارة
  pages/app/history          السجل
  pages/app/settings.vue     المتجر والباقة
  assets/css/main.css        ألوان الهوية (غيّرها هنا)
shared/utils/skills.ts       قائمة المهارات (العنوان العربي، الأيقونة، التصنيف)
shared/utils/plans.ts        الباقات والحدود
server/
  api/                       auth، webhooks، skills، runs، me
  utils/ai.ts                Claude: التعليمات وتحميل مرجع المهارة
  utils/store-api.ts         ملخص بيانات المتجر للذكاء الاصطناعي
  utils/salla/               عميل سلة الحقيقي والتجريبي وOAuth
  assets/skills/             ملفات SKILL.md من marketingskills (MIT)
```

## تحديث المهارات من الريبو

```bash
git clone https://github.com/coreyhaines31/marketingskills /tmp/marketingskills
npm run sync-skills /tmp/marketingskills
```

لو أُضيفت مهارة جديدة في الريبو، أضف لها سطرًا في `shared/utils/skills.ts` (العنوان العربي والأيقونة والتصنيف).

## الترخيص

ملفات المهارات في `server/assets/skills/` من ريبو [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) تحت رخصة MIT (نص الرخصة في `server/assets/skills/LICENSE`).
