import type {
  AbandonedCart, Coupon, Customer, Order, Product, Review, StoreInfo,
} from '#shared/types'
import type { ListOptions, SallaApi } from './types'
import { DEMO_TTL, getJson, setJson } from '../db'

// متجر تجريبي كامل لعرض رواج قبل ربط سلة الحقيقي
const CUR = 'SAR'
const m = (amount: number) => ({ amount, currency: CUR })

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const BASE_PRODUCTS: Product[] = [
  { id: 'p1', name: 'عطر عود ملكي ١٠٠ مل', description: 'عطر عود فاخر.', price: m(450), quantity: 34, status: 'sale', sku: 'OUD-100', category: 'عطور' },
  { id: 'p2', name: 'دهن عود كمبودي ٣ تولة', description: 'دهن عود كمبودي أصلي.', price: m(890), quantity: 8, status: 'sale', sku: 'DHN-3T', category: 'دهن عود' },
  { id: 'p3', name: 'بخور معمول بالعود', description: 'بخور.', price: m(120), salePrice: m(99), quantity: 120, status: 'sale', sku: 'BKH-MML', category: 'بخور' },
  { id: 'p4', name: 'مسك الطهارة الأبيض', description: 'مسك أبيض ناعم ٣٠ مل مناسب للاستخدام اليومي.', price: m(65), quantity: 300, status: 'sale', sku: 'MSK-W', category: 'مسك' },
  { id: 'p5', name: 'عطر ورد طائفي ٥٠ مل', description: 'عطر بالورد الطائفي.', price: m(320), quantity: 0, status: 'out', sku: 'TAIF-50', category: 'عطور' },
  { id: 'p6', name: 'مبخرة كهربائية ذكية', description: 'مبخرة كهربائية تعمل بالشحن.', price: m(210), quantity: 45, status: 'sale', sku: 'MBK-USB', category: 'إكسسوارات' },
  { id: 'p7', name: 'بكج هدية العيد (عطر + بخور + مسك)', description: 'بكج هدية.', price: m(599), salePrice: m(520), quantity: 25, status: 'sale', sku: 'GIFT-EID', category: 'هدايا' },
  { id: 'p8', name: 'معطر مفارش بالعود ٢٥٠ مل', description: 'معطر مفارش.', price: m(75), quantity: 90, status: 'sale', sku: 'FAB-250', category: 'معطرات' },
  { id: 'p9', name: 'عطر عنبر الليل ٧٥ مل', description: 'عطر شرقي بالعنبر والفانيلا يدوم طويلًا، مناسب للمساء والمناسبات.', price: m(380), quantity: 18, status: 'sale', sku: 'AMB-75', category: 'عطور' },
  { id: 'p10', name: 'مجموعة عينات (٦ عطور)', description: 'عينات.', price: m(150), quantity: 60, status: 'sale', sku: 'SMP-6', category: 'هدايا' },
  { id: 'p11', name: 'بخور دوسري فاخر', description: 'بخور دوسري.', price: m(180), quantity: 3, status: 'sale', sku: 'BKH-DSR', category: 'بخور' },
  { id: 'p12', name: 'معطر سيارة بالعود', description: 'معطر سيارة.', price: m(45), quantity: 200, status: 'sale', sku: 'CAR-OUD', category: 'معطرات' },
]

const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر', 'أبها', 'بريدة', 'تبوك', 'الطائف']
const FIRST = ['محمد', 'عبدالله', 'نورة', 'سارة', 'فهد', 'ريم', 'خالد', 'منيرة', 'سلطان', 'هيفاء', 'تركي', 'لمى', 'عبدالعزيز', 'جواهر', 'ناصر', 'دانة']
const LAST = ['القحطاني', 'العتيبي', 'الشمري', 'الدوسري', 'الغامدي', 'الزهراني', 'الحربي', 'المطيري', 'السبيعي', 'العنزي']
const PAY = ['مدى', 'Apple Pay', 'تابي', 'تمارا', 'بطاقة ائتمانية', 'الدفع عند الاستلام']
const STATUSES = ['تم التوصيل', 'تم التوصيل', 'تم التوصيل', 'قيد التنفيذ', 'تم الشحن', 'ملغي']
const REVIEW_TEXT: [number, string][] = [
  [5, 'ريحة العود ثابتة وفخمة، يستاهل كل ريال'],
  [5, 'التغليف راقي وجا بسرعة، هدية ممتازة'],
  [4, 'العطر حلو بس الثبات أقل من المتوقع شوي'],
  [5, 'البخور المعمول رهيب والكل سألني عنه'],
  [3, 'التوصيل تأخر ٥ أيام للدمام'],
  [2, 'الكمية صغيرة مقارنة بالسعر'],
  [5, 'تعامل راقي وخدمة عملاء سريعة'],
  [4, 'المبخرة عملية بس الشحن ياخذ وقت'],
  [5, 'دهن العود أصلي ١٠٠٪ وريحته تعبي المكان'],
  [1, 'وصلني المنتج مكسور ولا أحد رد علي'],
  [5, 'المسك ناعم ومناسب للاستخدام اليومي'],
  [4, 'بكج العيد جميل لكن ودي لو فيه كرت إهداء'],
]

