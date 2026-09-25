export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  return getSallaApi(rec).listCoupons({ perPage: 50 })
})
