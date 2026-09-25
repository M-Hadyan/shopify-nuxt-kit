<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const skill = getSkill(String(route.params.slug))
if (!skill) throw createError({ statusCode: 404, statusMessage: 'المهارة غير موجودة', fatal: true })
useHead({ title: `${skill.title} · رواج` })

const request = ref('')
const output = ref('')
const running = ref(false)
const error = ref('')
const { data: me, refresh: refreshMe } = useMe()
const upgradeTo = computed(() => (me.value && !planAllows(me.value.plan, skill.category) ? planFor(skill.category) : null))
const config = useRuntimeConfig()

async function run() {
  running.value = true
  error.value = ''
  output.value = ''
  try {
    const res = await fetch(`/api/skills/${skill!.slug}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request: request.value }),
    })
    if (!res.ok || !res.body) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.statusMessage || j.message || 'تعذر التشغيل')
    }
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

function printPdf() {
  window.print()
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
  <div v-if="skill" class="space-y-5">
    <NuxtLink to="/app" class="inline-flex items-center gap-1 text-sm text-muted hover:text-ink print:hidden">
      <AppIcon name="ArrowLeft" :size="16" class="rotate-180" /> المهارات
    </NuxtLink>

    <!-- رأس المهارة -->
    <section class="card-hero p-5 sm:p-7 print:hidden">
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-brand-700/60 bg-brand-900/40 px-3.5 py-1.5 text-sm font-bold text-brand-300">
          <AppIcon :name="skill.icon" :size="16" /> {{ SKILL_CATEGORIES[skill.category] }}
        </span>
        <span class="text-sm font-bold text-brand-400">مهارة تسويقية</span>
      </div>
      <h1 class="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl">{{ skill.title }}</h1>
      <p class="mt-3 text-lg leading-8 text-muted">{{ skill.tagline }}، مبنية على بيانات متجرك في سلة.</p>

      <div v-if="upgradeTo" class="panel mt-6 p-6">
        <div class="flex items-center gap-2 font-bold text-gold-300"><AppIcon name="Crown" :size="20" /> متاحة في باقة {{ upgradeTo.name }}</div>
        <p class="mt-2 leading-7 text-muted">باقتك الحالية ({{ me?.plan.name }}) ما تشمل هذي المهارة. رقّ باقتك من متجر تطبيقات سلة وتنفتح لك فورًا.</p>
        <a :href="config.public.sallaAppStoreUrl" target="_blank" rel="noopener" class="btn-primary mt-4 w-full rounded-2xl py-3.5 text-base">رقّ إلى {{ upgradeTo.name }} · {{ num(upgradeTo.price) }} ر.س شهريًا</a>
      </div>
      <form v-else class="panel mt-6 p-5" @submit.prevent="run">
        <label class="block text-muted" for="req">وش تبي بالضبط؟</label>
        <textarea
          id="req" v-model="request" rows="4"
          class="mt-2 w-full resize-none bg-transparent text-lg leading-8 text-ink outline-none placeholder:text-muted/50"
          placeholder="مثال: أبي خطة لليوم الوطني تركز على بكجات الهدايا (اختياري)"
        />
        <button class="btn-primary mt-3 w-full rounded-2xl py-3.5 text-base" :disabled="running">
          <AppIcon :name="running ? 'Loader' : 'WandSparkles'" :spin="running" :size="19" />
          {{ running ? 'رواج يشتغل…' : output ? 'شغّل مرة ثانية' : 'شغّل المهارة' }}
        </button>
      </form>
    </section>

    <!-- النتيجة -->
    <section v-if="output || running || error" id="result" class="card p-5 sm:p-7 print:border-0 print:bg-white print:p-0 print:shadow-none">
      <div class="flex items-center gap-2 font-bold text-brand-400 print:hidden">
        <AppIcon :name="running ? 'Loader' : 'FileText'" :spin="running" :size="20" />
        {{ running ? 'جاري الكتابة…' : 'النتيجة' }}
      </div>
      <div v-if="error" class="mt-4 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">{{ error }}</div>

      <div v-if="!running && output" class="mt-4 grid grid-cols-3 gap-2 print:hidden">
        <button class="btn-file" @click="printPdf"><AppIcon name="FileText" :size="19" /> PDF</button>
        <button class="btn-file" @click="download"><AppIcon name="Download" :size="19" /> Markdown</button>
        <CopyButton :text="output" />
      </div>

      <div v-if="output" class="panel mt-4 p-5 print:border-0 print:bg-white print:p-0">
        <MarkdownView :source="output" />
        <span v-if="running" class="inline-block h-5 w-2 animate-pulse rounded-sm bg-brand-500 align-middle" />
      </div>
    </section>

    <NuxtLink v-if="!running && output" to="/app/history" class="btn-outline-brand w-full print:hidden">
      <AppIcon name="Sparkles" :size="19" /> عرض كل النتائج في السجل
    </NuxtLink>
  </div>
</template>
