const PERIODS: Record<string, number> = { week: 7, month: 30, year: 365 }

export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const { period } = getQuery(event) as { period?: string }
  return buildOverview(getSallaApi(rec), PERIODS[period ?? 'month'] ?? 30)
})
