import type { RunRecord } from '#shared/types'

// تقرير داخلي لتكلفة التشغيلات الفعلية (لصاحب المنصة فقط)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const month = (getQuery(event).month as string) || monthKey()
  const storage = useStorage('data')
  const keys = await storage.getKeys('runs')
  const runs = (await Promise.all(keys.map(k => storage.getItem<RunRecord>(k))))
    .filter((r): r is RunRecord => !!r && r.createdAt.startsWith(month) && r.costSar != null)

  const group = (key: (r: RunRecord) => string) => {
    const m = new Map<string, { runs: number; costSar: number }>()
    for (const r of runs) {
      const g = m.get(key(r)) ?? { runs: 0, costSar: 0 }
      g.runs++
      g.costSar += r.costSar!
      m.set(key(r), g)
    }
    return [...m].map(([k, v]) => ({ key: k, runs: v.runs, totalSar: +v.costSar.toFixed(2), avgSar: +(v.costSar / v.runs).toFixed(3) }))
      .sort((a, b) => b.totalSar - a.totalSar)
  }

  const total = runs.reduce((a, r) => a + r.costSar!, 0)
  return {
    month,
    runs: runs.length,
    totalSar: +total.toFixed(2),
    avgPerRunSar: runs.length ? +(total / runs.length).toFixed(3) : 0,
    byModel: group(r => r.model ?? '?'),
    bySkill: group(r => r.skill),
    byStore: group(r => r.storeId),
  }
})
