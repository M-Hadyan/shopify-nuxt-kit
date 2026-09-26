// سجل كل طلبات الـ API وكل أخطاء السيرفر
const SKIP = [/^\/api\/health$/, /^\/api\/admin\/(logs|overview|me)/]

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.startedAt = Date.now()
  })

  nitroApp.hooks.hook('afterResponse', async (event) => {
    const path = event.path.split('?')[0] ?? ''
    if (!path.startsWith('/api/') || SKIP.some(r => r.test(path))) return
    const status = getResponseStatus(event)
    const ms = Date.now() - ((event.context.startedAt as number) ?? Date.now())
    await metric('requests')
    await logRequest({
      level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
      type: `${event.method} ${status}`,
      message: path,
      storeId: event.context.storeId as string | undefined,
      ip: clientIp(event),
      data: { method: event.method, status, ms },
    })
  })

  nitroApp.hooks.hook('error', async (error, { event }) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500
    if (status < 500) return
    await logEvent('error', 'server.error', error.message || 'Unhandled error', {
      event,
      data: { path: event?.path, status, stack: error.stack?.split('\n').slice(0, 6).join('\n') },
    })
  })
})
