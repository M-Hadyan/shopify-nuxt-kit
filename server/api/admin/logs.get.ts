import type { LogChannel } from '../../utils/logger'

// السجلات مع فلترة: القناة، المستوى، النوع، المتجر، والبحث النصي
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = getQuery(event) as Record<string, string | undefined>
  const channel: LogChannel = q.channel === 'requests' ? 'requests' : 'events'
  const limit = Math.min(500, Math.max(1, Number(q.limit) || 200))
  const offset = Math.max(0, Number(q.offset) || 0)
  let logs = await readLogs(channel, 20000)
  if (q.level) logs = logs.filter(l => l.level === q.level)
  if (q.type) logs = logs.filter(l => l.type.startsWith(q.type!))
  if (q.store) logs = logs.filter(l => l.storeId === q.store)
  if (q.q) {
    const needle = q.q.toLowerCase()
    logs = logs.filter(l => `${l.message} ${l.type} ${l.ip ?? ''} ${JSON.stringify(l.data ?? {})}`.toLowerCase().includes(needle))
  }
  const types = [...new Set(logs.slice(0, 5000).map(l => l.type.split('.')[0]))].sort()
  return { total: logs.length, items: logs.slice(offset, offset + limit), types }
})
