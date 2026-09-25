export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  return chatView(await loadChat(rec.id, getRouterParam(event, 'id')!))
})
