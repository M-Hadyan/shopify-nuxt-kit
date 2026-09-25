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

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  amount: number
  freeShipping?: boolean
  minimumAmount?: number
  expiryDate: string
  status: string
  usedCount?: number
}

export type DataKey = 'store' | 'products' | 'orders' | 'customers' | 'carts' | 'reviews' | 'coupons'

export type SkillCategory = 'conversion' | 'content' | 'seo' | 'paid' | 'measurement' | 'retention' | 'growth' | 'strategy' | 'sales'

export interface SkillDef {
  slug: string // اسم المهارة في ريبو marketingskills
  title: string
  tagline: string
  icon: string
  tone: 'violet' | 'teal' | 'amber' | 'rose' | 'sky' | 'emerald' | 'indigo' | 'orange'
  category: SkillCategory
}

export interface RunRecord {
  id: string
  storeId: string
  skill: string
  title: string
  request: string
  output: string
  status: 'done' | 'error' | 'refused'
  createdAt: string
  usage?: { input: number; output: number }
}

export type PlanId = 'starter' | 'growth' | 'pro'

export interface PlanDef {
  id: PlanId
  name: string
  tagline: string
  price: number // ر.س شهريًا
  yearlyPrice: number // ر.س سنويًا
  runsPerMonth: number
  categories: SkillCategory[] | 'all' // التصنيفات المتاحة
  effort: 'medium' | 'high' // عمق التحليل
  features: string[]
  highlighted?: boolean
}

export interface MeResponse {
  store: StoreInfo
  plan: PlanDef
  status: 'active' | 'trial' | 'expired'
  usage: { month: string; runs: number; limit: number }
  demo: boolean
}
