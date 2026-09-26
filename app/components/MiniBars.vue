<script setup lang="ts">
const props = withDefaults(defineProps<{ data: { hour: string; value: number }[]; color?: string; unit?: string }>(), { color: 'bg-brand-500', unit: '' })
const max = computed(() => Math.max(1, ...props.data.map(d => d.value)))
const hover = ref<number | null>(null)
const label = (h: string) => `${h.slice(11, 13)}:00`
</script>

<template>
  <div>
    <div class="flex h-24 items-end gap-0.5" dir="ltr" @mouseleave="hover = null">
      <div v-for="(d, i) in data" :key="d.hour" class="relative flex h-full flex-1 items-end" @mouseenter="hover = i">
        <div class="w-full rounded-t transition-opacity" :class="[color, hover === i ? 'opacity-100' : 'opacity-60']" :style="{ height: `${d.value ? Math.max(4, (d.value / max) * 100) : 2}%` }" />
        <div v-if="hover === i" class="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white">
          {{ label(d.hour) }} · {{ d.value }}{{ unit }}
        </div>
      </div>
    </div>
    <div class="mt-1 flex justify-between text-[10px] text-muted" dir="ltr">
      <span>{{ data[0] && label(data[0].hour) }}</span><span>{{ data.at(-1) && label(data.at(-1)!.hour) }}</span>
    </div>
  </div>
</template>
