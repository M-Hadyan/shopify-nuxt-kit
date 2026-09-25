import upstashDriver from 'unstorage/drivers/upstash'

// في الإنتاج (Vercel) نخزن البيانات في Upstash Redis بدل ملفات السيرفر
// يقبل متغيرات Upstash المباشرة أو اللي تضيفها Vercel Marketplace تلقائيًا
export default defineNitroPlugin(async () => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (url && token) {
    const storage = useStorage()
    await storage.unmount('data', false)
    storage.mount('data', upstashDriver({ url, token, base: 'rawaj' }))
    console.info('[rawaj] storage: Upstash Redis')
  } else if (process.env.VERCEL) {
    console.error('[rawaj] Upstash Redis غير مضبوط: البيانات ما راح تنحفظ بين الطلبات على Vercel')
  }
})
