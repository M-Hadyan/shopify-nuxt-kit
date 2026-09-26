export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { q = '', filter = 'all' } = getQuery(event) as { q?: string; filter?: string }
  const month = monthKey()
  let stores = await listStoreRecords()
  if (filter === 'real') stores = stores.filter(s => !s.demo)
  if (filter === 'demo') stores = stores.filter(s => s.demo)
  const needle = q.trim().toLowerCase()
  if (needle) stores = stores.filter(s => `${s.id} ${s.info.name} ${s.info.domain}`.toLowerCase().includes(needle))
  const [usage, costs] = await Promise.all([
    counterGetMany(stores.map(s => `usage:${s.id}:${month}`)),
    counterGetMany(stores.map(s => storeCostKey(s.id, month))),
  ])
  return stores
    .map((s, i) => ({
      id: s.id,
      name: s.info.name,
      domain: s.info.domain,
      demo: s.demo,
      plan: s.plan,
      planStatus: s.planStatus,
      suspended: !!s.suspended,
      uninstalled: !!s.uninstalledAt,
      installedAt: s.installedAt,
      runsMonth: usage[i] ?? 0,
      costMonthSar: +((costs[i] ?? 0) / 1000).toFixed(2),
      connected: !!s.tokens,
    }))
    .sort((a, b) => b.installedAt.localeCompare(a.installedAt))
    .slice(0, 500)
})
