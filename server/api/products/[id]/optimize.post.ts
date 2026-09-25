// يولّد اسمًا ووصفًا وبيانات SEO محسنة لمنتج واحد (بدون تطبيق)
export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  await assertQuota(rec)
  const { tone = '', notes = '' } = (await readBody<{ tone?: string; notes?: string }>(event)) ?? {}
  const api = getSallaApi(rec)
  const product = await api.getProduct(getRouterParam(event, 'id')!)
  const reviews = (await api.listReviews({ perPage: 100 }).catch(() => []))
    .filter(r => r.productName === product.name)
    .map(r => `${r.rating}/5: ${r.content}`)
    .slice(0, 15)
  try {
    const copy = await optimizeProductCopy(product, rec.info.name, reviews, String(tone).slice(0, 100), String(notes).slice(0, 1000))
    await incrementUsage(rec.id)
    return { product, copy }
  } catch (e) {
    console.error('[optimize]', e)
    throw createError({ statusCode: 502, statusMessage: describeAiError(e) })
  }
})
