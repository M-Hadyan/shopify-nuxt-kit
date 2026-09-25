// رجوع التاجر من سلة بعد الموافقة: نبدل الكود بتوكن، نجيب بيانات المتجر، ونسجل دخوله
export default defineEventHandler(async (event) => {
  const { code, state, error } = getQuery(event) as Record<string, string | undefined>
  if (error) return sendRedirect(event, `/?error=${encodeURIComponent(error)}`)
  const expected = getCookie(event, 'rawaj_oauth_state')
  deleteCookie(event, 'rawaj_oauth_state', { path: '/' })
  // الدخول من زر "دخول التجار" يرسل state ونتحقق منه.
  // التثبيت من متجر تطبيقات سلة يرجّع التاجر هنا بدون state منّا.
  if (!code || (state && state !== expected)) {
    await logEvent('security', 'auth.bad_state', 'رجوع OAuth بـ state غير صحيح', { event })
    throw createError({ statusCode: 400, statusMessage: 'طلب تسجيل دخول غير صالح' })
  }

  const tokens = await exchangeCode(code)
  const user = await fetchUserInfo(tokens.accessToken)
  const storeId = String(user.merchant.id)
  const existing = await getStoreRecord(storeId)

  await saveStoreRecord({
    id: storeId,
    info: {
      id: storeId,
      name: user.merchant.name,
      domain: user.merchant.domain ?? `${user.merchant.username}.salla.sa`,
      avatar: user.merchant.avatar,
      currency: existing?.info.currency ?? 'SAR',
      sallaPlan: user.merchant.plan,
    },
    demo: false,
    tokens,
    plan: existing?.plan ?? TRIAL_PLAN,
    planStatus: existing?.planStatus ?? 'trial',
    planEndsAt: existing?.planEndsAt,
    installedAt: existing?.installedAt ?? new Date().toISOString(),
  })
  await loginStore(event, storeId)
  await logEvent('info', existing ? 'auth.login' : 'auth.install', existing ? `دخول التاجر ${user.merchant.name}` : `تثبيت جديد: ${user.merchant.name}`, { event, storeId })
  if (!existing) await metric('installs')
  return sendRedirect(event, '/app')
})
