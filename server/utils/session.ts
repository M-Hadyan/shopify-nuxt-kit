import type { H3Event } from 'h3'
import type { StoreRecord } from './db'

interface SessionData { storeId?: string }

const DEV_PASSWORD = 'rawaj-dev-session-password-change-me-please-32+'

function sessionConfig() {
  const { sessionPassword } = useRuntimeConfig()
  if ((!sessionPassword || sessionPassword.length < 32) && !import.meta.dev) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_SESSION_PASSWORD must be at least 32 characters' })
  }
  return {
    name: 'rawaj',
    password: sessionPassword || DEV_PASSWORD,
    maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, secure: !import.meta.dev, sameSite: 'lax' as const, path: '/' },
  }
}

export async function getRawajSession(event: H3Event) {
  return useSession<SessionData>(event, sessionConfig())
}

export async function loginStore(event: H3Event, storeId: string) {
  const s = await getRawajSession(event)
  await s.update({ storeId })
}

export async function logout(event: H3Event) {
  const s = await getRawajSession(event)
  await s.clear()
}

export async function requireStore(event: H3Event): Promise<StoreRecord> {
  const s = await getRawajSession(event)
  const id = s.data.storeId
  const rec = id ? await getStoreRecord(id) : null
  if (!rec || rec.uninstalledAt) {
    throw createError({ statusCode: 401, statusMessage: 'غير مسجل الدخول' })
  }
  event.context.storeId = rec.id
  if (rec.suspended) {
    throw createError({ statusCode: 403, statusMessage: 'حساب المتجر موقوف مؤقتًا. تواصل مع الدعم.' })
  }
  return rec
}
