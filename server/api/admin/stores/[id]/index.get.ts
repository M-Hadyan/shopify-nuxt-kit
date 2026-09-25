export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const rec = await getStoreRecord(id)
  if (!rec) throw createError({ statusCode: 404, statusMessage: 'المتجر غير موجود' })
  const { tokens, ...safe } = rec
  const limits = await resolveLimits(rec)
  const runs = (await listRuns(id, 50)).map(({ output, ...r }) => ({ ...r, outputChars: output.length }))
  const logs = (await readLogs('events', 3000)).filter(l => l.storeId === id).slice(0, 100)
  return {
    store: { ...safe, connected: !!tokens, tokenExpiresAt: tokens ? new Date(tokens.expiresAt).toISOString() : null },
    usage: { runs: await getUsage(id), limit: limits.limit, bonus: await getBonus(id), costSar: +((await counterGet(storeCostKey(id))) / 1000).toFixed(2) },
    runs,
    logs,
  }
})
