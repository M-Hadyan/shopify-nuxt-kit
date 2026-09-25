import type { StoreRecord } from './db'

// يتحقق من حد الاستخدام الشهري حسب باقة سلة
export async function assertQuota(rec: StoreRecord) {
  if (rec.planStatus === 'expired' && !rec.demo) {
    throw createError({ statusCode: 402, statusMessage: 'انتهى اشتراكك. جدّده من متجر تطبيقات سلة.' })
  }
  const plan = getPlan(rec.planStatus === 'expired' ? 'trial' : rec.plan)
  const used = await getUsage(rec.id)
  if (used >= plan.runsPerMonth) {
    throw createError({ statusCode: 429, statusMessage: `وصلت لحد باقتك (${plan.runsPerMonth} تشغيل شهريًا). رقّ باقتك من سلة.` })
  }
}
