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
    // مفتاح صفحة التكاليف الداخلية (/api/admin/costs)
    adminToken: '',
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
})
