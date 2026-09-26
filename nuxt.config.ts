import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      htmlAttrs: { lang: 'ar', dir: 'rtl' },
      title: 'رواج — مساعد التسويق الذكي لتجار سلة',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'رواج يقرأ متجرك في سلة ويحوّل بياناته إلى حملات وعروض ومحتوى جاهز بالذكاء الاصطناعي.' },
        { name: 'theme-color', content: '#0a151a' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap' },
      ],
    },
  },
  runtimeConfig: {
    // جلسة المستخدم (مطلوب 32 حرف على الأقل)
    sessionPassword: '',
    // Claude API
    anthropicApiKey: '',
    // المهارات الاستراتيجية في باقتي نمو واحتراف
    anthropicModelPremium: 'claude-opus-5',
    // باقي المهارات
    anthropicModelStandard: 'claude-sonnet-5',
    // مفتاح صفحة التكاليف الداخلية (/api/admin/costs) — ٢٤ حرف أو أكثر
    adminToken: '',
    // مفتاح تشفير توكنات سلة في القاعدة
    tokenEncryptionKey: '',
    // سقف يومي لكل تشغيلات المتاجر التجريبية مجتمعة
    demoDailyRuns: 200,
    // لوحة الأدمن (/admin): إيميل + هاش كلمة المرور + سر 2FA — ولّدها بـ npm run admin:setup
    adminEmail: '',
    adminPasswordHash: '',
    adminTotpSecret: '',
    // تنبيهات الأخطاء والأمان (Slack / Discord / Telegram webhook)
    alertWebhookUrl: '',
    // Salla Partners app
    sallaClientId: '',
    sallaClientSecret: '',
    sallaWebhookSecret: '',
    sallaRedirectUri: '',
    // تفعيل وضع التجربة ببيانات وهمية
    demoMode: true,
    public: {
      appUrl: 'http://localhost:3000',
      sallaAppStoreUrl: 'https://s.salla.sa/apps',
    },
  },
  nitro: {
    storage: {
      data: { driver: 'fs', base: './.data/db' },
    },
    serverAssets: [{ baseName: 'skills', dir: './assets/skills' }],
    // تشغيل المهارة قد ياخذ دقائق مع التحليل العميق
    vercel: { functions: { maxDuration: 300 } },
  },
  typescript: { strict: true },
  // ترويسات الأمان في الإنتاج
  $production: {
    routeRules: {
      '/**': {
        headers: {
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self' https://accounts.salla.sa",
            "object-src 'none'",
          ].join('; '),
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
          'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        },
      },
      '/api/**': { headers: { 'Cache-Control': 'no-store' } },
    },
  },
})
