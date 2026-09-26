// يولّد بيانات دخول لوحة الأدمن: هاش كلمة المرور + سر 2FA
// الاستخدام: npm run admin:setup
import { randomBytes, scryptSync } from 'node:crypto'
import { createInterface } from 'node:readline'

let email, password
if (process.stdin.isTTY) {
  // إدخال تفاعلي: كلمة المرور ما تظهر
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  let muted = false
  const write = rl._writeToOutput.bind(rl)
  rl._writeToOutput = s => write(muted && !/\n/.test(s) ? '*'.repeat(s.length) : s)
  const ask = (q, hidden = false) => new Promise((resolve) => {
    rl.question(q, (a) => { muted = false; resolve(a) })
    muted = hidden
  })
  email = (await ask('إيميل الأدمن: ')).trim()
  password = await ask('كلمة المرور (١٢ حرف أو أكثر): ', true)
  process.stdout.write('\n')
  rl.close()
} else {
  // إدخال من pipe: سطر الإيميل ثم سطر كلمة المرور
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  ;[email = '', password = ''] = input.split(/\r?\n/)
  email = email.trim()
}
if (!email.includes('@')) { console.error('الإيميل غير صحيح'); process.exit(1) }
if (password.length < 12) { console.error('كلمة المرور قصيرة'); process.exit(1) }

const salt = randomBytes(16)
const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const secret = Array.from(randomBytes(20), b => alphabet[b % 32]).join('')
const otpauth = `otpauth://totp/Rawaj:${encodeURIComponent(email)}?secret=${secret}&issuer=Rawaj&digits=6&period=30`

console.log('\nحط هذي في متغيرات Coolify:\n')
console.log(`NUXT_ADMIN_EMAIL=${email}`)
console.log(`NUXT_ADMIN_PASSWORD_HASH=scrypt:${salt.toString('base64')}:${hash.toString('base64')}`)
console.log(`NUXT_ADMIN_TOTP_SECRET=${secret}`)
console.log('\nأضف السر لتطبيق المصادقة (Google Authenticator / 1Password):')
console.log(`  يدويًا: ${secret}`)
console.log(`  أو الرابط: ${otpauth}\n`)
