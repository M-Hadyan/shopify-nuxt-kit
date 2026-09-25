import type { MeResponse, SkillDef } from '#shared/types'
import type { StoreRecord } from './db'

// الباقة الفعلية للمتجر وحدها الشهري (التجربة = باقة نمو بـ ١٥ تشغيل)
export function resolvePlan(rec: StoreRecord) {
  if (rec.planStatus === 'trial') return { plan: getPlan(TRIAL_PLAN), limit: TRIAL_RUNS, status: 'trial' as const }
  const plan = getPlan(rec.plan)
  return { plan, limit: plan.runsPerMonth, status: rec.planStatus }
}

export async function meFor(rec: StoreRecord): Promise<MeResponse> {
  const { plan, limit, status } = resolvePlan(rec)
  return { store: rec.info, plan, status, usage: { month: monthKey(), runs: await getUsage(rec.id), limit }, demo: rec.demo }
}

// يتحقق من الاشتراك وصلاحية المهارة وحد الاستخدام
export async function assertCanRun(rec: StoreRecord, skill: SkillDef) {
  const { plan, limit, status } = resolvePlan(rec)
  if (status === 'expired' && !rec.demo) {
    throw createError({ statusCode: 402, statusMessage: 'انتهى اشتراكك. جدّده من متجر تطبيقات سلة.' })
  }
  if (!planAllows(plan, skill.category)) {
    throw createError({ statusCode: 403, statusMessage: `هذي المهارة متاحة من باقة «${planFor(skill.category).name}». رقّ باقتك من سلة.` })
  }
  const used = await getUsage(rec.id)
  if (used >= limit) {
    throw createError({ statusCode: 429, statusMessage: `وصلت لحد باقتك (${limit} تشغيل هذا الشهر). رقّ باقتك من سلة.` })
  }
  return plan
}
