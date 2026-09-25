export interface Money { amount: number; currency: string }

export interface StoreInfo {
  id: string
  name: string
  domain: string
  description?: string
  avatar?: string
  currency: string
  sallaPlan?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: Money
  salePrice?: Money | null
  quantity: number | null
  status: string
  sku?: string
  image?: string
  category?: string
  soldCount?: number
  rating?: number
  url?: string
  seoTitle?: string
  seoDescription?: string
}

export interface ProductUpdate {
  name?: string
  description?: string
  seoTitle?: string
  seoDescription?: string
  price?: number
  salePrice?: number | null
}

export interface OrderItem { name: string; quantity: number; amount: number }

export interface Order {
  id: string
  reference: string
  total: Money
  status: string
  date: string
  city?: string
  paymentMethod?: string
  customerId?: string
  items: OrderItem[]
}

export interface Customer {
  id: string
  name: string
  city?: string
  gender?: string
  createdAt?: string
  ordersCount?: number
  totalSpent?: number
}

export interface AbandonedCart {
  id: string
  total: Money
  itemsCount: number
  items: OrderItem[]
  customerName?: string
  createdAt: string
}

export interface Review {
  id: string
  rating: number
  content: string
  productName?: string
  customerName?: string
  date: string
}

export interface CouponInput {
  code: string
  type: 'percentage' | 'fixed'
  amount: number
  freeShipping?: boolean
  minimumAmount?: number
  startDate?: string
  expiryDate: string
  usageLimit?: number
}

export interface Coupon extends CouponInput { id: string; status: string; usedCount?: number }

export interface StoreOverview {
  store: StoreInfo
  kpis: {
    revenue30d: number
    orders30d: number
    aov30d: number
    productsCount: number
    outOfStock: number
    abandonedCarts: number
    abandonedValue: number
    avgRating: number | null
    customersCount: number
  }
  salesByDay: { date: string; total: number }[]
  topProducts: { id: string; name: string; sold: number; revenue: number }[]
}

export type DataKey = 'store' | 'products' | 'orders' | 'customers' | 'carts' | 'reviews' | 'coupons'

export interface SkillInput {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select'
  options?: string[]
  placeholder?: string
  required?: boolean
}

export interface SkillDef {
  slug: string
  title: string
  tagline: string
  description: string
  icon: string
  tone: 'violet' | 'teal' | 'amber' | 'rose' | 'sky' | 'emerald' | 'indigo' | 'orange'
  category: SkillCategory
  sources: string[]
  data: DataKey[]
  inputs: SkillInput[]
  task: string
}

export type SkillCategory = 'analysis' | 'content' | 'sales' | 'ads' | 'retention' | 'seasonal'

export interface RunRecord {
  id: string
  storeId: string
  skill: string
  title: string
  inputs: Record<string, string>
  output: string
  status: 'done' | 'error' | 'refused'
  createdAt: string
  usage?: { input: number; output: number }
}

export type ActionKind = 'update_product' | 'create_coupon'

export interface PendingAction {
  id: string
  kind: ActionKind
  summary: string
  payload: Record<string, unknown>
  status: 'pending' | 'applied' | 'rejected' | 'failed'
  error?: string
  createdAt: string
}

export interface ChatView {
  id: string
  messages: { role: 'user' | 'assistant'; text: string; actions?: PendingAction[] }[]
}

export interface PlanDef {
  id: PlanId
  name: string
  price: number
  runsPerMonth: number
  features: string[]
  highlighted?: boolean
}

export type PlanId = 'trial' | 'basic' | 'pro' | 'business'

export interface MeResponse {
  store: StoreInfo
  plan: PlanDef
  usage: { month: string; runs: number; limit: number }
  demo: boolean
}
