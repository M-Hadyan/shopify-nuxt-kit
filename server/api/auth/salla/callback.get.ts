// رجوع التاجر من سلة بعد الموافقة: نبدل الكود بتوكن، نجيب بيانات المتجر، ونسجل دخوله
export default defineEventHandler(async (event) => {
  const { code, state, error } = getQuery(event) as Record<string, string | undefined>
  if (error) return sendRedirect(event, `/?error=${encodeURIComponent(error)}`)
  const expected = getCookie(event, 'rawaj_oauth_state')
  deleteCookie(event, 'rawaj_oauth_state', { path: '/' })
  if (!code || !state || state !== expected) {
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
    plan: existing?.plan ?? 'trial',
    planStatus: existing?.planStatus ?? 'trial',
    planEndsAt: existing?.planEndsAt,
    installedAt: existing?.installedAt ?? new Date().toISOString(),
  })
  await loginStore(event, storeId)
  return sendRedirect(event, '/app')
})
