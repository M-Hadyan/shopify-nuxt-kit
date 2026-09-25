import { createHash, createHmac, scryptSync, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

// ---------- كلمة المرور (scrypt) ----------
// الصيغة: scrypt$<salt base64>$<hash base64>
export function verifyPassword(password: string, stored: string) {
  const [alg, salt, hash] = stored.split('$')
  if (alg !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64')
  const actual = scryptSync(password, Buffer.from(salt, 'base64'), expected.length, { N: 16384, r: 8, p: 1 })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// ---------- 2FA (TOTP, RFC 6238) ----------
function base32Decode(s: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const clean = s.replace(/=+$/, '').replace(/\s/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch)
    if (idx < 0) throw new Error('bad base32')
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

export function totpAt(secret: string, counter: number) {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const h = createHmac('sha1', base32Decode(secret)).update(buf).digest()
  const off = h[h.length - 1]! & 0xf
  const code = ((h.readUInt32BE(off) & 0x7fffffff) % 1_000_000).toString()
  return code.padStart(6, '0')
}

export function verifyTotp(secret: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false
  const now = Math.floor(Date.now() / 30_000)
  return [-1, 0, 1].some(d => safeEqual(totpAt(secret, now + d), code))
}

// ---------- جلسة الأدمن (منفصلة عن جلسة التاجر) ----------
interface AdminSession { email?: string; at?: number }

function adminSessionConfig() {
  const c = useRuntimeConfig()
  if (!c.sessionPassword && !import.meta.dev) throw createError({ statusCode: 500, statusMessage: 'Session secret missing' })
  const password = createHash('sha256').update(`${c.sessionPassword || 'rawaj-dev'}:admin-session`).digest('hex')
  return {
    name: 'rawaj_admin',
    password,
    maxAge: 60 * 60 * 8, // ٨ ساعات
    cookie: { httpOnly: true, secure: !import.meta.dev, sameSite: 'strict' as const, path: '/' },
  }
}

export const adminSession = (event: H3Event) => useSession<AdminSession>(event, adminSessionConfig())

export function adminConfigured() {
  const c = useRuntimeConfig()
  return !!(c.adminEmail && c.adminPasswordHash && c.adminTotpSecret)
}

// يقبل جلسة الأدمن، أو هيدر x-admin-token (للسكربتات)
export async function requireAdmin(event: H3Event) {
  const { adminToken } = useRuntimeConfig()
  const header = getHeader(event, 'x-admin-token')
  if (header && adminToken && adminToken.length >= 24 && safeEqual(header, adminToken)) return 'token'
  if (adminConfigured()) {
    const s = await adminSession(event)
    if (s.data.email) return s.data.email
  }
  throw createError({ statusCode: 401, statusMessage: 'غير مصرح' })
}
