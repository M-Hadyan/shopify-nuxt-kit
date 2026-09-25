<script setup lang="ts">
defineProps<{ current?: string }>()
const config = useRuntimeConfig()
const yearly = ref(false)
</script>

<template>
  <div>
    <div class="flex flex-col items-center gap-3">
      <div class="segmented">
        <button class="rounded-xl px-6 py-2.5 text-sm font-bold transition" :class="!yearly ? 'bg-brand-900/80 text-white' : 'text-muted hover:text-ink'" @click="yearly = false">شهري</button>
        <button class="rounded-xl px-6 py-2.5 text-sm font-bold transition" :class="yearly ? 'bg-brand-900/80 text-white' : 'text-muted hover:text-ink'" @click="yearly = true">سنوي <span class="text-brand-400">(شهرين مجانًا)</span></button>
      </div>
      <p class="text-sm text-muted">كل الباقات تبدأ بتجربة مجانية {{ num(TRIAL_DAYS) }} أيام على باقة نمو ({{ num(TRIAL_RUNS) }} تشغيل)</p>
    </div>

    <div class="mt-8 grid gap-5 md:grid-cols-3">
      <div
        v-for="p in PLANS" :key="p.id"
        class="relative flex flex-col p-6"
        :class="p.highlighted ? 'card-hero border-brand-500/60 ring-4 ring-brand-500/15' : 'card'"
      >
        <span v-if="p.highlighted" class="absolute -top-3.5 right-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">الأكثر طلبًا</span>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-extrabold">{{ p.name }}</h3>
          <span v-if="current === p.id" class="badge-gold py-1 text-xs"><AppIcon name="Crown" :size="14" /> باقتك</span>
        </div>
        <p class="mt-1 text-sm text-muted">{{ p.tagline }}</p>
        <div class="mt-5 flex items-baseline gap-1.5">
          <span class="text-4xl font-extrabold text-brand-400">{{ num(yearly ? p.yearlyPrice : p.price) }}</span>
          <span class="text-sm text-muted">ر.س / {{ yearly ? 'سنويًا' : 'شهريًا' }}</span>
        </div>
        <ul class="mt-6 flex-1 space-y-3 text-sm">
          <li v-for="f in p.features" :key="f" class="flex items-start gap-2">
            <AppIcon name="CircleCheck" :size="18" class="mt-0.5 shrink-0 text-brand-400" /> {{ f }}
          </li>
        </ul>
        <a :href="config.public.sallaAppStoreUrl" target="_blank" rel="noopener" class="mt-7 rounded-2xl py-3" :class="p.highlighted ? 'btn-primary' : 'btn-outline-brand'">
          {{ current === p.id ? 'إدارة الاشتراك' : 'اشترك من سلة' }}
        </a>
      </div>
    </div>
  </div>
</template>
