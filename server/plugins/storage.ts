import redisDriver from 'unstorage/drivers/redis'
import upstashDriver from 'unstorage/drivers/upstash'

// مكان حفظ البيانات في الإنتاج، بالترتيب:
// ١) REDIS_URL: Redis عادي (مثل خدمة Redis في Coolify)
// ٢) Upstash (UPSTASH_REDIS_REST_* أو KV_REST_API_* من Vercel)
// ٣) بدونها: ملفات في .data (لازم Volume دائم في Coolify)
export default defineNitroPlugin(async () => {
  const storage = useStorage()
  const redisUrl = process.env.REDIS_URL
  const upUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const upToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (redisUrl) {
    await storage.unmount('data', false)
    storage.mount('data', redisDriver({ url: redisUrl, base: 'rawaj' }))
    console.info('[rawaj] storage: Redis')
  } else if (upUrl && upToken) {
    await storage.unmount('data', false)
    storage.mount('data', upstashDriver({ url: upUrl, token: upToken, base: 'rawaj' }))
    console.info('[rawaj] storage: Upstash Redis')
  } else if (process.env.VERCEL) {
    console.error('[rawaj] ما فيه Redis: البيانات ما راح تنحفظ بين الطلبات على Vercel')
  } else if (!import.meta.dev) {
    console.info('[rawaj] storage: files in .data (تأكد إن المجلد على Volume دائم)')
  }
})
