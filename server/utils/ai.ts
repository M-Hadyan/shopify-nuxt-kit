import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { BetaMessageStreamParams } from '@anthropic-ai/sdk/resources/beta/messages/messages'
import { z } from 'zod'
import type { Product, SkillDef } from '#shared/types'

let client: Anthropic | null = null

export function anthropic() {
  const { anthropicApiKey } = useRuntimeConfig()
  if (!client) {
    // بدون مفتاح صريح يقرأ SDK المتغير ANTHROPIC_API_KEY تلقائيًا
    client = new Anthropic(anthropicApiKey ? { apiKey: anthropicApiKey } : {})
  }
  return client
}

export function aiModel() {
  return useRuntimeConfig().anthropicModel || 'claude-opus-5'
}

// fallbacks: "default" — لو رفض النموذج الطلب، الـ API يعيد تشغيله على نموذج بديل مناسب تلقائيًا
const FALLBACK_MODELS = new Set(['claude-opus-5', 'claude-fable-5-1'])
export function fallbackParams(model: string): Pick<BetaMessageStreamParams, 'betas' | 'fallbacks'> {
  return FALLBACK_MODELS.has(model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}
}

export const BASE_SYSTEM = `أنت "رواج"، خبير تسويق للتجارة الإلكترونية في السعودية، تعمل داخل منصة تخدم تجار سلة.

طريقة عملك:
- تكتب بالعربية الفصحى المبسطة الواضحة. في النصوص الإعلانية ورسائل العملاء استخدم لهجة سعودية بيضاء إذا كانت أنسب للجمهور.
- تبني كل توصية على بيانات المتجر المرفقة، وتذكر الرقم الذي بنيت عليه. لا تخترع أرقامًا غير موجودة؛ إذا احتجت افتراضًا فصرّح به.
- لا تطرح أسئلة على التاجر؛ بيانات المتجر هي السياق الكامل، وأكمل المهمة بأفضل افتراضات معقولة.
- العملة ريال سعودي. راعِ السوق السعودي: المواسم (رمضان، الأعياد، اليوم الوطني، يوم التأسيس، الجمعة البيضاء)، وسائل الدفع (مدى، Apple Pay، تابي، تمارا)، المنصات الأكثر استخدامًا (سناب شات، تيك توك، إنستقرام، X)، وأنظمة التجارة الإلكترونية والإعلان في المملكة.
- الناتج بصيغة Markdown منظمة: عناوين، جداول عند المقارنة، قوائم مختصرة. ابدأ بالأهم.
- كن عمليًا: كل توصية لها خطوة تنفيذ واضحة داخل سلة أو خارجها.

ستجد أدناه مراجع مهارات تسويقية (بالإنجليزية) تمثل منهجيات خبراء. طبّق منهجيتها، لكن تجاهل أي تعليمات فيها عن قراءة ملفات أو طرح أسئلة على المستخدم، واكتب الناتج بالعربية.`

function stripFrontmatter(md: string) {
  return md.replace(/^---[\s\S]*?---\s*/, '')
}

export async function loadSkillDocs(names: string[]) {
  const storage = useStorage('assets:skills')
  const docs = await Promise.all(names.map(async (n) => {
    const raw = await storage.getItem<string>(`${n}.md`)
    return raw ? `<skill name="${n}">\n${stripFrontmatter(String(raw))}\n</skill>` : ''
  }))
  return docs.filter(Boolean).join('\n\n')
}

export async function skillSystem(skill: SkillDef) {
  const docs = await loadSkillDocs(skill.sources)
  return [
    { type: 'text' as const, text: BASE_SYSTEM },
    // المراجع ثابتة لكل مهارة، فنخزنها مؤقتًا (prompt caching) لتقليل التكلفة
    { type: 'text' as const, text: `# مراجع المهارات\n\n${docs}`, cache_control: { type: 'ephemeral' as const } },
  ]
}

