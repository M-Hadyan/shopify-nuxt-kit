import { z } from 'zod'

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('suspend'), reason: z.string().max(300).optional() }),
  z.object({ action: z.literal('unsuspend') }),
  z.object({ action: z.literal('set_plan'), plan: z.enum(['starter', 'growth', 'pro']), status: z.enum(['active', 'trial', 'expired']) }),
  z.object({ action: z.literal('add_runs'), runs: z.number().int().min(1).max(10000) }),
])

// إجراءات الأدمن على متجر — كلها تنسجل في السجل
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const rec = await getStoreRecord(id)
  if (!rec) throw createError({ statusCode: 404, statusMessage: 'المتجر غير موجود' })
  const body = await readValidatedBody(event, Body.parse)

  switch (body.action) {
    case 'suspend':
      await updateStoreRecord(id, { suspended: true, suspendedReason: body.reason })
      break
    case 'unsuspend':
      await updateStoreRecord(id, { suspended: false, suspendedReason: undefined })
      break
    case 'set_plan':
      await updateStoreRecord(id, { plan: body.plan, planStatus: body.status })
      break
    case 'add_runs':
      await addBonus(id, body.runs)
      break
  }
  await logEvent('info', `admin.${body.action}`, `إجراء أدمن على المتجر ${rec.info.name}`, { event, storeId: id, data: { ...body, by: admin } })
  return { ok: true }
})
