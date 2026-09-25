import { Redis } from '@upstash/redis'

// عدّادات ذرّية (INCR) للحدود ومنع الإساءة.
// في الإنتاج: Upstash Redis. في التطوير: ذاكرة العملية.
let redis: Redis | null | undefined
const mem = new Map<string, { n: number; exp: number }>()

function client() {
  if (redis === undefined) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    redis = url && token ? new Redis({ url, token }) : null
  }
  return redis
}

const k = (key: string) => `rawaj:c:${key}`

export async function counterIncr(key: string, ttlSec?: number): Promise<number> {
  const r = client()
  if (r) {
    const n = await r.incr(k(key))
    if (ttlSec && n === 1) await r.expire(k(key), ttlSec)
    return n
  }
  const now = Date.now()
  const cur = mem.get(key)
  const entry = cur && cur.exp > now ? cur : { n: 0, exp: ttlSec ? now + ttlSec * 1000 : Number.MAX_SAFE_INTEGER }
  entry.n++
  mem.set(key, entry)
  return entry.n
}

export async function counterDecr(key: string): Promise<number> {
  const r = client()
  if (r) return r.decr(k(key))
  const cur = mem.get(key)
  if (!cur) return 0
  cur.n = Math.max(0, cur.n - 1)
  return cur.n
}

export async function counterGet(key: string): Promise<number> {
  const r = client()
  if (r) return Number((await r.get<number>(k(key))) ?? 0)
  const cur = mem.get(key)
  return cur && cur.exp > Date.now() ? cur.n : 0
}

export async function counterDel(key: string) {
  const r = client()
  if (r) await r.del(k(key))
  else mem.delete(key)
}
