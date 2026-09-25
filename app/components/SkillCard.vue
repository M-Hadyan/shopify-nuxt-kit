<script setup lang="ts">
import type { SkillDef } from '#shared/types'

const props = defineProps<{ skill: SkillDef; lockedTo?: string }>()
const tone = computed(() => TONES[props.skill.tone])
</script>

<template>
  <NuxtLink :to="`/app/skills/${skill.slug}`" class="card card-hover group relative flex flex-col overflow-hidden p-5" :class="lockedTo && 'opacity-70'">
    <div class="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full blur-2xl transition group-hover:scale-125" :class="tone.glow" />
    <div class="relative flex items-start gap-3.5">
      <div class="icon-tile" :class="tone.tile"><AppIcon :name="skill.icon" :size="22" /></div>
      <div class="min-w-0">
        <h3 class="font-bold text-ink">{{ skill.title }}</h3>
        <p class="mt-1 text-sm leading-6 text-muted">{{ skill.tagline }}</p>
      </div>
    </div>
    <div class="relative mt-auto flex items-center justify-between pt-4">
      <span class="text-xs text-muted">{{ SKILL_CATEGORIES[skill.category] }}</span>
      <span v-if="lockedTo" class="inline-flex items-center gap-1 rounded-full border border-gold-500/60 px-2.5 py-1 text-xs font-bold text-gold-300">
        <AppIcon name="Crown" :size="13" /> {{ lockedTo }}
      </span>
      <span v-else class="flex items-center gap-1 text-sm font-semibold text-brand-400 opacity-80 transition group-hover:gap-2 group-hover:opacity-100">
        شغّل <AppIcon name="ArrowLeft" :size="16" />
      </span>
    </div>
  </NuxtLink>
</template>
