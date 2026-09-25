import type { SkillCategory, SkillDef } from '../types'

// نفس تصنيفات ريبو marketingskills
export const SKILL_CATEGORIES: Record<SkillCategory, string> = {
  conversion: 'رفع التحويل',
  content: 'المحتوى والكتابة',
  seo: 'SEO والظهور',
  paid: 'الإعلانات والانتشار',
  measurement: 'القياس والاختبار',
  retention: 'الاحتفاظ بالعملاء',
  growth: 'هندسة النمو',
  strategy: 'الاستراتيجية والتسعير',
  sales: 'المبيعات',
}

type Row = [slug: string, title: string, tagline: string, icon: string, tone: SkillDef['tone'], category: SkillCategory]

// كل مهارات ريبو marketingskills — كل مهارة بطاقة
const ROWS: Row[] = [
  ['cro', 'رفع معدل التحويل', 'حوّل زوار صفحاتك لمشترين', 'MousePointerClick', 'emerald', 'conversion'],
  ['signup', 'تحسين التسجيل', 'خطوات تسجيل أسهل وأقصر', 'UserPlus', 'emerald', 'conversion'],
  ['onboarding', 'تجربة العميل الجديد', 'أول تجربة تخليه يرجع', 'DoorOpen', 'emerald', 'conversion'],
  ['popups', 'النوافذ المنبثقة', 'نوافذ وعروض ما تزعج وتجيب نتيجة', 'PanelTop', 'emerald', 'conversion'],
  ['paywalls', 'شاشات الترقية', 'لحظات الترقية داخل المنتج', 'Lock', 'emerald', 'conversion'],

  ['copywriting', 'كتابة النصوص التسويقية', 'نصوص صفحات تقنع وتبيع', 'PenLine', 'teal', 'content'],
  ['copy-editing', 'تدقيق وتحسين النصوص', 'صقل نصوصك الحالية', 'SpellCheck', 'teal', 'content'],
  ['cold-email', 'الإيميلات الباردة', 'رسائل تواصل مع عملاء وشركات جديدة', 'MailOpen', 'teal', 'content'],
  ['emails', 'رسائل الإيميل التلقائية', 'تسلسلات ترحيب وإعادة شراء', 'Mail', 'teal', 'content'],
  ['sms', 'رسائل SMS', 'رسائل قصيرة تجيب نتيجة', 'MessageSquare', 'teal', 'content'],
  ['social', 'محتوى السوشال ميديا', 'خطة ومحتوى جاهز لمنصاتك', 'Share2', 'teal', 'content'],
  ['content-strategy', 'استراتيجية المحتوى', 'وش تكتب ولمين ومتى', 'Newspaper', 'teal', 'content'],
  ['video', 'الفيديو التسويقي', 'سكربتات وأفكار فيديو قصير', 'Film', 'teal', 'content'],
  ['image', 'الصور والتصاميم', 'أفكار وبرومبتات صور تسويقية', 'Image', 'teal', 'content'],

  ['seo-audit', 'تدقيق SEO', 'وش يمنع قوقل يلقاك', 'Search', 'sky', 'seo'],
  ['ai-seo', 'الظهور في الذكاء الاصطناعي', 'خلّ ChatGPT وغيره يرشحونك', 'Bot', 'sky', 'seo'],
  ['programmatic-seo', 'صفحات SEO بالجملة', 'صفحات كثيرة تجيب زيارات', 'Layers', 'sky', 'seo'],
  ['site-architecture', 'هيكلة الموقع', 'التصنيفات والروابط والتنقل', 'Network', 'sky', 'seo'],
  ['competitors', 'صفحات المقارنة والبدائل', 'قارن نفسك بالمنافسين بذكاء', 'Scale', 'sky', 'seo'],
  ['schema', 'البيانات المنظمة', 'Schema تبرز منتجاتك في البحث', 'Code', 'sky', 'seo'],
  ['aso', 'تحسين متجر التطبيقات', 'ظهور تطبيقك في App Store وقوقل بلاي', 'Smartphone', 'sky', 'seo'],
  ['directory-submissions', 'الأدلة والمنصات', 'وين تسجّل متجرك عشان ينعرف', 'FolderPlus', 'sky', 'seo'],

  ['ads', 'الحملات الإعلانية', 'حملات قوقل وميتا وسناب وتيك توك', 'Megaphone', 'orange', 'paid'],
  ['ad-creative', 'تصاميم ونصوص الإعلانات', 'دفعة إعلانات بزوايا مختلفة', 'Target', 'orange', 'paid'],
  ['influencer-marketing', 'التسويق بالمؤثرين', 'مؤثر مناسب بميزانية منطقية', 'Star', 'orange', 'paid'],
  ['public-relations', 'العلاقات العامة', 'خلّ الإعلام يكتب عنك', 'Mic', 'orange', 'paid'],
  ['events', 'الفعاليات والرعايات', 'فعاليات وبوثات ورعايات', 'Ticket', 'orange', 'paid'],

  ['analytics', 'التتبع والتحليلات', 'إعداد تتبع الأحداث والتحويلات', 'ChartLine', 'violet', 'measurement'],
  ['ab-testing', 'اختبارات A/B', 'جرّب وشوف وش يبيع أكثر', 'FlaskConical', 'violet', 'measurement'],
  ['attribution', 'إسناد المبيعات', 'أي قناة جابت المبيعة فعلًا', 'Waypoints', 'violet', 'measurement'],

  ['churn-prevention', 'منع فقدان العملاء', 'رجّع العملاء قبل ما يروحون', 'UserMinus', 'rose', 'retention'],

  ['referrals', 'الإحالة والتسويق بالعمولة', 'عملاؤك يجيبون عملاء', 'Gift', 'amber', 'growth'],
  ['co-marketing', 'التسويق المشترك', 'شراكات مع علامات تكملك', 'Handshake', 'amber', 'growth'],
  ['community-marketing', 'تسويق المجتمع', 'ابنِ مجتمع حول علامتك', 'UsersRound', 'amber', 'growth'],
  ['free-tools', 'الأدوات المجانية', 'أدوات وحاسبات تجذب عملاء', 'Wrench', 'amber', 'growth'],
  ['lead-magnets', 'المحتوى الجاذب', 'محتوى مجاني يجمع لك عملاء', 'Magnet', 'amber', 'growth'],
  ['marketing-loops', 'حلقات النمو', 'نمو يغذي نفسه', 'Repeat', 'amber', 'growth'],

  ['product-marketing', 'هوية المنتج وتموضعه', 'رسالتك وجمهورك وميزتك', 'Landmark', 'indigo', 'strategy'],
  ['marketing-plan', 'خطة التسويق', 'خارطة طريق واضحة', 'Map', 'indigo', 'strategy'],
  ['marketing-ideas', 'أفكار تسويقية', 'أفكار جاهزة للتنفيذ', 'Lightbulb', 'indigo', 'strategy'],
  ['marketing-psychology', 'علم نفس التسويق', 'محفزات الشراء عند العميل', 'Brain', 'indigo', 'strategy'],
  ['marketing-council', 'مجلس خبراء التسويق', 'آراء عدة خبراء في قرار واحد', 'Presentation', 'indigo', 'strategy'],
  ['customer-research', 'أبحاث العملاء', 'افهم وش يبي عميلك', 'ClipboardList', 'indigo', 'strategy'],
  ['competitor-profiling', 'تحليل المنافسين', 'ملف كامل عن منافسك', 'Swords', 'indigo', 'strategy'],
  ['launch', 'إطلاق منتج', 'خطة إطلاق تصنع ضجة', 'Rocket', 'indigo', 'strategy'],
  ['offers', 'صناعة العروض', 'عروض ما تنرفض', 'BadgePercent', 'indigo', 'strategy'],
  ['pricing', 'التسعير والباقات', 'سعر يبيع ويربح', 'Tag', 'indigo', 'strategy'],

  ['prospecting', 'البحث عن عملاء محتملين', 'وين تلقى عملاءك الجدد', 'Radar', 'sky', 'sales'],
  ['sales-enablement', 'أدوات المبيعات', 'عروض تقديمية وردود على الاعتراضات', 'Presentation', 'sky', 'sales'],
  ['revops', 'عمليات الإيرادات', 'تنظيم رحلة العميل من أول تواصل للبيع', 'Settings2', 'sky', 'sales'],
]

export const SKILLS: SkillDef[] = ROWS.map(([slug, title, tagline, icon, tone, category]) => ({ slug, title, tagline, icon, tone, category }))

// المهارات الاستراتيجية الثقيلة: تحليل وتخطيط يستفيد من أقوى نموذج
export const HEAVY_SKILLS = new Set([
  'marketing-plan', 'marketing-council', 'product-marketing', 'competitor-profiling', 'customer-research',
  'pricing', 'launch', 'offers', 'content-strategy', 'seo-audit', 'ai-seo', 'site-architecture',
  'programmatic-seo', 'attribution', 'analytics', 'churn-prevention', 'marketing-loops', 'revops',
])

export function getSkill(slug: string): SkillDef | undefined {
  return SKILLS.find(s => s.slug === slug)
}
