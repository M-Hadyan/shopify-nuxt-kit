<script setup lang="ts">
import type { SkillCategory } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'المهارات التسويقية · رواج' })

const cat = ref<SkillCategory | 'all'>('all')
const q = ref('')
const list = computed(() => SKILLS.filter(s =>
  (cat.value === 'all' || s.category === cat.value)
  && (!q.value.trim() || `${s.title} ${s.tagline} ${s.slug}`.includes(q.value.trim())),
))
</script>

<template>
  <div>
    <section class="card-hero p-5 sm:p-7">
      <span class="chip py-1.5 text-sm"><AppIcon name="Sparkles" :size="15" /> {{ num(SKILLS.length) }} مهارة تسويقية</span>
      <h1 class="mt-4 text-3xl font-extrabold sm:text-4xl">وش تبي تسوّق اليوم؟</h1>
      <p class="mt-3 max-w-2xl text-lg leading-8 text-muted">اختر مهارة، اكتب طلبك، ورواج يشتغل عليه ببيانات متجرك في سلة.</p>
      <div class="relative mt-5 max-w-md">
        <AppIcon name="Search" :size="18" class="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
        <input v-model="q" class="input py-3 pr-11" placeholder="ابحث عن مهارة…">
      </div>
    </section>

    <div class="mt-5 flex gap-2 overflow-x-auto pb-1">
      <button class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition" :class="cat === 'all' ? 'bg-brand-600 text-white' : 'bg-card text-muted ring-1 ring-line hover:text-ink'" @click="cat = 'all'">الكل</button>
      <button
        v-for="(label, key) in SKILL_CATEGORIES" :key="key"
        class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
        :class="cat === key ? 'bg-brand-600 text-white' : 'bg-card text-muted ring-1 ring-line hover:text-ink'"
        @click="cat = key"
      >{{ label }}</button>
    </div>

    <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SkillCard v-for="s in list" :key="s.slug" :skill="s" />
    </div>
    <p v-if="!list.length" class="mt-10 text-center text-muted">ما فيه مهارات مطابقة.</p>
  </div>
</template>
