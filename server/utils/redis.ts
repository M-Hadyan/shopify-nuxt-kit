import { Redis as Upstash } from '@upstash/redis'
import IORedis from 'ioredis'

// اتصال Redis مشترك: REDIS_URL (Coolify) أو Upstash (Vercel). null = بدون Redis.
export type RedisConn =
  | { kind: 'ioredis'; client: IORedis }
  | { kind: 'upstash'; client: Upstash }

let conn: RedisConn | null | undefined

export function redisConn(): RedisConn | null {
  if (conn === undefined) {
    const redisUrl = process.env.REDIS_URL
    const upUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const upToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    conn = redisUrl
      ? { kind: 'ioredis', client: new IORedis(redisUrl, { maxRetriesPerRequest: 3 }) }
      : upUrl && upToken
        ? { kind: 'upstash', client: new Upstash({ url: upUrl, token: upToken }) }
        : null
  }
  return conn
}

export function storageKind() {
  const c = redisConn()
  return c ? (c.kind === 'ioredis' ? 'Redis' : 'Upstash') : 'Files'
}
