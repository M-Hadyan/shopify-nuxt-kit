// ينسخ ملفات SKILL.md من ريبو marketingskills إلى server/assets/skills
// الاستخدام: node scripts/sync-skills.mjs /path/to/marketingskills
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export const SKILLS = [
  'product-marketing', 'copywriting', 'copy-editing', 'offers', 'pricing',
  'emails', 'sms', 'ads', 'ad-creative', 'social', 'seo-audit', 'ai-seo',
  'schema', 'content-strategy', 'marketing-ideas', 'marketing-plan',
  'marketing-psychology', 'launch', 'events', 'churn-prevention', 'referrals',
  'influencer-marketing', 'customer-research', 'cro', 'popups', 'video',
]

const src = process.argv[2]
if (!src || !existsSync(join(src, 'skills'))) {
  console.error('Usage: node scripts/sync-skills.mjs <path-to-marketingskills-clone>')
  process.exit(1)
}
const out = new URL('../server/assets/skills/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
for (const name of SKILLS) {
  cpSync(join(src, 'skills', name, 'SKILL.md'), join(out, `${name}.md`))
}
cpSync(join(src, 'LICENSE'), join(out, 'LICENSE'))
console.log(`Synced ${SKILLS.length} skills to ${out}`)
