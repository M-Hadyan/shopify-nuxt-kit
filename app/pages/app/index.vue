<script setup lang="ts">
import type { SkillCategory } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'مركز التسويق · رواج' })

const cat = ref<SkillCategory | 'all'>('all')
const q = ref('')
const list = computed(() => SKILLS.filter(s =>
  (cat.value === 'all' || s.category === cat.value)
  && (!q.value.trim() || `${s.title} ${s.tagline} ${s.slug}`.includes(q.value.trim())),
))
const catCount = Object.keys(SKILL_CATEGORIES).length
const { data: me } = await useMe()
const lockedTo = (c: SkillCategory) => (me.value && !planAllows(me.value.plan, c) ? planFor(c).name : undefined)
const available = computed(() => (me.value ? SKILLS.filter(s => planAllows(me.value!.plan, s.category)).length : SKILLS.length))
</script>

<template>
  <div class="space-y-5">
    <!-- مركز القيادة -->
    <section class="card-hero p-5 sm:p-7">
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-brand-700/60 bg-brand-900/40 px-3.5 py-1.5 text-sm font-bold text-brand-300">
          <AppIcon name="Sparkles" :size="16" /> رؤية مباشرة
        </span>
        <span class="text-sm font-bold text-brand-400">مساحة التسويق لمتجرك</span>
      </div>
      <h1 class="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl">مركز قيادة التسويق</h1>
      <p class="mt-3 text-lg leading-8 text-muted">اختر مهارة تسويقية، اكتب طلبك، ورواج يطبّقها على بيانات متجرك في سلة.</p>

      <div class="panel mt-6 p-6">
        <div class="text-muted">المهارات المتاحة</div>
        <div class="mt-2 text-6xl font-extrabold tracking-tight text-brand-500" dir="ltr" style="text-align: right">{{ available }}<span v-if="available < SKILLS.length" class="text-3xl text-muted"> / {{ SKILLS.length }}</span></div>
        <div class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white">
          {{ num(catCount) }} تصنيفات <AppIcon name="ArrowUpLeft" :size="16" />
        </div>
      </div>
    </section>

    <!-- التصنيف والبحث -->
    <section class="card p-5">
      <div class="flex items-center gap-2 font-bold text-brand-400"><AppIcon name="LayoutGrid" :size="20" /> التصنيف</div>
      <div class="segmented mt-4 overflow-x-auto [scrollbar-width:none] lg:flex-wrap">
        <button class="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap transition" :class="cat === 'all' ? 'bg-brand-900/80 text-white' : 'text-muted hover:text-ink'" @click="cat = 'all'">الكل</button>
        <button
          v-for="(label, key) in SKILL_CATEGORIES" :key="key"
          class="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap transition"
          :class="cat === key ? 'bg-brand-900/80 text-white' : 'text-muted hover:text-ink'"
          @click="cat = key"
        >{{ label }}</button>
      </div>
      <label class="mt-3 block rounded-2xl border border-line px-5 py-3">
        <span class="block text-sm text-muted">ابحث عن مهارة</span>
        <input v-model="q" class="mt-1 w-full bg-transparent text-lg font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted/50" placeholder="مثال: إعلانات، SEO، تسعير">
      </label>
    </section>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SkillCard v-for="s in list" :key="s.slug" :skill="s" :locked-to="lockedTo(s.category)" />
    </div>
    <p v-if="!list.length" class="py-10 text-center text-muted">ما فيه مهارات مطابقة.</p>
  </div>
</template>
