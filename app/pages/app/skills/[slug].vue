<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const skill = getSkill(String(route.params.slug))
if (!skill) throw createError({ statusCode: 404, statusMessage: 'البطاقة غير موجودة', fatal: true })
useHead({ title: `${skill.title} · رواج` })

const tone = TONES[skill.tone]
const inputs = reactive<Record<string, string>>(Object.fromEntries(skill.inputs.map(i => [i.key, i.options?.[0] && i.required ? i.options[0] : ''])))
const output = ref('')
const running = ref(false)
const error = ref('')
const runId = ref('')
const { refresh: refreshMe } = useMe()

async function run() {
  running.value = true
  error.value = ''
  output.value = ''
  runId.value = ''
  try {
    const res = await fetch(`/api/skills/${skill!.slug}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs }),
    })
    if (!res.ok || !res.body) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.statusMessage || j.message || 'تعذر التشغيل')
    }
    runId.value = res.headers.get('X-Run-Id') ?? ''
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      output.value += dec.decode(value, { stream: true })
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'تعذر التشغيل'
  } finally {
    running.value = false
    refreshMe()
  }
}

function download() {
  const blob = new Blob([output.value], { type: 'text/markdown;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `rawaj-${skill!.slug}.md`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<template>
  <div v-if="skill">
    <NuxtLink to="/app/skills" class="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
      <AppIcon name="ArrowLeft" :size="16" class="rotate-180" /> البطاقات
    </NuxtLink>

    <div class="mt-4 grid gap-6 lg:grid-cols-[22rem_1fr]">
      <!-- لوحة الإعداد -->
      <aside class="card h-fit p-5 lg:sticky lg:top-6">
        <div class="flex items-start gap-3.5">
          <div class="icon-tile size-12" :class="tone.tile"><AppIcon :name="skill.icon" :size="24" /></div>
          <div>
            <h1 class="text-lg font-bold">{{ skill.title }}</h1>
            <p class="text-sm text-brand-700">{{ skill.tagline }}</p>
          </div>
        </div>
        <p class="mt-4 text-sm leading-6 text-muted">{{ skill.description }}</p>

        <form class="mt-5 space-y-4" @submit.prevent="run">
          <div v-for="i in skill.inputs" :key="i.key">
            <label class="label" :for="i.key">{{ i.label }} <span v-if="i.required" class="text-rose-500">*</span></label>
            <select v-if="i.type === 'select'" :id="i.key" v-model="inputs[i.key]" class="input" :required="i.required">
              <option v-if="!i.required" value="">— اختياري —</option>
              <option v-for="o in i.options" :key="o" :value="o">{{ o }}</option>
            </select>
            <textarea v-else-if="i.type === 'textarea'" :id="i.key" v-model="inputs[i.key]" class="input min-h-24" :placeholder="i.placeholder" :required="i.required" />
            <input v-else :id="i.key" v-model="inputs[i.key]" class="input" :placeholder="i.placeholder" :required="i.required">
          </div>
          <button class="btn-primary w-full py-3" :disabled="running">
            <AppIcon :name="running ? 'Loader' : 'WandSparkles'" :spin="running" :size="18" />
            {{ running ? 'رواج يشتغل على متجرك…' : output ? 'شغّل مرة ثانية' : 'شغّل البطاقة' }}
          </button>
        </form>

        <div class="mt-5 border-t border-line pt-4 text-xs text-muted">
          <div class="mb-2 font-medium text-ink">البيانات المستخدمة</div>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="d in skill.data" :key="d" class="chip bg-surface text-muted">{{ { store: 'المتجر', products: 'المنتجات', orders: 'الطلبات', customers: 'العملاء', carts: 'السلات المتروكة', reviews: 'التقييمات', coupons: 'الكوبونات' }[d] }}</span>
          </div>
        </div>
      </aside>

      <!-- الناتج -->
      <section class="card min-h-[28rem] p-6">
        <div v-if="error" class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{{ error }}</div>
        <div v-else-if="!output && !running" class="flex h-full min-h-[24rem] flex-col items-center justify-center text-center">
          <div class="icon-tile size-16 rounded-3xl" :class="tone.tile"><AppIcon :name="skill.icon" :size="30" /></div>
          <h2 class="mt-4 font-bold">جاهز نشتغل</h2>
          <p class="mt-1 max-w-sm text-sm text-muted">عبّ المدخلات (لو تبي) واضغط «شغّل البطاقة». بنقرأ بيانات متجرك ونطلع لك النتيجة هنا.</p>
        </div>
        <template v-else>
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <div class="flex items-center gap-2 text-sm text-muted">
              <AppIcon v-if="running" name="Loader" spin :size="16" class="text-brand-600" />
              <AppIcon v-else name="CircleCheck" :size="16" class="text-emerald-600" />
              {{ running ? 'جاري الكتابة…' : 'اكتملت النتيجة وانحفظت في السجل' }}
            </div>
            <div v-if="!running" class="flex gap-2">
              <CopyButton :text="output" />
              <button class="btn-secondary" @click="download"><AppIcon name="Download" :size="16" /> تحميل</button>
              <NuxtLink v-if="skill.slug === 'product-copy'" to="/app/products" class="btn-primary"><AppIcon name="Package" :size="16" /> طبّق على المنتجات</NuxtLink>
              <NuxtLink v-if="skill.slug === 'offers'" :to="{ path: '/app/assistant', query: { q: 'اقترح ٣ كوبونات مناسبة لمتجري بناءً على المبيعات ومتوسط السلة وجهّزها لي للتطبيق' } }" class="btn-primary"><AppIcon name="BadgePercent" :size="16" /> أنشئ الكوبونات</NuxtLink>
            </div>
          </div>
          <MarkdownView :source="output" />
          <span v-if="running" class="inline-block h-5 w-2 animate-pulse rounded-sm bg-brand-500 align-middle" />
        </template>
      </section>
    </div>
  </div>
</template>
