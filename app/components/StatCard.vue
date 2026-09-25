<script setup lang="ts">
defineProps<{ label: string; value: string; icon: string; hint?: string; tone?: string }>()
</script>

<template>
  <div class="card p-5">
    <div class="flex items-center justify-between">
      <span class="text-sm text-muted">{{ label }}</span>
      <span class="icon-tile size-9 rounded-xl" :class="tone ?? 'bg-brand-50 text-brand-700'"><AppIcon :name="icon" :size="18" /></span>
    </div>
    <div class="mt-3 text-xl font-bold tracking-tight sm:text-2xl">{{ value }}</div>
    <div v-if="hint" class="mt-1 text-xs text-muted">{{ hint }}</div>
  </div>
</template>
