import type { H3Event } from 'h3'
import type { StoreRecord } from './db'

interface SessionData { storeId?: string }

const DEV_PASSWORD = 'rawaj-dev-session-password-change-me-please-32+'

function sessionConfig() {
  const { sessionPassword } = useRuntimeConfig()
  if (!sessionPassword && !import.meta.dev) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_SESSION_PASSWORD is not configured' })
  }
  return { name: 'rawaj', password: sessionPassword || DEV_PASSWORD, maxAge: 60 * 60 * 24 * 30 }
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
  return rec
}
