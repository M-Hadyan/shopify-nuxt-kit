import { z } from 'zod'

const Body = z.object({
  code: z.string().regex(/^[A-Za-z0-9]{3,20}$/),
  type: z.enum(['percentage', 'fixed']),
  amount: z.number().positive(),
  freeShipping: z.boolean().optional(),
  minimumAmount: z.number().nonnegative().optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  usageLimit: z.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const body = await readValidatedBody(event, Body.parse)
  return getSallaApi(rec).createCoupon({ ...body, code: body.code.toUpperCase() })
})
