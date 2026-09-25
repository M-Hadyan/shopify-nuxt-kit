import type { SkillDef } from '#shared/types'

// ألوان البطاقات
export const TONES: Record<SkillDef['tone'], { tile: string; glow: string }> = {
  violet: { tile: 'bg-violet-100 text-violet-700', glow: 'bg-violet-400/20' },
  teal: { tile: 'bg-teal-100 text-teal-700', glow: 'bg-teal-400/20' },
  amber: { tile: 'bg-amber-100 text-amber-700', glow: 'bg-amber-400/20' },
  rose: { tile: 'bg-rose-100 text-rose-700', glow: 'bg-rose-400/20' },
  sky: { tile: 'bg-sky-100 text-sky-700', glow: 'bg-sky-400/20' },
  emerald: { tile: 'bg-emerald-100 text-emerald-700', glow: 'bg-emerald-400/20' },
  indigo: { tile: 'bg-indigo-100 text-indigo-700', glow: 'bg-indigo-400/20' },
  orange: { tile: 'bg-orange-100 text-orange-700', glow: 'bg-orange-400/20' },
}

export const sar = (n: number) => `${new Intl.NumberFormat('ar-SA').format(Math.round(n))} ر.س`
export const num = (n: number) => new Intl.NumberFormat('ar-SA').format(n)
export const fmtDate = (s: string) => new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s))
export const errMsg = (e: unknown) =>
  (e as { data?: { statusMessage?: string }; statusMessage?: string })?.data?.statusMessage
  ?? (e as { statusMessage?: string })?.statusMessage
  ?? 'حدث خطأ غير متوقع'