function buildDemo() {
  const r = rng(42)
  const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)]!
  const products = BASE_PRODUCTS.map(p => ({ ...p }))
  const weights = [9, 3, 10, 12, 4, 5, 6, 7, 5, 8, 3, 9]

  const customers: Customer[] = Array.from({ length: 64 }, (_, i) => ({
    id: `c${i + 1}`,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    city: pick(CITIES),
    createdAt: new Date(Date.now() - Math.floor(r() * 300) * 864e5).toISOString(),
    ordersCount: 0,
    totalSpent: 0,
  }))

  const pickProduct = () => {
    const total = weights.reduce((a, b) => a + b, 0)
    let x = r() * total
    for (let i = 0; i < weights.length; i++) { x -= weights[i]!; if (x <= 0) return products[i]! }
    return products[0]!
  }

  const orders: Order[] = Array.from({ length: 140 }, (_, i) => {
    const n = 1 + Math.floor(r() * 3)
    const items = Array.from({ length: n }, () => {
      const p = pickProduct()
      const q = 1 + Math.floor(r() * 2)
      return { name: p.name, quantity: q, amount: (p.salePrice ?? p.price).amount * q }
    })
    const total = items.reduce((a, b) => a + b.amount, 0) + (r() > 0.6 ? 0 : 25)
    const c = r() < 0.35 ? customers[Math.floor(r() * 12)]! : pick(customers)
    const status = pick(STATUSES)
    if (status !== 'ملغي') { c.ordersCount! += 1; c.totalSpent! += total }
    return {
      id: `o${i + 1}`,
      reference: String(21480000 + i * 7),
      total: m(total),
      status,
      date: new Date(Date.now() - Math.floor(r() * 60 * 24) * 36e5).toISOString(),
      city: c.city,
      paymentMethod: pick(PAY),
      customerId: c.id,
      items,
    }
  }).sort((a, b) => b.date.localeCompare(a.date))

  for (const o of orders) for (const it of o.items) {
    const p = products.find(x => x.name === it.name)
    if (p) p.soldCount = (p.soldCount ?? 0) + it.quantity
  }

  const carts: AbandonedCart[] = Array.from({ length: 23 }, (_, i) => {
    const items = Array.from({ length: 1 + Math.floor(r() * 3) }, () => {
      const p = pickProduct()
      return { name: p.name, quantity: 1, amount: (p.salePrice ?? p.price).amount }
    })
    return {
      id: `ac${i + 1}`,
      total: m(items.reduce((a, b) => a + b.amount, 0)),
      itemsCount: items.length,
      items,
      customerName: pick(customers).name,
      createdAt: new Date(Date.now() - Math.floor(r() * 14 * 24) * 36e5).toISOString(),
    }
  })

  const reviews: Review[] = REVIEW_TEXT.map(([rating, content], i) => ({
    id: `r${i + 1}`,
    rating,
    content,
    productName: products[i % products.length]!.name,
    customerName: pick(customers).name,
    date: new Date(Date.now() - Math.floor(r() * 45) * 864e5).toISOString(),
  }))
  for (const p of products) {
    const rs = reviews.filter(x => x.productName === p.name)
    if (rs.length) p.rating = rs.reduce((a, b) => a + b.rating, 0) / rs.length
  }

  const coupons: Coupon[] = [
    { id: 'cp1', code: 'WELCOME10', type: 'percentage', amount: 10, expiryDate: '2026-12-31', status: 'active', usedCount: 37 },
  ]

  return { products, customers, orders, carts, reviews, coupons }
}

type DemoState = ReturnType<typeof buildDemo>

export const DEMO_STORE: StoreInfo = {
  id: 'demo',
  name: 'متجر عبق للعطور',
  domain: 'abaq-demo.salla.sa',
  description: 'متجر سعودي للعطور الشرقية ودهن العود والبخور، نوصّل لكل مدن المملكة.',
  currency: CUR,
  sallaPlan: 'pro',
}

function paginate<T>(items: T[], opts?: ListOptions) {
  const per = opts?.perPage ?? 50
  const page = opts?.page ?? 1
  return items.slice((page - 1) * per, page * per)
}

// كل متجر تجريبي له نسخته من البيانات
export class DemoSallaApi implements SallaApi {
  constructor(private storeId: string) {}

  private key() { return `demo:${this.storeId}` }

  private async state(): Promise<DemoState> {
    const s = await getJson<DemoState>(this.key())
    if (s) return s
    const fresh = buildDemo()
    await setJson(this.key(), fresh, { ttl: DEMO_TTL })
    return fresh
  }

  async getStoreInfo() { return { ...DEMO_STORE, id: this.storeId } }

  async listProducts(opts?: ListOptions) {
    const s = await this.state()
    const q = opts?.search?.trim()
    return paginate(q ? s.products.filter(p => p.name.includes(q)) : s.products, opts)
  }

  async getProduct(id: string) {
    const p = (await this.state()).products.find(x => x.id === id)
    if (!p) throw createError({ statusCode: 404, statusMessage: 'المنتج غير موجود' })
    return p
  }


  async listOrders(opts?: ListOptions) { return paginate((await this.state()).orders, opts) }
  async listCustomers(opts?: ListOptions) { return paginate((await this.state()).customers, opts) }
  async listAbandonedCarts(opts?: ListOptions) { return paginate((await this.state()).carts, opts) }
  async listReviews(opts?: ListOptions) { return paginate((await this.state()).reviews, opts) }
  async listCoupons(opts?: ListOptions) { return paginate((await this.state()).coupons, opts) }
}
