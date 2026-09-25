<script setup lang="ts">
const props = defineProps<{ data: { date: string; total: number }[]; monthly?: boolean }>()
const max = computed(() => Math.max(1, ...props.data.map(d => d.total)))
const hover = ref<number | null>(null)
const label = (d: string) => new Intl.DateTimeFormat('ar-SA', props.monthly ? { month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }).format(new Date(props.monthly ? `${d}-01` : d))
</script>

<template>
  <div>
    <div class="flex h-44 items-end gap-1" dir="ltr" @mouseleave="hover = null">
      <div
        v-for="(d, i) in data" :key="d.date"
        class="group relative flex h-full flex-1 items-end"
        @mouseenter="hover = i"
      >
        <div
          class="w-full rounded-t-lg transition-colors"
          :class="hover === i ? 'bg-brand-400' : 'bg-brand-600/60'"
          :style="{ height: `${Math.max(2, (d.total / max) * 100)}%` }"
        />
        <div v-if="hover === i" class="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2.5 py-1.5 text-xs text-white shadow-lg" dir="rtl">
          {{ label(d.date) }} · {{ sar(d.total) }}
        </div>
      </div>
    </div>
    <div class="mt-2 flex justify-between text-xs text-muted" dir="ltr">
      <span>{{ data[0] && label(data[0].date) }}</span>
      <span>{{ data.at(-1) && label(data.at(-1)!.date) }}</span>
    </div>
  </div>
</template>
