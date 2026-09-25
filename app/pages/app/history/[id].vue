<script setup lang="ts">
import type { RunRecord } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const { data: run, error } = await useFetch<RunRecord>(`/api/runs/${route.params.id}`)
useHead({ title: () => `${run.value?.title ?? 'نتيجة'} · رواج` })
const skill = computed(() => run.value && getSkill(run.value.skill))
</script>

<template>
  <div>
    <NuxtLink to="/app/history" class="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
      <AppIcon name="ArrowLeft" :size="16" class="rotate-180" /> السجل
    </NuxtLink>
    <div v-if="error" class="card mt-4 p-6 text-rose-600">{{ errMsg(error) }}</div>
    <div v-else-if="run" class="card mt-4 p-6">
      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div class="flex items-center gap-3">
          <div class="icon-tile" :class="TONES[skill?.tone ?? 'violet'].tile"><AppIcon :name="skill?.icon ?? 'Sparkles'" /></div>
          <div>
            <h1 class="text-lg font-bold">{{ run.title }}</h1>
            <div class="text-xs text-muted">{{ fmtDate(run.createdAt) }}</div>
          </div>
        </div>
        <div class="flex gap-2">
          <CopyButton :text="run.output" />
          <NuxtLink v-if="skill" :to="`/app/skills/${skill.slug}`" class="btn-primary"><AppIcon name="RefreshCw" :size="16" /> شغّل من جديد</NuxtLink>
        </div>
      </div>
      <div v-if="Object.values(run.inputs).some(Boolean)" class="mt-4 flex flex-wrap gap-2">
        <span v-for="(v, k) in run.inputs" v-show="v" :key="k" class="chip bg-surface text-muted">{{ skill?.inputs.find(i => i.key === k)?.label ?? k }}: {{ v }}</span>
      </div>
      <MarkdownView :source="run.output" class="mt-6" />
    </div>
  </div>
</template>
