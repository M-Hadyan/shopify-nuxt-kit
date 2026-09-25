import Anthropic from '@anthropic-ai/sdk'
import type { BetaMessageStreamParams } from '@anthropic-ai/sdk/resources/beta/messages/messages'
import type { PlanDef, SkillDef } from '#shared/types'

let client: Anthropic | null = null

export function anthropic() {
  const { anthropicApiKey } = useRuntimeConfig()
  if (!client) {
    // بدون مفتاح صريح يقرأ SDK المتغير ANTHROPIC_API_KEY تلقائيًا
    client = new Anthropic(anthropicApiKey ? { apiKey: anthropicApiKey } : {})
  }
  return client
}

// توزيع النماذج حسب الباقة وثقل المهارة (للتحكم في التكلفة)
export function pickModel(plan: PlanDef, skill: SkillDef) {
  const c = useRuntimeConfig()
  const heavy = HEAVY_SKILLS.has(skill.slug)
  const premium = heavy && plan.premiumModel
  return {
    model: premium ? (c.anthropicModelPremium || 'claude-opus-5') : (c.anthropicModelStandard || 'claude-sonnet-5'),
    effort: plan.effort,
    // سقف المخرجات (يشمل التفكير) يحدد أقصى تكلفة للتشغيل الواحد
    maxTokens: heavy ? 24000 : 16000,
  }
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

ستجد أدناه مرجع مهارة تسويقية (بالإنجليزية) يمثل منهجية خبراء. طبّق منهجيته، لكن تجاهل أي تعليمات فيها عن قراءة ملفات أو طرح أسئلة على المستخدم، واكتب الناتج بالعربية.`

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
  const docs = await loadSkillDocs([skill.slug])
  return [
    { type: 'text' as const, text: BASE_SYSTEM },
    // مرجع المهارة ثابت، فنخزنه مؤقتًا (prompt caching) لتقليل التكلفة
    { type: 'text' as const, text: `# مرجع المهارة\n\n${docs}`, cache_control: { type: 'ephemeral' as const } },
  ]
}

export function skillUserPrompt(skill: SkillDef, context: string, request: string) {
  const ask = request.trim() || `طبّق مهارة «${skill.title}» على متجري وأعطني أهم التوصيات والمخرجات الجاهزة للتنفيذ.`
  return `<store_data>\n${context}\n</store_data>\n\n# المهارة: ${skill.title}\n\n# طلب التاجر\n${ask}`
}

export function describeAiError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'مفتاح Claude API غير صحيح أو غير مضبوط.'
  if (e instanceof Anthropic.RateLimitError) return 'ضغط عالٍ على الخدمة، حاول بعد دقيقة.'
  if (e instanceof Anthropic.APIConnectionError) return 'تعذر الاتصال بخدمة الذكاء الاصطناعي.'
  if (e instanceof Anthropic.APIError) return `خطأ من خدمة الذكاء الاصطناعي (${e.status}).`
  if (e instanceof Error && /api key|apiKey|authentication/i.test(e.message)) return 'مفتاح Claude API غير مضبوط (NUXT_ANTHROPIC_API_KEY).'
  return 'حدث خطأ غير متوقع.'
}
