<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const skill = getSkill(String(route.params.slug))
if (!skill) throw createError({ statusCode: 404, statusMessage: 'المهارة غير موجودة', fatal: true })
useHead({ title: `${skill.title} · رواج` })

const tone = TONES[skill.tone]
const request = ref('')
const output = ref('')
const running = ref(false)
const error = ref('')
const { refresh: refreshMe } = useMe()

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
    <NuxtLink to="/app" class="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
      <AppIcon name="ArrowLeft" :size="16" class="rotate-180" /> المهارات
    </NuxtLink>

    <div class="mt-4 grid gap-6 lg:grid-cols-[22rem_1fr]">
      <!-- لوحة الإعداد -->
      <aside class="card-hero h-fit p-5 lg:sticky lg:top-40">
        <div class="flex items-start gap-3.5">
          <div class="icon-tile size-12" :class="tone.tile"><AppIcon :name="skill.icon" :size="24" /></div>
          <div>
            <h1 class="text-lg font-bold">{{ skill.title }}</h1>
            <p class="text-sm text-brand-400">{{ skill.tagline }}</p>
          </div>
        </div>
        
        <form class="mt-5 space-y-4" @submit.prevent="run">
          <div>
            <label class="label" for="req">وش تبي بالضبط؟</label>
            <textarea id="req" v-model="request" class="input min-h-36" placeholder="مثال: أبي خطة لليوم الوطني تركز على بكجات الهدايا. (اختياري، لو تركته فاضي يطلع لك أهم التوصيات)" />
          </div>
          <button class="btn-primary w-full py-3" :disabled="running">
            <AppIcon :name="running ? 'Loader' : 'WandSparkles'" :spin="running" :size="18" />
            {{ running ? 'رواج يشتغل…' : output ? 'شغّل مرة ثانية' : 'شغّل المهارة' }}
          </button>
        </form>

        <p class="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
          <AppIcon name="Store" :size="14" /> يقرأ ملخص متجرك في سلة تلقائيًا
        </p>
      </aside>

      <!-- الناتج -->
      <section class="card min-h-[28rem] p-6">
        <div v-if="error" class="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">{{ error }}</div>
        <div v-else-if="!output && !running" class="flex h-full min-h-[24rem] flex-col items-center justify-center text-center">
          <div class="icon-tile size-16 rounded-3xl" :class="tone.tile"><AppIcon :name="skill.icon" :size="30" /></div>
          <h2 class="mt-4 font-bold">جاهز نشتغل</h2>
          <p class="mt-1 max-w-sm text-sm text-muted">اكتب طلبك (لو تبي) واضغط «شغّل المهارة». النتيجة تطلع لك هنا.</p>
        </div>
        <template v-else>
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <div class="flex items-center gap-2 text-sm text-muted">
              <AppIcon v-if="running" name="Loader" spin :size="16" class="text-brand-400" />
              <AppIcon v-else name="CircleCheck" :size="16" class="text-emerald-300" />
              {{ running ? 'جاري الكتابة…' : 'اكتملت النتيجة وانحفظت في السجل' }}
            </div>
            <div v-if="!running" class="flex gap-2">
              <CopyButton :text="output" />
              <button class="btn-secondary" @click="download"><AppIcon name="Download" :size="16" /> تحميل</button>
            </div>
          </div>
          <MarkdownView :source="output" />
          <span v-if="running" class="inline-block h-5 w-2 animate-pulse rounded-sm bg-brand-500 align-middle" />
        </template>
      </section>
    </div>
  </div>
</template>
