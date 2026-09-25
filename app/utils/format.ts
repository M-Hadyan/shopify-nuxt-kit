import type { SkillDef } from '#shared/types'

// ألوان البطاقات
export const TONES: Record<SkillDef['tone'], { tile: string; glow: string }> = {
  violet: { tile: 'bg-violet-500/15 text-violet-300', glow: 'bg-violet-400/10' },
  teal: { tile: 'bg-teal-500/15 text-teal-300', glow: 'bg-teal-400/10' },
  amber: { tile: 'bg-amber-500/15 text-amber-300', glow: 'bg-amber-400/10' },
  rose: { tile: 'bg-rose-500/15 text-rose-300', glow: 'bg-rose-400/10' },
  sky: { tile: 'bg-sky-500/15 text-sky-300', glow: 'bg-sky-400/10' },
  emerald: { tile: 'bg-emerald-500/15 text-emerald-300', glow: 'bg-emerald-400/10' },
  indigo: { tile: 'bg-indigo-500/15 text-indigo-300', glow: 'bg-indigo-400/10' },
  orange: { tile: 'bg-orange-500/15 text-orange-300', glow: 'bg-orange-400/10' },
}

export const sar = (n: number) => `${new Intl.NumberFormat('ar-SA').format(Math.round(n))} ر.س`
export const num = (n: number) => new Intl.NumberFormat('ar-SA').format(n)
export const fmtDate = (s: string) => new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s))
export const errMsg = (e: unknown) =>
  (e as { data?: { statusMessage?: string }; statusMessage?: string })?.data?.statusMessage
  ?? (e as { statusMessage?: string })?.statusMessage
  ?? 'حدث خطأ غير متوقع'
