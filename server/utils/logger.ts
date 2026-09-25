import type { H3Event } from 'h3'

export type LogLevel = 'info' | 'warn' | 'error' | 'security'
export type LogChannel = 'events' | 'requests'

export interface LogEntry {
  id: string
  ts: string
  level: LogLevel
  type: string
  message: string
  storeId?: string
  ip?: string
  data?: Record<string, unknown>
}

const MAX = { events: 20000, requests: 20000 } as const
const FILE_MAX = 5000
const listKey = (ch: LogChannel) => `rawaj:logs:${ch}`

// قفل للكتابة في وضع الملفات
let fileLock: Promise<unknown> = Promise.resolve()

async function push(ch: LogChannel, entry: LogEntry) {
  const c = redisConn()
  const json = JSON.stringify(entry)
  if (c) {
    await c.client.lpush(listKey(ch), json)
    await c.client.ltrim(listKey(ch), 0, MAX[ch] - 1)
    return
  }
  fileLock = fileLock.then(async () => {
    const s = useStorage('data')
    const arr = (await s.getItem<LogEntry[]>(`logs:${ch}`)) ?? []
    arr.unshift(entry)
    await s.setItem(`logs:${ch}`, arr.slice(0, FILE_MAX))
  }).catch(() => {})
  await fileLock
}

export async function readLogs(ch: LogChannel, limit = 2000): Promise<LogEntry[]> {
  const c = redisConn()
  if (c) {
    const raw = await c.client.lrange(listKey(ch), 0, limit - 1) as (string | LogEntry)[]
    return raw.map(r => (typeof r === 'string' ? JSON.parse(r) : r))
  }
  return ((await useStorage('data').getItem<LogEntry[]>(`logs:${ch}`)) ?? []).slice(0, limit)
}

// يحذف أي أسرار محتملة قبل الحفظ
const SECRET_KEYS = /token|secret|password|authorization|cookie|code/i
function scrub(data?: Record<string, unknown>) {
  if (!data) return undefined
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(data)) out[key] = SECRET_KEYS.test(key) ? '[redacted]' : v
  return out
}

export async function logEvent(level: LogLevel, type: string, message: string, extra: { storeId?: string; ip?: string; event?: H3Event; data?: Record<string, unknown> } = {}) {
  const entry: LogEntry = {
    id: newId('log_'),
    ts: new Date().toISOString(),
    level,
    type,
    message,
    storeId: extra.storeId ?? (extra.event?.context.storeId as string | undefined),
    ip: extra.ip ?? (extra.event ? clientIp(extra.event) : undefined),
    data: scrub(extra.data),
  }
  // يطلع في سجلات Coolify كمان
  const line = JSON.stringify({ rawaj: true, ...entry })
  if (level === 'error') console.error(line)
  else if (level === 'warn' || level === 'security') console.warn(line)
  else console.info(line)

  await push('events', entry).catch(e => console.error('[rawaj] log write failed', e))
  if (level === 'error') await metric('errors')
  if (level === 'security') await metric('security')
  if (level === 'error' || level === 'security') await maybeAlert(entry)
}

export async function logRequest(entry: Omit<LogEntry, 'id' | 'ts' | 'level'> & { level?: LogLevel }) {
  await push('requests', { id: newId('req_'), ts: new Date().toISOString(), level: entry.level ?? 'info', ...entry }).catch(() => {})
}

// تنبيه خارجي (Slack / Discord / Telegram) — مرة وحدة كل ٥ دقايق لكل نوع
async function maybeAlert(entry: LogEntry) {
  const url = useRuntimeConfig().alertWebhookUrl
  if (!url) return
  try {
    if (await counterIncr(`alert:${entry.type}`, 300) > 1) return
    const text = `🚨 رواج [${entry.level}] ${entry.type}: ${entry.message}${entry.storeId ? ` (متجر ${entry.storeId})` : ''}`
    const body = /api\.telegram\.org/.test(url)
      ? { text }
      : { text, content: text } // Slack يقرأ text و Discord يقرأ content
    await $fetch(url, { method: 'POST', body, timeout: 5000 })
  } catch (e) {
    console.error('[rawaj] alert failed', e)
  }
}
