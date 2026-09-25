<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'السجل · رواج' })

const { data: runs, pending } = await useFetch<{ id: string; title: string; skill: string; status: string; createdAt: string; preview: string }[]>('/api/runs')
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">السجل</h1>
    <p class="mt-1 text-muted">كل النتائج اللي طلّعها رواج لمتجرك محفوظة هنا.</p>

    <div v-if="runs?.length" class="card mt-6 divide-y divide-line">
      <NuxtLink v-for="r in runs" :key="r.id" :to="`/app/history/${r.id}`" class="flex items-center gap-4 p-4 hover:bg-surface">
        <div class="icon-tile size-10 rounded-xl" :class="TONES[getSkill(r.skill)?.tone ?? 'violet'].tile"><AppIcon :name="getSkill(r.skill)?.icon ?? 'Sparkles'" :size="18" /></div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 text-sm font-semibold">
            {{ r.title }}
            <span v-if="r.status !== 'done'" class="chip bg-rose-50 text-rose-700">لم يكتمل</span>
          </div>
          <div class="truncate text-xs text-muted">{{ r.preview }}</div>
        </div>
        <span class="hidden text-xs text-muted sm:block">{{ fmtDate(r.createdAt) }}</span>
      </NuxtLink>
    </div>
    <div v-else-if="!pending" class="card mt-6 flex flex-col items-center p-12 text-center">
      <div class="icon-tile size-14 rounded-2xl bg-brand-50 text-brand-700"><AppIcon name="History" :size="26" /></div>
      <h2 class="mt-4 font-bold">ما فيه نتائج للحين</h2>
      <p class="mt-1 text-sm text-muted">شغّل أول بطاقة وبتلقى نتيجتها هنا.</p>
      <NuxtLink to="/app/skills" class="btn-primary mt-5">تصفح البطاقات</NuxtLink>
    </div>
  </div>
</template>