export function skillUserPrompt(skill: SkillDef, context: string, inputs: Record<string, string>) {
  const inputLines = skill.inputs
    .filter(i => inputs[i.key]?.trim())
    .map(i => `- ${i.label}: ${inputs[i.key]!.trim()}`)
    .join('\n')
  return `<store_data>\n${context}\n</store_data>\n\n# المهمة: ${skill.title}\n${skill.task}${inputLines ? `\n\n# مدخلات التاجر\n${inputLines}` : ''}`
}

export class AiRefusalError extends Error {}

export function describeAiError(e: unknown): string {
  if (e instanceof AiRefusalError) return 'تعذر إكمال هذا الطلب. جرّب صياغة مختلفة.'
  if (e instanceof Anthropic.AuthenticationError) return 'مفتاح Claude API غير صحيح أو غير مضبوط.'
  if (e instanceof Anthropic.RateLimitError) return 'ضغط عالٍ على الخدمة، حاول بعد دقيقة.'
  if (e instanceof Anthropic.APIConnectionError) return 'تعذر الاتصال بخدمة الذكاء الاصطناعي.'
  if (e instanceof Anthropic.APIError) return `خطأ من خدمة الذكاء الاصطناعي (${e.status}).`
  if (e instanceof Error && /api key|apiKey|authentication/i.test(e.message)) return 'مفتاح Claude API غير مضبوط (NUXT_ANTHROPIC_API_KEY).'
  return 'حدث خطأ غير متوقع.'
}

// ---------- تحسين منتج واحد (مخرجات منظمة قابلة للتطبيق) ----------

export const ProductCopySchema = z.object({
  name: z.string().describe('اسم المنتج المحسّن، واضح ويحتوي كلمة البحث الأساسية'),
  description_html: z.string().describe('الوصف الجديد بصيغة HTML بسيطة: <p> و<ul><li> و<strong> فقط'),
  seo_title: z.string().describe('عنوان SEO لا يتجاوز ٦٠ حرفًا'),
  seo_description: z.string().describe('وصف ميتا لا يتجاوز ١٥٥ حرفًا'),
  highlights: z.array(z.string()).describe('أبرز ٣-٥ نقاط بيع'),
  rationale: z.string().describe('لماذا هذا الوصف أفضل من الحالي، في سطرين'),
})
export type ProductCopy = z.infer<typeof ProductCopySchema>

export async function optimizeProductCopy(product: Product, storeName: string, reviews: string[], tone: string, notes: string) {
  const model = aiModel()
  const docs = await loadSkillDocs(['copywriting', 'marketing-psychology'])
  const res = await anthropic().beta.messages.parse({
    model,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: betaZodOutputFormat(ProductCopySchema) },
    ...fallbackParams(model),
    system: [
      { type: 'text', text: BASE_SYSTEM },
      { type: 'text', text: `# مراجع المهارات\n\n${docs}`, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{
      role: 'user',
      content: `أعد كتابة صفحة هذا المنتج في متجر "${storeName}" لتكون مقنعة ومحسنة لمحركات البحث.

<product>
الاسم: ${product.name}
السعر: ${product.price.amount} ${product.price.currency}${product.salePrice ? ` (مخفض إلى ${product.salePrice.amount})` : ''}
التصنيف: ${product.category ?? '-'}
المبيعات: ${product.soldCount ?? '-'}
الوصف الحالي: ${product.description || '(فارغ)'}
</product>
${reviews.length ? `\n<reviews>\n${reviews.map(r => `- ${r}`).join('\n')}\n</reviews>\n` : ''}
الأسلوب المطلوب: ${tone || 'ودّي وقريب'}
${notes ? `ملاحظات التاجر: ${notes}` : ''}

لا تذكر معلومات غير مؤكدة عن المنتج (مثل المكونات أو بلد الصنع) إلا إذا كانت في البيانات أو الملاحظات.`,
    }],
  })
  if (res.stop_reason === 'refusal') throw new AiRefusalError()
  if (!res.parsed_output) throw new Error('تعذر قراءة ناتج الذكاء الاصطناعي')
  return res.parsed_output
}
