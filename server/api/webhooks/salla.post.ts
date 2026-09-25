import { createHmac, timingSafeEqual } from 'node:crypto'

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SallaWebhook { event: string; merchant: number | string; created_at?: string; data: any }

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

// ويبهوكات تطبيق سلة: التثبيت، التوكن (Easy Mode)، الاشتراكات والفوترة، الإلغاء
export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig().sallaWebhookSecret
  const raw = (await readRawBody(event, 'utf8')) ?? ''
  if (!secret) throw createError({ statusCode: 500, statusMessage: 'NUXT_SALLA_WEBHOOK_SECRET is not configured' })

  const strategy = (getHeader(event, 'x-salla-security-strategy') ?? 'Signature').toLowerCase()
  const ok = strategy === 'token'
    ? safeEqual((getHeader(event, 'authorization') ?? '').replace(/^Bearer\s+/i, ''), secret)
    : safeEqual(getHeader(event, 'x-salla-signature') ?? '', createHmac('sha256', secret).update(raw).digest('hex'))
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })

  const hook = JSON.parse(raw) as SallaWebhook
  const storeId = String(hook.merchant)
  const d = hook.data ?? {}
  const now = new Date().toISOString()

  switch (hook.event) {
    case 'app.store.authorize': {
      const existing = await getStoreRecord(storeId)
      const tokens = {
        accessToken: d.access_token,
        refreshToken: d.refresh_token,
        expiresAt: Number(d.expires) * 1000,
        scope: d.scope,
      }
      await saveStoreRecord({
        id: storeId,
        info: existing?.info ?? { id: storeId, name: `متجر ${storeId}`, domain: '', currency: 'SAR' },
        demo: false,
        tokens,
        plan: existing?.plan ?? TRIAL_PLAN,
        planStatus: existing?.planStatus ?? 'trial',
        planEndsAt: existing?.planEndsAt,
        installedAt: existing?.installedAt ?? now,
      })
      // نحدّث بيانات المتجر من سلة
      const rec = await getStoreRecord(storeId)
      if (rec) {
        const info = await getSallaApi(rec).getStoreInfo().catch(() => null)
        if (info) await updateStoreRecord(storeId, { info })
      }
      break
    }
    case 'app.installed':
      await updateStoreRecord(storeId, { uninstalledAt: undefined })
      break
    case 'app.uninstalled':
      await updateStoreRecord(storeId, { uninstalledAt: now, tokens: undefined })
      break
    case 'app.trial.started':
      await updateStoreRecord(storeId, { plan: TRIAL_PLAN, planStatus: 'trial', planEndsAt: d.end_date })
      break
    case 'app.trial.expired':
    case 'app.subscription.expired':
    case 'app.subscription.canceled':
      await updateStoreRecord(storeId, { planStatus: 'expired' })
      break
    case 'app.subscription.started':
    case 'app.subscription.renewed':
      await updateStoreRecord(storeId, {
        plan: planFromSallaName(d.plan_name ?? d.plan?.name),
        planStatus: 'active',
        planEndsAt: d.end_date,
      })
      break
    default:
      // أحداث أخرى (طلبات، منتجات...) ممكن نستخدمها لاحقًا لتحديث التحليلات لحظيًا
      break
  }
  return { ok: true }
})
