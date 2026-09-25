// يولّد بيانات دخول لوحة الأدمن: هاش كلمة المرور + سر 2FA
// الاستخدام: npm run admin:setup
import { randomBytes, scryptSync } from 'node:crypto'
import { createInterface } from 'node:readline'

function ask(q, hidden = false) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    if (hidden) rl._writeToOutput = s => rl.output.write(s.includes(q) ? s : '*')
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a) })
  })
}

const email = (await ask('إيميل الأدمن: ')).trim()
const password = await ask('كلمة المرور (١٢ حرف أو أكثر): ', true)
if (password.length < 12) { console.error('كلمة المرور قصيرة'); process.exit(1) }

const salt = randomBytes(16)
const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const secret = Array.from(randomBytes(20), b => alphabet[b % 32]).join('')
const otpauth = `otpauth://totp/Rawaj:${encodeURIComponent(email)}?secret=${secret}&issuer=Rawaj&digits=6&period=30`

console.log('\nحط هذي في متغيرات Coolify:\n')
console.log(`NUXT_ADMIN_EMAIL=${email}`)
console.log(`NUXT_ADMIN_PASSWORD_HASH=scrypt$${salt.toString('base64')}$${hash.toString('base64')}`)
console.log(`NUXT_ADMIN_TOTP_SECRET=${secret}`)
console.log('\nأضف السر لتطبيق المصادقة (Google Authenticator / 1Password):')
console.log(`  يدويًا: ${secret}`)
console.log(`  أو الرابط: ${otpauth}\n`)
