import type {
  AbandonedCart, Coupon, Customer, Money, Order, Product, Review, StoreInfo,
} from '#shared/types'
import type { ListOptions, SallaApi } from './types'
import type { StoreRecord } from '../db'
import { getStoreRecord, updateStoreRecord } from '../db'
import { SALLA_API, refreshTokens } from './oauth'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = any

const money = (v: Raw, fallback = 'SAR'): Money =>
  typeof v === 'object' && v
    ? { amount: Number(v.amount ?? 0), currency: v.currency ?? fallback }
    : { amount: Number(v ?? 0), currency: fallback }

const dateOf = (v: Raw): string => (typeof v === 'object' && v ? v.date : v) ?? new Date().toISOString()

function mapProduct(p: Raw): Product {
  return {
    id: String(p.id),
    name: p.name ?? '',
    description: p.description ?? '',
    price: money(p.price),
    salePrice: p.sale_price && Number(p.sale_price.amount ?? p.sale_price) > 0 ? money(p.sale_price) : null,
    quantity: p.unlimited_quantity ? null : (p.quantity ?? null),
    status: p.status ?? '',
    sku: p.sku ?? undefined,
    image: p.main_image ?? p.thumbnail ?? p.images?.[0]?.url,
    category: p.categories?.[0]?.name,
    soldCount: p.sold_quantity ?? undefined,
    rating: p.rating?.rate ?? undefined,
    url: p.urls?.customer ?? p.url,
    seoTitle: p.metadata?.title ?? undefined,
    seoDescription: p.metadata?.description ?? undefined,
  }
}

function mapOrder(o: Raw): Order {
  return {
    id: String(o.id),
    reference: String(o.reference_id ?? o.id),
    total: money(o.total ?? o.amounts?.total),
    status: o.status?.name ?? o.status ?? '',
    date: dateOf(o.date ?? o.created_at),
    city: o.customer?.city ?? o.shipping?.address?.city,
    paymentMethod: o.payment_method,
    customerId: o.customer?.id ? String(o.customer.id) : undefined,
    items: (o.items ?? []).map((i: Raw) => ({
      name: i.name, quantity: Number(i.quantity ?? 1), amount: Number(i.amounts?.total?.amount ?? i.amount ?? 0),
    })),
  }
}

function mapCustomer(c: Raw): Customer {
  return {
    id: String(c.id),
    name: [c.first_name, c.last_name].filter(Boolean).join(' ') || c.name || '',
    city: c.city,
    gender: c.gender,
    createdAt: dateOf(c.created_at ?? c.updated_at),
  }
}

function mapCart(c: Raw): AbandonedCart {
  const items = (c.items ?? []).map((i: Raw) => ({
    name: i.product?.name ?? i.name ?? '', quantity: Number(i.quantity ?? 1), amount: Number(i.amounts?.total?.amount ?? i.price?.amount ?? 0),
  }))
  return {
    id: String(c.id),
    total: money(c.total ?? c.subtotal),
    itemsCount: c.items_count ?? items.length,
    items,
    customerName: c.customer?.name,
    createdAt: dateOf(c.created_at ?? c.age),
  }
}

function mapReview(r: Raw): Review {
  return {
    id: String(r.id),
    rating: Number(r.rating ?? 0),
    content: r.content ?? '',
    productName: r.product?.name,
    customerName: r.customer?.name,
    date: dateOf(r.date ?? r.created_at),
  }
}

function mapCoupon(c: Raw): Coupon {
  return {
    id: String(c.id),
    code: c.code,
    type: c.type === 'fixed' ? 'fixed' : 'percentage',
    amount: Number(c.amount?.amount ?? c.amount ?? 0),
    freeShipping: !!c.free_shipping,
    minimumAmount: c.minimum_amount ? Number(c.minimum_amount.amount ?? c.minimum_amount) : undefined,
    expiryDate: dateOf(c.expiry_date),
    status: c.status ?? '',
    usedCount: c.statistics?.num_of_usage ?? undefined,
  }
}

// عميل Salla Admin API v2 — يجدد التوكن تلقائيًا
export class LiveSallaApi implements SallaApi {
  constructor(private rec: StoreRecord) {}

  private async token() {
    const t = this.rec.tokens
    if (!t) throw createError({ statusCode: 401, statusMessage: 'المتجر غير مربوط بسلة' })
    if (t.expiresAt - Date.now() > 5 * 60_000) return t.accessToken
    try {
      const fresh = await refreshTokens(t.refreshToken)
      this.rec = (await updateStoreRecord(this.rec.id, { tokens: fresh })) ?? { ...this.rec, tokens: fresh }
      return fresh.accessToken
    } catch {
      // refresh token يُستخدم مرة وحدة: لو طلب ثاني جدّده قبلنا، نقرأ التوكن الجديد من القاعدة
      const latest = await getStoreRecord(this.rec.id)
      if (latest?.tokens && latest.tokens.expiresAt - Date.now() > 60_000) {
        this.rec = latest
        return latest.tokens.accessToken
      }
      await logEvent('error', 'salla.token_refresh_failed', 'فشل تجديد توكن سلة', { storeId: this.rec.id })
      throw createError({ statusCode: 401, statusMessage: 'انتهت صلاحية الربط مع سلة. أعد فتح رواج من سلة.' })
    }
  }

  private async call<T = Raw>(path: string, opts: { query?: Record<string, unknown> } = {}) {
    const res = await $fetch<{ data: T }>(`${SALLA_API}${path}`, {
      query: opts.query,
      headers: { Authorization: `Bearer ${await this.token()}`, Accept: 'application/json' },
    }).catch(async (e: Raw) => {
      const msg = e?.data?.error?.message ?? e?.message ?? 'Salla API error'
      await logEvent('warn', 'salla.api_error', `خطأ من سلة (${path}): ${msg}`, { storeId: this.rec.id, data: { status: e?.statusCode } })
      throw createError({ statusCode: e?.statusCode ?? 502, statusMessage: `سلة: ${msg}` })
    })
    return res.data
  }

  private q(opts?: ListOptions) {
    return { page: opts?.page ?? 1, per_page: opts?.perPage ?? 50, keyword: opts?.search }
  }

  async getStoreInfo(): Promise<StoreInfo> {
    const s = await this.call('/store/info')
    return {
      id: String(s.id), name: s.name, domain: s.domain, description: s.description,
      avatar: s.avatar, currency: s.currency ?? 'SAR', sallaPlan: s.plan,
    }
  }

  async listProducts(opts?: ListOptions) { return (await this.call<Raw[]>('/products', { query: this.q(opts) })).map(mapProduct) }
  async getProduct(id: string) { return mapProduct(await this.call(`/products/${id}`)) }


  async listOrders(opts?: ListOptions) { return (await this.call<Raw[]>('/orders', { query: this.q(opts) })).map(mapOrder) }
  async listCustomers(opts?: ListOptions) { return (await this.call<Raw[]>('/customers', { query: this.q(opts) })).map(mapCustomer) }
  async listAbandonedCarts(opts?: ListOptions) { return (await this.call<Raw[]>('/carts/abandoned', { query: this.q(opts) })).map(mapCart) }
  async listReviews(opts?: ListOptions) { return (await this.call<Raw[]>('/reviews', { query: { ...this.q(opts), type: 'rating' } })).map(mapReview) }
  async listCoupons(opts?: ListOptions) { return (await this.call<Raw[]>('/coupons', { query: this.q(opts) })).map(mapCoupon) }
}
