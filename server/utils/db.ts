import { randomBytes } from 'node:crypto'
import type { PlanId, RunRecord, StoreInfo } from '#shared/types'

export interface SallaTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number // unix ms
  scope?: string
}

export interface StoreRecord {
  id: string
  info: StoreInfo
  demo: boolean
  tokens?: SallaTokens // في الذاكرة فقط؛ في القاعدة تُحفظ مشفرة في tokensEnc
  plan: PlanId
  planStatus: 'active' | 'trial' | 'expired'
  planEndsAt?: string
  installedAt: string
  uninstalledAt?: string
}

const db = () => useStorage('data')

export const monthKey = (d = new Date()) => d.toISOString().slice(0, 7)

// بيانات المتاجر التجريبية تنحذف تلقائيًا بعد ٧ أيام
export const DEMO_TTL = 7 * 24 * 3600
const ttlFor = (demo: boolean) => (demo ? { ttl: DEMO_TTL } : undefined)

type StoredRecord = Omit<StoreRecord, 'tokens'> & { tokensEnc?: string }

export async function getStoreRecord(id: string): Promise<StoreRecord | null> {
  const raw = await db().getItem<StoredRecord>(`stores:${id}`)
  if (!raw) return null
  const { tokensEnc, ...rest } = raw
  return { ...rest, tokens: tokensEnc ? JSON.parse(decryptSecret(tokensEnc)) : undefined }
}

export async function saveStoreRecord(rec: StoreRecord) {
  const { tokens, ...rest } = rec
  const stored: StoredRecord = { ...rest, tokensEnc: tokens ? encryptSecret(JSON.stringify(tokens)) : undefined }
  await db().setItem(`stores:${rec.id}`, stored, ttlFor(rec.demo))
  return rec
}

export async function updateStoreRecord(id: string, patch: Partial<StoreRecord>) {
  const cur = await getStoreRecord(id)
  if (!cur) return null
  return saveStoreRecord({ ...cur, ...patch })
}

// عدّاد الاستخدام الشهري (ذرّي، ينتهي بعد ٤٠ يوم)
const usageKey = (storeId: string, month = monthKey()) => `usage:${storeId}:${month}`

export async function getUsage(storeId: string, month = monthKey()) {
  return counterGet(usageKey(storeId, month))
}

export async function incrementUsage(storeId: string) {
  return counterIncr(usageKey(storeId), 40 * 24 * 3600)
}

export async function decrementUsage(storeId: string) {
  return counterDecr(usageKey(storeId))
}

export async function saveRun(run: RunRecord, demo = false) {
  await db().setItem(`runs:${run.storeId}:${run.id}`, run, ttlFor(demo))
}

// حذف بيانات المتجر عند إلغاء التثبيت (حماية البيانات)
export async function deleteStoreData(storeId: string) {
  const keys = [...await db().getKeys(`runs:${storeId}`), ...await db().getKeys(`demo:${storeId}`)]
  await Promise.all(keys.map(key => db().removeItem(key)))
  await counterDel(usageKey(storeId))
}

export async function getRun(storeId: string, id: string) {
  return db().getItem<RunRecord>(`runs:${storeId}:${id}`)
}

export async function listRuns(storeId: string, limit = 50) {
  const keys = await db().getKeys(`runs:${storeId}`)
  const runs = (await Promise.all(keys.map(k => db().getItem<RunRecord>(k)))).filter(Boolean) as RunRecord[]
  return runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
}

export async function getJson<T>(key: string) {
  return db().getItem<T>(key)
}

export async function setJson<T>(key: string, value: T, opts?: { ttl?: number }) {
  await db().setItem(key, value as never, opts)
}

export function newId(prefix = '') {
  return prefix + Date.now().toString(36) + randomBytes(6).toString('hex')
}
