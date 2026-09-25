// دخول بمتجر تجريبي (بيانات وهمية) — لعرض المنصة قبل ربط سلة
export default defineEventHandler(async (event) => {
  if (!useRuntimeConfig().demoMode) throw createError({ statusCode: 403, statusMessage: 'وضع التجربة غير مفعل' })
  const s = await getRawajSession(event)
  let id = s.data.storeId
  const existing = id ? await getStoreRecord(id) : null
  if (!existing?.demo) {
    // حد إنشاء المتاجر التجريبية لكل IP يوميًا (منع الإساءة)
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
    const day = new Date().toISOString().slice(0, 10)
    if (await counterIncr(`demo-ip:${ip}:${day}`, 86400) > 3) {
      throw createError({ statusCode: 429, statusMessage: 'جربت المتجر التجريبي كثير اليوم. حاول بكرة أو ثبّت رواج على متجرك.' })
    }
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
