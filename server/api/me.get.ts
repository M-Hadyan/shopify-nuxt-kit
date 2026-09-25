import type { MeResponse } from '#shared/types'

export default defineEventHandler(async (event): Promise<MeResponse> => {
  const rec = await requireStore(event)
  const plan = getPlan(rec.planStatus === 'expired' ? 'trial' : rec.plan)
  return {
    store: rec.info,
    plan,
    usage: { month: monthKey(), runs: await getUsage(rec.id), limit: plan.runsPerMonth },
    demo: rec.demo,
  }
})
