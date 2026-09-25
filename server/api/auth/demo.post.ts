// دخول بمتجر تجريبي (بيانات وهمية) — لعرض المنصة قبل ربط سلة
export default defineEventHandler(async (event) => {
  if (!useRuntimeConfig().demoMode) throw createError({ statusCode: 403, statusMessage: 'وضع التجربة غير مفعل' })
  const s = await getRawajSession(event)
  let id = s.data.storeId
  const existing = id ? await getStoreRecord(id) : null
  if (!existing?.demo) {
    id = newId('demo_')
    await saveStoreRecord({
      id,
      info: { ...DEMO_STORE, id },
      demo: true,
      plan: 'pro',
      planStatus: 'active',
      installedAt: new Date().toISOString(),
    })
  }
  await loginStore(event, id!)
  return { ok: true }
})
