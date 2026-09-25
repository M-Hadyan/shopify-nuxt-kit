// نظرة عامة ومراقبة: صحة النظام + مقاييس + المتاجر + الإيراد مقابل التكلفة
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const c = useRuntimeConfig()
  const month = monthKey()

  // صحة النظام
  const t0 = Date.now()
  let storageOk = true
  try { await useStorage('data').hasItem('health') } catch { storageOk = false }
  const storageMs = Date.now() - t0
  const mem = process.memoryUsage()

  // المتاجر
  const stores = await listStoreRecords()
  const real = stores.filter(s => !s.demo)
  const active = real.filter(s => !s.uninstalledAt)
  const byStatus = { active: 0, trial: 0, expired: 0, uninstalled: 0, suspended: 0 }
  const byPlan: Record<string, number> = { starter: 0, growth: 0, pro: 0 }
  let mrr = 0
  for (const s of real) {
    if (s.uninstalledAt) { byStatus.uninstalled++; continue }
    if (s.suspended) byStatus.suspended++
    byStatus[s.planStatus]++
    if (s.planStatus === 'active') {
      byPlan[s.plan] = (byPlan[s.plan] ?? 0) + 1
      mrr += getPlan(s.plan).price
    }
  }

  const [runs24, err24, cost24, limited24, sec24, req24, runErr24] = await Promise.all([
    metricSum('runs'), metricSum('errors'), metricSum('cost_milli'), metricSum('rate_limited'),
    metricSum('security'), metricSum('requests'), metricSum('run_errors'),
  ])
  const monthCostMilli = (await counterGetMany(active.map(s => storeCostKey(s.id, month)))).reduce((a, b) => a + b, 0)
  const demoCostMilli = await counterGet(`cost:demo:${month}`)

  const skillKeys = SKILLS.map(s => s.slug)
  const [skillRuns, skillCost] = await Promise.all([
    counterGetMany(skillKeys.map(s => skillRunsKey(s, month))),
    counterGetMany(skillKeys.map(s => skillCostKey(s, month))),
  ])
  const topSkills = skillKeys
    .map((slug, i) => ({ slug, title: getSkill(slug)!.title, runs: skillRuns[i]!, costSar: +(skillCost[i]! / 1000).toFixed(2) }))
    .filter(s => s.runs > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10)

  const recentProblems = (await readLogs('events', 500)).filter(l => l.level === 'error' || l.level === 'security').slice(0, 8)

  return {
    health: {
      storage: { ok: storageOk, kind: storageKind(), ms: storageMs },
      anthropic: !!c.anthropicApiKey || !!process.env.ANTHROPIC_API_KEY,
      salla: !!(c.sallaClientId && c.sallaClientSecret && c.sallaWebhookSecret),
      alerts: !!c.alertWebhookUrl,
      demoMode: !!c.demoMode,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: Math.round(mem.rss / 1024 / 1024),
      heapMb: Math.round(mem.heapUsed / 1024 / 1024),
      node: process.version,
      commit: process.env.SOURCE_COMMIT?.slice(0, 7) || null,
    },
    stores: { total: real.length, active: active.length, byStatus, byPlan, demo: stores.length - real.length },
    money: {
      mrrSar: mrr,
      monthAiCostSar: +(monthCostMilli / 1000).toFixed(2),
      monthDemoCostSar: +(demoCostMilli / 1000).toFixed(2),
      marginPct: mrr ? Math.round(((mrr - monthCostMilli / 1000) / mrr) * 100) : null,
    },
    last24h: {
      runs: runs24, runErrors: runErr24, errors: err24, costSar: +(cost24 / 1000).toFixed(2),
      rateLimited: limited24, security: sec24, requests: req24,
    },
    series: {
      runs: await metricSeries('runs'),
      errors: await metricSeries('errors'),
      cost: (await metricSeries('cost_milli')).map(p => ({ ...p, value: +(p.value / 1000).toFixed(2) })),
      requests: await metricSeries('requests'),
    },
    topSkills,
    recentProblems,
  }
})
