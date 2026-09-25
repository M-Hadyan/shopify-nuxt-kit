import type { MeResponse, SkillDef } from '#shared/types'
import type { StoreRecord } from './db'

const DEMO_RUNS = 5 // تشغيلات لكل متجر تجريبي
const MAX_CONCURRENT = 2 // تشغيلات متزامنة لكل متجر

// الباقة الفعلية للمتجر وحدها الشهري (التجربة = باقة نمو بـ ١٥ تشغيل)
export function resolvePlan(rec: StoreRecord) {
  if (rec.demo) return { plan: getPlan(rec.plan), limit: DEMO_RUNS, status: 'active' as const }
  if (rec.planStatus === 'trial') return { plan: getPlan(TRIAL_PLAN), limit: TRIAL_RUNS, status: 'trial' as const }
  const plan = getPlan(rec.plan)
  return { plan, limit: plan.runsPerMonth, status: rec.planStatus }
}

export async function meFor(rec: StoreRecord): Promise<MeResponse> {
  const { plan, limit, status } = resolvePlan(rec)
  return { store: rec.info, plan, status, usage: { month: monthKey(), runs: await getUsage(rec.id), limit }, demo: rec.demo }
}

// يتحقق من الاشتراك وصلاحية المهارة، ثم يحجز تشغيل بشكل ذرّي.
// يرجع دالة release لازم تنادى بعد انتهاء التشغيل (مع refund لو فشل).
export async function reserveRun(rec: StoreRecord, skill: SkillDef) {
  const { plan, limit, status } = resolvePlan(rec)
  if (status === 'expired') {
    throw createError({ statusCode: 402, statusMessage: 'انتهى اشتراكك. جدّده من متجر تطبيقات سلة.' })
  }
  if (!planAllows(plan, skill.category)) {
    throw createError({ statusCode: 403, statusMessage: `هذي المهارة متاحة من باقة «${planFor(skill.category).name}». رقّ باقتك من سلة.` })
  }

  // سقف يومي لكل تشغيلات المتاجر التجريبية مجتمعة (حماية ميزانية الذكاء الاصطناعي)
  if (rec.demo) {
    const day = new Date().toISOString().slice(0, 10)
    const n = await counterIncr(`demo-runs:${day}`, 86400)
    if (n > Number(useRuntimeConfig().demoDailyRuns)) {
      await counterDecr(`demo-runs:${day}`)
      throw createError({ statusCode: 429, statusMessage: 'وصل المتجر التجريبي لحده اليوم. ثبّت رواج على متجرك وجرّبه مجانًا.' })
    }
  }

  const running = `running:${rec.id}`
  if (await counterIncr(running, 600) > MAX_CONCURRENT) {
    await counterDecr(running)
    throw createError({ statusCode: 429, statusMessage: 'عندك تشغيلات شغالة الحين. انتظر لين تخلص.' })
  }

  const used = await incrementUsage(rec.id)
  if (used > limit) {
    await decrementUsage(rec.id)
    await counterDecr(running)
    throw createError({ statusCode: 429, statusMessage: `وصلت لحد باقتك (${limit} تشغيل هذا الشهر). رقّ باقتك من سلة.` })
  }

  let released = false
  return {
    plan,
    async release(success: boolean) {
      if (released) return
      released = true
      await counterDecr(running)
      if (!success) await decrementUsage(rec.id) // التشغيل الفاشل ما ينحسب
    },
  }
}
