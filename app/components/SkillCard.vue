<script setup lang="ts">
import type { SkillDef } from '#shared/types'

const props = defineProps<{ skill: SkillDef; to?: string }>()
const tone = computed(() => TONES[props.skill.tone])
</script>

<template>
  <NuxtLink :to="to ?? `/app/skills/${skill.slug}`" class="card card-hover group relative flex flex-col overflow-hidden p-5">
    <div class="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full blur-2xl transition group-hover:scale-125" :class="tone.glow" />
    <div class="relative flex items-start gap-3.5">
      <div class="icon-tile" :class="tone.tile"><AppIcon :name="skill.icon" :size="22" /></div>
      <div class="min-w-0">
        <h3 class="font-bold text-ink">{{ skill.title }}</h3>
        <p class="mt-0.5 text-sm text-brand-700">{{ skill.tagline }}</p>
      </div>
    </div>
    <p class="relative mt-3 line-clamp-2 text-sm leading-6 text-muted">{{ skill.description }}</p>
    <div class="relative mt-4 flex items-center justify-between pt-1">
      <span class="text-xs text-muted">{{ SKILL_CATEGORIES[skill.category] }}</span>
      <span class="flex items-center gap-1 text-sm font-semibold text-brand-700 opacity-80 transition group-hover:gap-2 group-hover:opacity-100">
        شغّل <AppIcon name="ArrowLeft" :size="16" />
      </span>
    </div>
  </NuxtLink>
</template>
