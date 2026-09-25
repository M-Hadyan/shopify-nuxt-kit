import type { PlanDef, PlanId } from '../types'

// الأسعار تُدار داخل سلة (فوترة تطبيقات سلة). هذي القيم للعرض وحدود الاستخدام فقط.
export const PLANS: PlanDef[] = [
  {
    id: 'trial',
    name: 'تجربة مجانية',
    price: 0,
    runsPerMonth: 15,
    features: ['١٥ تشغيل', 'كل المهارات التسويقية (٥٠)'],
  },
  {
    id: 'basic',
    name: 'الأساسية',
    price: 99,
    runsPerMonth: 100,
    features: ['١٠٠ تشغيل شهريًا', 'كل المهارات التسويقية (٥٠)', 'سجل النتائج'],
  },
  {
    id: 'pro',
    name: 'الاحترافية',
    price: 249,
    runsPerMonth: 400,
    highlighted: true,
    features: ['٤٠٠ تشغيل شهريًا', 'كل المهارات التسويقية (٥٠)', 'سجل النتائج', 'أولوية في الدعم'],
  },
  {
    id: 'business',
    name: 'الأعمال',
    price: 599,
    runsPerMonth: 1500,
    features: ['١٥٠٠ تشغيل شهريًا', 'كل مزايا الاحترافية', 'مدير حساب مخصص'],
  },
]

export function getPlan(id: PlanId | string | undefined): PlanDef {
  return PLANS.find(p => p.id === id) ?? PLANS[0]!
}

// يحوّل اسم الباقة القادم من ويبهوك سلة إلى باقة رواج
export function planFromSallaName(name: string | undefined | null): PlanId {
  const n = (name ?? '').toLowerCase()
  if (/business|أعمال/.test(n)) return 'business'
  if (/pro|احتراف/.test(n)) return 'pro'
  if (/basic|أساس/.test(n)) return 'basic'
  return 'basic'
}
