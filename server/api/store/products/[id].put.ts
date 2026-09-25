import { z } from 'zod'

const Body = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(20000).optional(),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(320).optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().nonnegative().nullable().optional(),
})

// تطبيق تعديل على منتج في سلة (كتابة)
export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const body = await readValidatedBody(event, Body.parse)
  if (body.description !== undefined) body.description = sanitizeDescription(body.description)
  return getSallaApi(rec).updateProduct(getRouterParam(event, 'id')!, body)
})
