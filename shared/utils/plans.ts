import type { PlanDef, PlanId } from '../types'

// الأسعار تُدار داخل سلة (فوترة تطبيقات سلة). هذي القيم للعرض وحدود الاستخدام فقط.
export const PLANS: PlanDef[] = [
  {
    id: 'trial',
    name: 'تجربة مجانية',
    price: 0,
    runsPerMonth: 15,
    features: ['١٥ تشغيل للمهارات', 'كل البطاقات التسويقية', 'تحليل المتجر الشامل'],
  },
  {
    id: 'basic',
    name: 'الأساسية',
    price: 99,
    runsPerMonth: 100,
    features: ['١٠٠ تشغيل شهريًا', 'كل البطاقات التسويقية', 'تحسين أوصاف المنتجات وتطبيقها', 'سجل النتائج'],
  },
  {
    id: 'pro',
    name: 'الاحترافية',
    price: 249,
    runsPerMonth: 400,
    highlighted: true,
    features: ['٤٠٠ تشغيل شهريًا', 'مساعد رواج (قراءة وكتابة على المتجر)', 'إنشاء الكوبونات تلقائيًا', 'حملات المواسم', 'أولوية في الدعم'],
  },
  {
    id: 'business',
    name: 'الأعمال',
    price: 599,
    runsPerMonth: 1500,
    features: ['١٥٠٠ تشغيل شهريًا', 'كل مزايا الاحترافية', 'تحسين المنتجات بالجملة', 'مدير حساب مخصص'],
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
