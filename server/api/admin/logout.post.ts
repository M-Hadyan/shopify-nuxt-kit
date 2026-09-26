export default defineEventHandler(async (event) => {
  const s = await adminSession(event)
  await s.clear()
  return { ok: true }
})
