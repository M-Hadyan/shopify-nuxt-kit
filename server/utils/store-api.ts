import type { DataKey, Order } from '#shared/types'
import type { StoreRecord } from './db'
import type { SallaApi } from './salla/types'
import { DemoSallaApi } from './salla/demo'
import { LiveSallaApi } from './salla/live'


export function getSallaApi(rec: StoreRecord): SallaApi {
  return rec.demo ? new DemoSallaApi(rec.id) : new LiveSallaApi(rec)
}

const DAY = 864e5
const isValid = (o: Order) => !/ملغي|cancel/i.test(o.status)

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s)

// يبني ملخصًا مضغوطًا لبيانات المتجر يُرسل للذكاء الاصطناعي
export async function buildStoreContext(api: SallaApi, keys: DataKey[]): Promise<string> {
  const want = new Set<DataKey>(['store', ...keys])
  const parts: string[] = []

  const store = await api.getStoreInfo()
  parts.push(`## المتجر\n- الاسم: ${store.name}\n- الرابط: ${store.domain}\n- العملة: ${store.currency}${store.description ? `\n- الوصف: ${store.description}` : ''}`)

  const orders = want.has('orders') || want.has('customers') ? await api.listOrders({ perPage: 200 }) : []

  if (want.has('orders')) {
    const valid = orders.filter(isValid)
    const since = Date.now() - 30 * DAY
    const recent = valid.filter(o => new Date(o.date).getTime() >= since)
    const rev = recent.reduce((a, o) => a + o.total.amount, 0)
    const cities = countBy(valid.map(o => o.city ?? 'غير محدد'))
    const pay = countBy(valid.map(o => o.paymentMethod ?? 'غير محدد'))
    const statuses = countBy(orders.map(o => o.status))
    parts.push(`## الطلبات (آخر ${orders.length} طلب)
- إيرادات آخر ٣٠ يوم: ${Math.round(rev)} ${store.currency} من ${recent.length} طلب
- متوسط قيمة الطلب: ${recent.length ? Math.round(rev / recent.length) : 0} ${store.currency}
- أكثر المدن: ${top(cities, 6)}
- طرق الدفع: ${top(pay, 6)}
- حالات الطلبات: ${top(statuses, 6)}`)
  }

  if (want.has('products')) {
    const products = await api.listProducts({ perPage: 100 })
    const rows = products.map(p => `| ${p.id} | ${p.name} | ${p.price.amount}${p.salePrice ? ` (مخفض ${p.salePrice.amount})` : ''} | ${p.quantity ?? '∞'} | ${p.soldCount ?? '-'} | ${p.rating ? p.rating.toFixed(1) : '-'} | ${p.category ?? '-'} | ${clip(stripHtml(p.description), 160) || '(بدون وصف)'} | ${p.seoTitle ? 'نعم' : 'لا'} |`)
    parts.push(`## المنتجات (${products.length})\n| المعرف | الاسم | السعر | المخزون | المبيعات | التقييم | التصنيف | الوصف الحالي | SEO |\n|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}`)
  }

  if (want.has('carts')) {
    const carts = await api.listAbandonedCarts({ perPage: 100 })
    const total = carts.reduce((a, c) => a + c.total.amount, 0)
    const items = countBy(carts.flatMap(c => c.items.map(i => i.name)))
    const buckets = { 'أقل من ٢٠٠': 0, '٢٠٠-٥٠٠': 0, 'أكثر من ٥٠٠': 0 }
    for (const c of carts) {
      if (c.total.amount < 200) buckets['أقل من ٢٠٠']++
      else if (c.total.amount <= 500) buckets['٢٠٠-٥٠٠']++
      else buckets['أكثر من ٥٠٠']++
    }
    parts.push(`## السلات المتروكة (${carts.length})
- القيمة الإجمالية: ${Math.round(total)} ${store.currency}
- المتوسط: ${carts.length ? Math.round(total / carts.length) : 0} ${store.currency}
- توزيع القيمة: ${Object.entries(buckets).map(([k, v]) => `${k}: ${v}`).join('، ')}
- أكثر المنتجات تركًا: ${top(items, 6)}`)
  }

  if (want.has('customers')) {
    const customers = await api.listCustomers({ perPage: 200 })
    const perCustomer = new Map<string, { n: number; spent: number }>()
    for (const o of orders.filter(isValid)) {
      if (!o.customerId) continue
      const c = perCustomer.get(o.customerId) ?? { n: 0, spent: 0 }
      c.n++
      c.spent += o.total.amount
      perCustomer.set(o.customerId, c)
    }
    const buyers = [...perCustomer.values()]
    const repeat = buyers.filter(b => b.n > 1).length
    const vip = buyers.filter(b => b.spent >= 1500).length
    parts.push(`## العملاء (${customers.length})
- عملاء اشتروا: ${buyers.length}، منهم ${repeat} كرروا الشراء (${buyers.length ? Math.round((repeat / buyers.length) * 100) : 0}٪)
- عملاء صرفوا أكثر من ١٥٠٠: ${vip}
- عملاء بدون أي طلب: ${customers.length - buyers.length}
- المدن: ${top(countBy(customers.map(c => c.city ?? 'غير محدد')), 6)}`)
  }

  if (want.has('reviews')) {
    const reviews = await api.listReviews({ perPage: 100 })
    const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0
    parts.push(`## التقييمات (${reviews.length}، المتوسط ${avg.toFixed(1)})\n${reviews.slice(0, 40).map(r => `- ${'★'.repeat(r.rating)} ${r.productName ? `[${r.productName}] ` : ''}${clip(r.content, 200)}`).join('\n')}`)
  }

  if (want.has('coupons')) {
    const coupons = await api.listCoupons({ perPage: 50 })
    parts.push(`## الكوبونات الحالية\n${coupons.map(c => `- ${c.code}: ${c.type === 'percentage' ? `${c.amount}٪` : `${c.amount} ${store.currency}`} ينتهي ${c.expiryDate.slice(0, 10)} (${c.status}${c.usedCount != null ? `، استُخدم ${c.usedCount}` : ''})`).join('\n') || 'لا يوجد'}`)
  }

  return parts.join('\n\n')
}

function countBy(xs: string[]) {
  const m = new Map<string, number>()
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1)
  return m
}

function top(m: Map<string, number>, n: number) {
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`).join('، ')
}
