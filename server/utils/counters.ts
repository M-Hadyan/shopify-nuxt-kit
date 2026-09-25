import { Redis as Upstash } from '@upstash/redis'
import IORedis from 'ioredis'

// عدّادات ذرّية للحدود ومنع الإساءة.
// Redis (REDIS_URL) أو Upstash: أوامر INCR الذرّية.
// بدونهما (سيرفر واحد): تنحفظ في التخزين مع قفل داخل العملية عشان ما تضيع بعد إعادة التشغيل.
interface Backend {
  incr(key: string, ttlSec?: number): Promise<number>
  decr(key: string): Promise<number>
  get(key: string): Promise<number>
  del(key: string): Promise<void>
}

const k = (key: string) => `rawaj:c:${key}`

function ioredisBackend(url: string): Backend {
  const r = new IORedis(url, { maxRetriesPerRequest: 3 })
  return {
    async incr(key, ttl) {
      const n = await r.incr(k(key))
      if (ttl && n === 1) await r.expire(k(key), ttl)
      return n
    },
    decr: key => r.decr(k(key)),
    get: async key => Number((await r.get(k(key))) ?? 0),
    del: async (key) => { await r.del(k(key)) },
  }
}

function upstashBackend(url: string, token: string): Backend {
  const r = new Upstash({ url, token })
  return {
    async incr(key, ttl) {
      const n = await r.incr(k(key))
      if (ttl && n === 1) await r.expire(k(key), ttl)
      return n
    },
    decr: key => r.decr(k(key)),
    get: async key => Number((await r.get<number>(k(key))) ?? 0),
    del: async (key) => { await r.del(k(key)) },
  }
}

function storageBackend(): Backend {
  const locks = new Map<string, Promise<unknown>>()
  const withLock = <T>(key: string, fn: () => Promise<T>) => {
    const prev = locks.get(key) ?? Promise.resolve()
    const next = prev.then(fn, fn)
    locks.set(key, next.catch(() => {}))
    return next
  }
  const store = () => useStorage('data')
  type Entry = { n: number; exp: number }
  const read = async (key: string) => {
    const e = await store().getItem<Entry>(`counters:${key}`)
    return e && e.exp > Date.now() ? e : null
  }
  return {
    incr: (key, ttl) => withLock(key, async () => {
      const e = (await read(key)) ?? { n: 0, exp: ttl ? Date.now() + ttl * 1000 : Number.MAX_SAFE_INTEGER }
      e.n++
      await store().setItem(`counters:${key}`, e)
      return e.n
    }),
    decr: key => withLock(key, async () => {
      const e = await read(key)
      if (!e) return 0
      e.n = Math.max(0, e.n - 1)
      await store().setItem(`counters:${key}`, e)
      return e.n
    }),
    get: async key => (await read(key))?.n ?? 0,
    del: key => withLock(key, () => store().removeItem(`counters:${key}`)),
  }
}

let backend: Backend | undefined
function b(): Backend {
  if (!backend) {
    const redisUrl = process.env.REDIS_URL
    const upUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const upToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    backend = redisUrl ? ioredisBackend(redisUrl) : upUrl && upToken ? upstashBackend(upUrl, upToken) : storageBackend()
  }
  return backend
}

export const counterIncr = (key: string, ttlSec?: number) => b().incr(key, ttlSec)
export const counterDecr = (key: string) => b().decr(key)
export const counterGet = (key: string) => b().get(key)
export const counterDel = (key: string) => b().del(key)
