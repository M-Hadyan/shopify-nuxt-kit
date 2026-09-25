import type {
  BetaContentBlock, BetaMessageParam, BetaTool, BetaToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/beta/messages/messages'
import type { ChatView, CouponInput, PendingAction, ProductUpdate } from '#shared/types'
import type { SallaApi } from './salla/types'
import { buildOverview } from './store-api'

export interface ChatRecord {
  id: string
  storeId: string
  messages: BetaMessageParam[] // سجل كامل يُضاف له فقط (append-only) ليبقى متوافقًا مع التفكير المحفوظ
  view: ChatView['messages']
  actions: Record<string, PendingAction>
  pendingNotes: string[]
  createdAt: string
}

const ASSISTANT_SYSTEM = `أنت "مساعد رواج"، مساعد تسويق ذكي متصل بمتجر التاجر في سلة.
- تقدر تقرأ بيانات المتجر بالأدوات المتاحة. اقرأ البيانات قبل ما تجاوب على أي سؤال عن المتجر، ولا تخمّن أرقامًا.
- التعديلات على المتجر (تحديث منتج، إنشاء كوبون) لا تُنفذ مباشرة: استخدم أدوات propose_* لرفع اقتراح، ويظهر للتاجر زر "تطبيق" ليوافق عليه. بعد الاقتراح وضّح للتاجر ماذا اقترحت ولماذا باختصار.
- اكتب بالعربية بأسلوب سعودي ودود ومختصر، واستخدم Markdown عند الحاجة.
- تاريخ اليوم: ${new Date().toISOString().slice(0, 10)}.`

const nullable = (type: string, description: string) => ({ type: [type, 'null'], description })

const TOOLS: BetaTool[] = [
  { name: 'get_store_overview', description: 'ملخص أداء المتجر: الإيرادات والطلبات لآخر ٣٠ يوم، متوسط السلة، السلات المتروكة، التقييم، أفضل المنتجات.', strict: true, input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false } },
  { name: 'search_products', description: 'قائمة منتجات المتجر مع السعر والمخزون والمبيعات والتقييم. استخدم query للبحث بالاسم أو اتركه null لكل المنتجات.', strict: true, input_schema: { type: 'object', properties: { query: nullable('string', 'نص البحث') }, required: ['query'], additionalProperties: false } },
  { name: 'get_product', description: 'تفاصيل منتج واحد كاملة بما فيها الوصف وبيانات SEO.', strict: true, input_schema: { type: 'object', properties: { product_id: { type: 'string' } }, required: ['product_id'], additionalProperties: false } },
  { name: 'list_orders', description: 'أحدث الطلبات مع المبلغ والحالة والمدينة وطريقة الدفع والمنتجات.', strict: true, input_schema: { type: 'object', properties: { limit: { type: 'integer', description: 'عدد الطلبات (حتى 100)' } }, required: ['limit'], additionalProperties: false } },
  { name: 'list_abandoned_carts', description: 'السلات المتروكة مع قيمتها ومنتجاتها.', strict: true, input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false } },
  { name: 'list_reviews', description: 'تقييمات العملاء على المنتجات.', strict: true, input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false } },
  { name: 'list_customers', description: 'قائمة العملاء مع المدينة.', strict: true, input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false } },
  { name: 'list_coupons', description: 'الكوبونات الحالية في المتجر.', strict: true, input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false } },
  {
    name: 'propose_product_update',
    description: 'يرفع اقتراح تعديل منتج للتاجر ليوافق عليه (لا ينفذ مباشرة). الحقول اللي ما تبي تغيرها اجعلها null. الوصف بصيغة HTML بسيطة.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        name: nullable('string', 'الاسم الجديد'),
        description: nullable('string', 'الوصف الجديد HTML'),
        seo_title: nullable('string', 'عنوان SEO ≤ 60 حرف'),
        seo_description: nullable('string', 'وصف ميتا ≤ 155 حرف'),
        price: nullable('number', 'السعر الجديد'),
        sale_price: nullable('number', 'سعر التخفيض'),
        reason: { type: 'string', description: 'سبب مختصر للتعديل' },
      },
      required: ['product_id', 'name', 'description', 'seo_title', 'seo_description', 'price', 'sale_price', 'reason'],
      additionalProperties: false,
    },
  },
  {
    name: 'propose_coupon',
    description: 'يرفع اقتراح إنشاء كوبون خصم للتاجر ليوافق عليه (لا ينفذ مباشرة).',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'كود إنجليزي بحروف كبيرة وأرقام' },
        type: { type: 'string', enum: ['percentage', 'fixed'] },
        amount: { type: 'number' },
        free_shipping: { type: 'boolean' },
        minimum_amount: nullable('number', 'الحد الأدنى للسلة'),
        expiry_date: { type: 'string', description: 'YYYY-MM-DD' },
        usage_limit: nullable('integer', 'عدد مرات الاستخدام الكلي'),
        reason: { type: 'string' },
      },
      required: ['code', 'type', 'amount', 'free_shipping', 'minimum_amount', 'expiry_date', 'usage_limit', 'reason'],
      additionalProperties: false,
    },
  },
]

