import type { PlanDef, PlanId, SkillCategory } from '../types'
import { SKILLS } from './skills'

const STARTER_CATEGORIES: SkillCategory[] = ['content', 'paid', 'strategy', 'conversion']
const ar = (n: number) => n.toLocaleString('ar-SA')
const starterCount = ar(SKILLS.filter(s => STARTER_CATEGORIES.includes(s.category)).length)
const allCount = ar(SKILLS.length)

// الأسعار تُدار داخل سلة (فوترة تطبيقات سلة). هنا الحدود والمزايا فقط.
export const PLANS: PlanDef[] = [
  {
    id: 'starter',
    name: 'انطلاقة',
    tagline: 'للمتجر اللي يبدأ تسويقه',
    price: 79,
    yearlyPrice: 790,
    runsPerMonth: 60,
    categories: STARTER_CATEGORIES,
    effort: 'medium',
    features: [
      `${starterCount} مهارة: المحتوى، الإعلانات، الاستراتيجية، رفع التحويل`,
      '٦٠ تشغيل شهريًا',
      'تحليل مبني على بيانات متجرك',
      'تصدير PDF وسجل النتائج',
    ],
  },
  {
    id: 'growth',
    name: 'نمو',
    tagline: 'للمتجر اللي يبي يكبر بكل القنوات',
    price: 199,
    yearlyPrice: 1990,
    runsPerMonth: 250,
    categories: 'all',
    effort: 'medium',
    highlighted: true,
    features: [
      `كل المهارات (${allCount} مهارة)`,
      '٢٥٠ تشغيل شهريًا',
      'SEO والقياس والنمو والاحتفاظ بالعملاء',
      'تصدير PDF وسجل النتائج',
    ],
  },
  {
    id: 'pro',
    name: 'احتراف',
    tagline: 'للمتاجر الكبيرة والوكالات',
    price: 449,
    yearlyPrice: 4490,
    runsPerMonth: 1000,
    categories: 'all',
    effort: 'high',
    features: [
      `كل المهارات (${allCount} مهارة)`,
      '١٠٠٠ تشغيل شهريًا',
      'تحليل أعمق وأدق لكل طلب',
      'أولوية في الدعم',
    ],
  },
]

export const TRIAL_DAYS = 7
export const TRIAL_RUNS = 15
export const TRIAL_PLAN: PlanId = 'growth'

export function getPlan(id: PlanId | string | undefined): PlanDef {
  return PLANS.find(p => p.id === id) ?? PLANS[0]!
}

export function planAllows(plan: PlanDef, category: SkillCategory) {
  return plan.categories === 'all' || plan.categories.includes(category)
}

// أرخص باقة تفتح هذا التصنيف
export function planFor(category: SkillCategory): PlanDef {
  return PLANS.find(p => planAllows(p, category))!
}

// يحوّل اسم الباقة القادم من ويبهوك سلة إلى باقة رواج
export function planFromSallaName(name: string | undefined | null): PlanId {
  const n = (name ?? '').toLowerCase()
  if (/pro|احتراف/.test(n)) return 'pro'
  if (/growth|نمو/.test(n)) return 'growth'
  return 'starter'
}
