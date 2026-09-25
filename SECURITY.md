# الأمان في رواج

## الضوابط المطبقة

| المجال | الضابط | الملف |
|---|---|---|
| **الجلسات** | كوكي مشفر (iron-seal) بخصائص HttpOnly و Secure و SameSite=Lax، وسر ٣٢ حرف أو أكثر إلزامي في الإنتاج | `server/utils/session.ts` |
| **الصلاحيات** | كل API محمية بـ `requireStore`، والنتائج مخزنة تحت معرف المتجر (ما يقدر متجر يقرأ نتائج متجر ثاني) | `server/utils/session.ts`، `server/api/runs` |
| **OAuth سلة** | state عشوائي في كوكي HttpOnly ويتحقق منه عند الدخول، وصلاحيات قراءة فقط | `server/api/auth/salla` |
| **توكنات سلة** | مشفرة في القاعدة بـ AES-256-GCM، وتنحذف فور إلغاء التثبيت. يُعالج تجديد التوكن المتزامن | `server/utils/crypto.ts`، `server/utils/db.ts` |
| **الويبهوك** | تحقق HMAC-SHA256 (أو Token) بمقارنة ثابتة الزمن، ورفض المحتوى التالف | `server/api/webhooks/salla.post.ts` |
| **حدود الاستخدام** | حجز ذرّي للتشغيل (Redis INCR) مع إرجاعه لو فشل، وتشغيلين متزامنين كحد أقصى لكل متجر | `server/utils/quota.ts`، `server/utils/counters.ts` |
| **إساءة المتجر التجريبي** | ٥ تشغيلات لكل متجر تجريبي، وسقف يومي عام (`NUXT_DEMO_DAILY_RUNS`)، و٣ متاجر تجريبية لكل IP يوميًا، وحذف تلقائي بعد ٧ أيام | `server/utils/quota.ts`، `server/api/auth/demo.post.ts` |
| **تكلفة الذكاء الاصطناعي** | سقف توكنات المخرجات لكل تشغيل، وطلب التاجر يُقص عند ٤٠٠٠ حرف | `server/utils/ai.ts` |
| **Prompt injection** | بيانات المتجر محاطة بـ `<store_data>` مع تعليمات صريحة بعدم تنفيذ ما بداخلها | `server/utils/ai.ts` |
| **XSS** | ناتج الذكاء الاصطناعي ينظف بـ DOMPurify، والروابط تفتح بـ `noopener noreferrer nofollow` | `app/components/MarkdownView.vue` |
| **الترويسات** | CSP (`frame-ancestors 'none'`، `object-src 'none'`)، HSTS، X-Frame-Options، nosniff، Permissions-Policy، و `no-store` للـ API | `nuxt.config.ts` |
| **تقرير التكاليف** | مخفي (404) بدون مفتاح ٢٤ حرف أو أكثر، ومقارنة ثابتة الزمن | `server/api/admin/costs.get.ts` |
| **خصوصية البيانات** | يُرسل للذكاء الاصطناعي ملخصات مجمّعة فقط، بدون أسماء أو أرقام العملاء. وتنحذف بيانات المتجر عند إلغاء التثبيت | `server/utils/store-api.ts` |

## الاختبارات

`tests/security.test.mjs` فيه ٢١ اختبار تشتغل على نسخة الإنتاج مع خادم Claude وهمي:

```bash
npm run test:security
```

تشتغل تلقائيًا على كل PR عبر GitHub Actions (`.github/workflows/ci.yml`)، مع `npm audit` وفحص الأنواع.

## مخاطر معروفة ومقبولة

- **الدخول من صفحة التثبيت في سلة** يصل بدون state منّا، فنقبله لأن الكود يتحقق منه سلة نفسها. الخطر: login CSRF محدود (تسجيل دخول الضحية لمتجر المهاجم)، وأثره منخفض لأن رواج قراءة فقط.
- **CSP فيها `'unsafe-inline'`** للسكربتات والستايل، لأن Nuxt يحتاجها في تهيئة الصفحة.
- **Prompt injection** ما يمكن منعه 100%. الأثر محصور في نص النتيجة، والنتيجة منظفة وما لها أي صلاحية كتابة.
- **حد الـ IP للمتجر التجريبي** ياخذ آخر عنوان في `x-forwarded-for` (اللي يضيفه البروكسي: Traefik في Coolify أو Vercel)، عشان ما يقدر العميل يزوّره. السقف اليومي العام هو خط الدفاع الثاني.

## الإبلاغ عن ثغرة

راسلنا مباشرة وما تنشرها علنًا قبل الإصلاح.
