import type { SallaTokens } from '../db'

export const SALLA_ACCOUNTS = 'https://accounts.salla.sa'
export const SALLA_API = 'https://api.salla.dev/admin/v2'

// صلاحيات القراءة اللي يحتاجها رواج (قراءة فقط)
export const SALLA_SCOPES = [
  'offline_access',
  'settings.read',
  'products.read',
  'orders.read',
  'customers.read',
  'marketing.read',
  'carts.read',
  'reviews.read',
].join(' ')

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope?: string
  token_type: string
}

function creds() {
  const c = useRuntimeConfig()
  if (!c.sallaClientId || !c.sallaClientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Salla OAuth غير مهيأ (NUXT_SALLA_CLIENT_ID / SECRET)' })
  }
  return c
}

export function sallaAuthorizeUrl(state: string) {
  const c = creds()
  const u = new URL(`${SALLA_ACCOUNTS}/oauth2/auth`)
  u.searchParams.set('client_id', c.sallaClientId)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('redirect_uri', c.sallaRedirectUri)
  u.searchParams.set('scope', SALLA_SCOPES)
  u.searchParams.set('state', state)
  return u.toString()
}

function toTokens(t: TokenResponse): SallaTokens {
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: Date.now() + t.expires_in * 1000,
    scope: t.scope,
  }
}

export async function exchangeCode(code: string) {
  const c = creds()
  const t = await $fetch<TokenResponse>(`${SALLA_ACCOUNTS}/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: c.sallaClientId,
      client_secret: c.sallaClientSecret,
      redirect_uri: c.sallaRedirectUri,
      scope: SALLA_SCOPES,
    }),
  })
  return toTokens(t)
}

// ملاحظة: refresh token في سلة يُستخدم مرة وحدة، لازم نحفظ الجديد فورًا
export async function refreshTokens(refreshToken: string) {
  const c = creds()
  const t = await $fetch<TokenResponse>(`${SALLA_ACCOUNTS}/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: c.sallaClientId,
      client_secret: c.sallaClientSecret,
    }),
  })
  return toTokens(t)
}

export interface SallaUserInfo {
  id: number
  name: string
  email: string
  merchant: { id: number; username: string; name: string; avatar?: string; domain?: string; plan?: string }
}

export async function fetchUserInfo(accessToken: string) {
  const res = await $fetch<{ data: SallaUserInfo }>(`${SALLA_ACCOUNTS}/oauth2/user/info`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.data
}
