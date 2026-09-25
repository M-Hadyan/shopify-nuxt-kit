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
  tokens?: SallaTokens
  plan: PlanId
  planStatus: 'active' | 'trial' | 'expired'
  planEndsAt?: string
  installedAt: string
  uninstalledAt?: string
}

const db = () => useStorage('data')

export const monthKey = (d = new Date()) => d.toISOString().slice(0, 7)

export async function getStoreRecord(id: string) {
  return db().getItem<StoreRecord>(`stores:${id}`)
}

export async function saveStoreRecord(rec: StoreRecord) {
  await db().setItem(`stores:${rec.id}`, rec)
  return rec
}

export async function updateStoreRecord(id: string, patch: Partial<StoreRecord>) {
  const cur = await getStoreRecord(id)
  if (!cur) return null
  return saveStoreRecord({ ...cur, ...patch })
}

export async function getUsage(storeId: string, month = monthKey()) {
  return (await db().getItem<number>(`usage:${storeId}:${month}`)) ?? 0
}

export async function incrementUsage(storeId: string) {
  const key = `usage:${storeId}:${monthKey()}`
  const n = ((await db().getItem<number>(key)) ?? 0) + 1
  await db().setItem(key, n)
  return n
}

export async function saveRun(run: RunRecord) {
  await db().setItem(`runs:${run.storeId}:${run.id}`, run)
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

export async function setJson<T>(key: string, value: T) {
  await db().setItem(key, value as never)
}

export function newId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
