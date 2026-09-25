<script setup lang="ts">
import type { SkillCategory } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'البطاقات التسويقية · رواج' })

const cat = ref<SkillCategory | 'all'>('all')
const q = ref('')
const list = computed(() => SKILLS.filter(s =>
  (cat.value === 'all' || s.category === cat.value)
  && (!q.value || `${s.title} ${s.tagline} ${s.description}`.includes(q.value.trim())),
))
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">البطاقات التسويقية</h1>
    <p class="mt-1 text-muted">اختر بطاقة، وهي تقرأ بيانات متجرك وتطلع لك نتيجة جاهزة.</p>

    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap gap-2">
        <button class="rounded-full px-3.5 py-1.5 text-sm font-medium transition" :class="cat === 'all' ? 'bg-brand-600 text-white' : 'bg-card text-muted ring-1 ring-line hover:text-ink'" @click="cat = 'all'">الكل</button>
        <button
          v-for="(label, key) in SKILL_CATEGORIES" :key="key"
          class="rounded-full px-3.5 py-1.5 text-sm font-medium transition"
          :class="cat === key ? 'bg-brand-600 text-white' : 'bg-card text-muted ring-1 ring-line hover:text-ink'"
          @click="cat = key"
        >{{ label }}</button>
      </div>
      <div class="relative sm:w-64">
        <AppIcon name="Search" :size="16" class="absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
        <input v-model="q" class="input pr-9" placeholder="ابحث في البطاقات">
      </div>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SkillCard v-for="s in list" :key="s.slug" :skill="s" />
    </div>
    <p v-if="!list.length" class="mt-10 text-center text-muted">ما فيه بطاقات مطابقة.</p>
  </div>
</template>