/* eslint-disable @typescript-eslint/no-explicit-any */
async function runTool(name: string, input: any, api: SallaApi, chat: ChatRecord, turnActions: PendingAction[]): Promise<string> {
  switch (name) {
    case 'get_store_overview': {
      const { store: _s, salesByDay: _d, ...rest } = await buildOverview(api)
      return JSON.stringify(rest)
    }
    case 'search_products': {
      const ps = await api.listProducts({ perPage: 100, search: input.query ?? undefined })
      return JSON.stringify(ps.map(p => ({ id: p.id, name: p.name, price: p.price.amount, sale: p.salePrice?.amount ?? null, stock: p.quantity, sold: p.soldCount, rating: p.rating, category: p.category })))
    }
    case 'get_product':
      return JSON.stringify(await api.getProduct(String(input.product_id)))
    case 'list_orders': {
      const os = await api.listOrders({ perPage: Math.min(100, Math.max(1, Number(input.limit) || 30)) })
      return JSON.stringify(os)
    }
    case 'list_abandoned_carts': return JSON.stringify(await api.listAbandonedCarts({ perPage: 100 }))
    case 'list_reviews': return JSON.stringify(await api.listReviews({ perPage: 100 }))
    case 'list_customers': return JSON.stringify((await api.listCustomers({ perPage: 100 })).map(c => ({ id: c.id, name: c.name, city: c.city })))
    case 'list_coupons': return JSON.stringify(await api.listCoupons({ perPage: 50 }))
    case 'propose_product_update': {
      const product = await api.getProduct(String(input.product_id))
      const patch: ProductUpdate = {}
      if (input.name != null) patch.name = input.name
      if (input.description != null) patch.description = sanitizeDescription(input.description)
      if (input.seo_title != null) patch.seoTitle = input.seo_title
      if (input.seo_description != null) patch.seoDescription = input.seo_description
      if (input.price != null) patch.price = input.price
      if (input.sale_price != null) patch.salePrice = input.sale_price
      if (!Object.keys(patch).length) return 'لا يوجد أي حقل للتعديل.'
      const a = addAction(chat, turnActions, 'update_product', `تعديل المنتج «${product.name}»: ${input.reason}`, { productId: product.id, productName: product.name, before: pickBefore(product, patch), patch })
      return `تم رفع الاقتراح (${a.id}) للتاجر للموافقة.`
    }
    case 'propose_coupon': {
      const c: CouponInput = {
        code: String(input.code).toUpperCase().replace(/[^A-Z0-9]/g, ''),
        type: input.type === 'fixed' ? 'fixed' : 'percentage',
        amount: Number(input.amount),
        freeShipping: !!input.free_shipping,
        minimumAmount: input.minimum_amount ?? undefined,
        expiryDate: String(input.expiry_date),
        usageLimit: input.usage_limit ?? undefined,
      }
      const label = c.type === 'percentage' ? `${c.amount}٪` : `${c.amount} ريال`
      const a = addAction(chat, turnActions, 'create_coupon', `إنشاء كوبون ${c.code} بخصم ${label}: ${input.reason}`, { coupon: c })
      return `تم رفع الاقتراح (${a.id}) للتاجر للموافقة.`
    }
    default:
      return `أداة غير معروفة: ${name}`
  }
}

