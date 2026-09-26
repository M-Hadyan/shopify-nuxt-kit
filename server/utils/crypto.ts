import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto'

// تشفير توكنات سلة في قاعدة البيانات (AES-256-GCM)
function key() {
  const c = useRuntimeConfig()
  const secret = c.tokenEncryptionKey || c.sessionPassword
  if (!secret) {
    if (import.meta.dev) return createHash('sha256').update('rawaj-dev-only-key').digest()
    throw createError({ statusCode: 500, statusMessage: 'NUXT_TOKEN_ENCRYPTION_KEY is not configured' })
  }
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join(':')
}

export function decryptSecret(payload: string) {
  const [v, iv, tag, ct] = payload.split(':')
  if (v !== 'v1' || !iv || !tag || !ct) throw new Error('bad ciphertext')
  const d = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'))
  d.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([d.update(Buffer.from(ct, 'base64')), d.final()]).toString('utf8')
}

// مقارنة ثابتة الزمن لمنع هجمات التوقيت
export function safeEqual(a: string, b: string) {
  const x = createHash('sha256').update(a).digest()
  const y = createHash('sha256').update(b).digest()
  return timingSafeEqual(x, y) && a.length === b.length
}
