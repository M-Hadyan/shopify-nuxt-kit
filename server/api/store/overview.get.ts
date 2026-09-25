export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  return buildOverview(getSallaApi(rec))
})
