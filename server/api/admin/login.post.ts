import { z } from 'zod'

const Body = z.object({ email: z.string().max(200), password: z.string().max(200), code: z.string().max(10) })

// دخول الأدمن: إيميل + كلمة مرور + كود 2FA، مع حد للمحاولات
export default defineEventHandler(async (event) => {
  if (!adminConfigured()) throw createError({ statusCode: 404 })
  const ip = clientIp(event)
  const window = 15 * 60
  if (await counterIncr(`admin-login:${ip}`, window) > 5 || await counterIncr('admin-login:all', window) > 30) {
    await logEvent('security', 'admin.login_blocked', 'محاولات دخول كثيرة للوحة الأدمن', { event })
    throw createError({ statusCode: 429, statusMessage: 'محاولات كثيرة. حاول بعد ١٥ دقيقة.' })
  }

  const { email, password, code } = await readValidatedBody(event, Body.parse)
  const c = useRuntimeConfig()
  const ok = safeEqual(email.trim().toLowerCase(), c.adminEmail.toLowerCase())
    && verifyPassword(password, c.adminPasswordHash)
    && verifyTotp(c.adminTotpSecret, code.trim())

  if (!ok) {
    await logEvent('security', 'admin.login_failed', 'محاولة دخول فاشلة للوحة الأدمن', { event, data: { email: email.slice(0, 60) } })
    throw createError({ statusCode: 401, statusMessage: 'بيانات الدخول غير صحيحة' })
  }
  await counterDel(`admin-login:${ip}`)
  const s = await adminSession(event)
  await s.update({ email: c.adminEmail, at: Date.now() })
  await logEvent('security', 'admin.login', 'دخول ناجح للوحة الأدمن', { event })
  return { ok: true }
})
