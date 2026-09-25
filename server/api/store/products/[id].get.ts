export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  return getSallaApi(rec).getProduct(getRouterParam(event, 'id')!)
})
