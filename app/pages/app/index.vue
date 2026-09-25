<script setup lang="ts">
import type { StoreOverview } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'الرئيسية · رواج' })

const { data: ov, pending, error } = await useFetch<StoreOverview>('/api/store/overview')
const { data: runs } = await useFetch<{ id: string; title: string; skill: string; createdAt: string; preview: string }[]>('/api/runs')

const quick = ['store-audit', 'abandoned-carts', 'offers', 'product-copy'].map(s => getSkill(s)!)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">هلا والله 👋</h1>
        <p class="mt-1 text-muted">هذي نظرة سريعة على متجرك خلال آخر ٣٠ يوم.</p>
      </div>
      <NuxtLink to="/app/assistant" class="btn-primary"><AppIcon name="Bot" :size="18" /> اسأل مساعد رواج</NuxtLink>
    </div>

    <div v-if="error" class="card mt-6 p-6 text-rose-600">تعذر تحميل بيانات المتجر: {{ errMsg(error) }}</div>

    <template v-else-if="ov">
      <div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="المبيعات" :value="sar(ov.kpis.revenue30d)" icon="Wallet" :hint="`${num(ov.kpis.orders30d)} طلب`" />
        <StatCard label="متوسط الطلب" :value="sar(ov.kpis.aov30d)" icon="Receipt" tone="bg-teal-50 text-teal-700" />
        <StatCard label="السلات المتروكة" :value="num(ov.kpis.abandonedCarts)" icon="ShoppingCart" tone="bg-amber-50 text-amber-700" :hint="`بقيمة ${sar(ov.kpis.abandonedValue)}`" />
        <StatCard label="متوسط التقييم" :value="ov.kpis.avgRating ? `${num(ov.kpis.avgRating)} من ٥` : '—'" icon="Star" tone="bg-rose-50 text-rose-700" :hint="`${num(ov.kpis.productsCount)} منتج · ${num(ov.kpis.outOfStock)} نافد`" />
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <div class="card p-5 lg:col-span-2">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="font-bold">المبيعات اليومية</h2>
            <span class="text-xs text-muted">آخر ٣٠ يوم</span>
          </div>
          <SalesChart :data="ov.salesByDay" />
        </div>
        <div class="card p-5">
          <h2 class="mb-4 font-bold">الأكثر مبيعًا</h2>
          <ol class="space-y-3">
            <li v-for="(p, i) in ov.topProducts" :key="p.id" class="flex items-center gap-3">
              <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-bold text-muted">{{ num(i + 1) }}</span>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">{{ p.name }}</div>
                <div class="text-xs text-muted">{{ num(p.sold) }} قطعة</div>
              </div>
              <span class="text-sm font-semibold">{{ sar(p.revenue) }}</span>
            </li>
          </ol>
        </div>
      </div>
    </template>
    <div v-else-if="pending" class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="card h-32 animate-pulse" />
    </div>

    <div class="mt-10 flex items-center justify-between">
      <h2 class="text-lg font-bold">ابدأ من هنا</h2>
      <NuxtLink to="/app/skills" class="text-sm font-semibold text-brand-700">كل البطاقات ←</NuxtLink>
    </div>
    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SkillCard v-for="s in quick" :key="s.slug" :skill="s" />
    </div>

    <div v-if="runs?.length" class="mt-10">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold">آخر النتائج</h2>
        <NuxtLink to="/app/history" class="text-sm font-semibold text-brand-700">السجل ←</NuxtLink>
      </div>
      <div class="card mt-4 divide-y divide-line">
        <NuxtLink v-for="r in runs.slice(0, 5)" :key="r.id" :to="`/app/history/${r.id}`" class="flex items-center gap-4 p-4 hover:bg-surface">
          <div class="icon-tile size-10 rounded-xl" :class="TONES[getSkill(r.skill)?.tone ?? 'violet'].tile"><AppIcon :name="getSkill(r.skill)?.icon ?? 'Sparkles'" :size="18" /></div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold">{{ r.title }}</div>
            <div class="truncate text-xs text-muted">{{ r.preview }}</div>
          </div>
          <span class="hidden text-xs text-muted sm:block">{{ fmtDate(r.createdAt) }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
