// مقاييس بالساعة للمراقبة (تنحفظ ٨ أيام)
const TTL = 8 * 24 * 3600
export const hourKey = (d = new Date()) => d.toISOString().slice(0, 13) // 2026-09-25T21

export type MetricName = 'runs' | 'run_errors' | 'cost_milli' | 'tokens_out' | 'rate_limited' | 'errors' | 'requests' | 'security' | 'demo_created' | 'installs'

export function metric(name: MetricName, by = 1) {
  return counterIncrBy(`m:${name}:${hourKey()}`, by, TTL).catch(() => 0)
}

// سلسلة آخر N ساعة (الأقدم أولًا)
export async function metricSeries(name: MetricName, hours = 24) {
  const now = Date.now()
  const keys = Array.from({ length: hours }, (_, i) => hourKey(new Date(now - (hours - 1 - i) * 3600_000)))
  const vals = await counterGetMany(keys.map(h => `m:${name}:${h}`))
  return keys.map((h, i) => ({ hour: h, value: vals[i] ?? 0 }))
}

export async function metricSum(name: MetricName, hours = 24) {
  return (await metricSeries(name, hours)).reduce((a, b) => a + b.value, 0)
}
