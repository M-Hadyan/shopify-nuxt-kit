// عدّادات ذرّية للحدود والمقاييس.
// Redis/Upstash: أوامر INCRBY الذرّية.
// بدونهما (سيرفر واحد): تنحفظ في التخزين مع قفل داخل العملية عشان ما تضيع بعد إعادة التشغيل.
const k = (key: string) => `rawaj:c:${key}`

const locks = new Map<string, Promise<unknown>>()
function withLock<T>(key: string, fn: () => Promise<T>) {
  const prev = locks.get(key) ?? Promise.resolve()
  const next = prev.then(fn, fn)
  locks.set(key, next.catch(() => {}))
  return next
}
type Entry = { n: number; exp: number }
const store = () => useStorage('data')
async function readEntry(key: string) {
  const e = await store().getItem<Entry>(`counters:${key}`)
  return e && e.exp > Date.now() ? e : null
}

export async function counterIncrBy(key: string, by: number, ttlSec?: number): Promise<number> {
  const c = redisConn()
  if (c) {
    const n = c.kind === 'ioredis' ? await c.client.incrby(k(key), by) : await c.client.incrby(k(key), by)
    if (ttlSec && n === by) await c.client.expire(k(key), ttlSec)
    return n
  }
  return withLock(key, async () => {
    const e = (await readEntry(key)) ?? { n: 0, exp: ttlSec ? Date.now() + ttlSec * 1000 : Number.MAX_SAFE_INTEGER }
    e.n += by
    await store().setItem(`counters:${key}`, e)
    return e.n
  })
}

export const counterIncr = (key: string, ttlSec?: number) => counterIncrBy(key, 1, ttlSec)

export async function counterDecr(key: string): Promise<number> {
  const c = redisConn()
  if (c) return c.client.decr(k(key))
  return withLock(key, async () => {
    const e = await readEntry(key)
    if (!e) return 0
    e.n = Math.max(0, e.n - 1)
    await store().setItem(`counters:${key}`, e)
    return e.n
  })
}

export async function counterGet(key: string): Promise<number> {
  const c = redisConn()
  if (c) return Number((await c.client.get(k(key))) ?? 0)
  return (await readEntry(key))?.n ?? 0
}

export async function counterGetMany(keys: string[]): Promise<number[]> {
  if (!keys.length) return []
  const c = redisConn()
  if (c) {
    const vals = c.kind === 'ioredis' ? await c.client.mget(...keys.map(k)) : await c.client.mget<(string | number | null)[]>(...keys.map(k))
    return vals.map(v => Number(v ?? 0))
  }
  return Promise.all(keys.map(counterGet))
}

export async function counterDel(key: string) {
  const c = redisConn()
  if (c) await c.client.del(k(key))
  else await withLock(key, () => store().removeItem(`counters:${key}`))
}
