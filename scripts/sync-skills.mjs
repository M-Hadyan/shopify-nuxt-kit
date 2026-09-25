// ينسخ كل مهارات ريبو marketingskills إلى server/assets/skills
// الاستخدام: node scripts/sync-skills.mjs /path/to/marketingskills
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const src = process.argv[2]
if (!src || !existsSync(join(src, 'skills'))) {
  console.error('Usage: node scripts/sync-skills.mjs <path-to-marketingskills-clone>')
  process.exit(1)
}
const out = new URL('../server/assets/skills/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
const names = readdirSync(join(src, 'skills')).filter(n => existsSync(join(src, 'skills', n, 'SKILL.md')))
for (const name of names) cpSync(join(src, 'skills', name, 'SKILL.md'), join(out, `${name}.md`))
cpSync(join(src, 'LICENSE'), join(out, 'LICENSE'))
console.log(`Synced ${names.length} skills to ${out}`)