function pickBefore(p: Awaited<ReturnType<SallaApi['getProduct']>>, patch: ProductUpdate) {
  const b: Record<string, unknown> = {}
  if (patch.name !== undefined) b.name = p.name
  if (patch.description !== undefined) b.description = p.description
  if (patch.seoTitle !== undefined) b.seoTitle = p.seoTitle ?? ''
  if (patch.seoDescription !== undefined) b.seoDescription = p.seoDescription ?? ''
  if (patch.price !== undefined) b.price = p.price.amount
  if (patch.salePrice !== undefined) b.salePrice = p.salePrice?.amount ?? null
  return b
}

function addAction(chat: ChatRecord, turn: PendingAction[], kind: PendingAction['kind'], summary: string, payload: Record<string, unknown>) {
  const a: PendingAction = { id: newId('act_'), kind, summary, payload, status: 'pending', createdAt: new Date().toISOString() }
  chat.actions[a.id] = a
  turn.push(a)
  return a
}

export async function executeAction(api: SallaApi, action: PendingAction) {
  if (action.kind === 'update_product') {
    const { productId, patch } = action.payload as { productId: string; patch: ProductUpdate }
    await api.updateProduct(productId, patch)
  } else if (action.kind === 'create_coupon') {
    await api.createCoupon((action.payload as { coupon: CouponInput }).coupon)
  }
}

export function newChat(storeId: string): ChatRecord {
  return { id: newId('chat_'), storeId, messages: [], view: [], actions: {}, pendingNotes: [], createdAt: new Date().toISOString() }
}

const textOf = (content: BetaContentBlock[]) =>
  content.filter((b): b is Extract<BetaContentBlock, { type: 'text' }> => b.type === 'text').map(b => b.text).join('\n\n').trim()

export async function chatTurn(chat: ChatRecord, api: SallaApi, userText: string) {
  const model = aiModel()
  const notes = chat.pendingNotes.length ? `\n\n(تحديث: ${chat.pendingNotes.join('؛ ')})` : ''
  chat.pendingNotes = []
  chat.messages.push({ role: 'user', content: userText + notes })
  chat.view.push({ role: 'user', text: userText })

  const turnActions: PendingAction[] = []
  const texts: string[] = []

  for (let i = 0; i < 10; i++) {
    const res = await anthropic().beta.messages.create({
      model,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      ...fallbackParams(model),
      system: ASSISTANT_SYSTEM,
      tools: TOOLS,
      cache_control: { type: 'ephemeral' },
      messages: chat.messages,
    })
    chat.messages.push({ role: 'assistant', content: res.content as BetaMessageParam['content'] })
    const t = textOf(res.content)
    if (t) texts.push(t)

    if (res.stop_reason === 'refusal') { texts.push('تعذر إكمال هذا الطلب، جرّب صياغة مختلفة.'); break }
    if (res.stop_reason === 'pause_turn') continue
    if (res.stop_reason !== 'tool_use') break

    const results: BetaToolResultBlockParam[] = []
    await Promise.all(res.content.map(async (b) => {
      if (b.type !== 'tool_use') return
      try {
        const out = await runTool(b.name, b.input, api, chat, turnActions)
        results.push({ type: 'tool_result', tool_use_id: b.id, content: out })
      } catch (e: any) {
        results.push({ type: 'tool_result', tool_use_id: b.id, content: `خطأ: ${e?.statusMessage ?? e?.message ?? 'غير معروف'}`, is_error: true })
      }
    }))
    chat.messages.push({ role: 'user', content: results })
  }

  const reply = { role: 'assistant' as const, text: texts.join('\n\n') || 'تم.', actions: turnActions }
  chat.view.push(reply)
  return reply
}
