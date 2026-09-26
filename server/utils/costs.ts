// أسعار Claude API (دولار لكل مليون توكن) — تُحدّث عند تغيّر الأسعار
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-opus-5': { input: 5, output: 25 },
  'claude-sonnet-5': { input: 2, output: 10 },
}
const USD_TO_SAR = 3.75

export interface UsageLike {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

// تكلفة تشغيل واحد بالريال (الكتابة في الكاش ١٫٢٥×، القراءة منه ٠٫١×)
export function runCostSar(model: string, u: UsageLike) {
  const p = PRICES[model]
  if (!p) return null
  const input = u.input_tokens + (u.cache_creation_input_tokens ?? 0) * 1.25 + (u.cache_read_input_tokens ?? 0) * 0.1
  const usd = (input * p.input + u.output_tokens * p.output) / 1_000_000
  return Math.round(usd * USD_TO_SAR * 1000) / 1000
}
