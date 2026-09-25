export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const run = await getRun(rec.id, getRouterParam(event, 'id')!)
  if (!run) throw createError({ statusCode: 404, statusMessage: 'غير موجود' })
  return run
})
