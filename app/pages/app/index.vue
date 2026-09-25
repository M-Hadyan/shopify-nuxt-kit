<script setup lang="ts">
import type { StoreOverview } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'الرئيسية · رواج' })

const periods = [
  { id: 'week', label: 'أسبوعي' },
  { id: 'month', label: 'شهري' },
  { id: 'year', label: 'سنوي' },
] as const
const period = ref<(typeof periods)[number]['id']>('month')
const periodLabel = computed(() => ({ week: 'آخر ٧ أيام', month: 'آخر ٣٠ يوم', year: 'آخر ١٢ شهر' })[period.value])

const { data: ov, pending, error } = await useFetch<StoreOverview>('/api/store/overview', { query: { period } })
const { data: runs } = await useFetch<{ id: string; title: string; skill: string; createdAt: string; preview: string }[]>('/api/runs')

const quick = ['store-audit', 'abandoned-carts', 'offers', 'product-copy'].map(s => getSkill(s)!)
const change = computed(() => ov.value?.kpis.revenueChange ?? null)
</script>

<template>
  <div class="space-y-5">
    <!-- مركز القيادة -->
    <section class="card-hero p-5 sm:p-7">
      <div class="flex flex-wrap items-center gap-3">
        <span class="chip py-1.5 text-sm"><AppIcon name="Sparkles" :size="15" /> رؤية مباشرة</span>
        <span class="text-sm font-semibold text-brand-400">نظرة صاحب المتجر</span>
      </div>
      <h1 class="mt-4 text-3xl font-extrabold sm:text-4xl">مركز قيادة متجرك</h1>
      <p class="mt-3 max-w-2xl text-lg leading-8 text-muted">قراءة تسويقية لمبيعاتك وسلاتك المتروكة وآراء عملائك، وأفضل خطوة تالية لنمو متجرك.</p>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div class="panel flex flex-col justify-between p-6">
          <div class="text-muted">المبيعات · {{ periodLabel }}</div>
          <div v-if="ov" class="mt-3 text-5xl font-extrabold tracking-tight text-brand-400 sm:text-6xl" dir="ltr" style="text-align: right">
            {{ Math.round(ov.kpis.revenue).toLocaleString('en-US') }}<span class="mr-1 text-2xl text-brand-300/80">ر.س</span>
          </div>
          <div v-else class="mt-3 h-16 w-2/3 animate-pulse rounded-xl bg-surface" />
          <div class="mt-5 flex flex-wrap items-center gap-2">
            <span
              v-if="change !== null"
              class="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold"
              :class="change >= 0 ? 'bg-brand-600 text-white' : 'bg-rose-500/20 text-rose-300'"
              dir="ltr"
            >
              <AppIcon :name="change >= 0 ? 'ArrowUpLeft' : 'ArrowDownLeft'" :size="16" class="-scale-x-100" />
              {{ change > 0 ? '+' : '' }}{{ change }}%
            </span>
            <span v-if="ov" class="text-sm text-muted">{{ num(ov.kpis.orders) }} طلب · متوسط {{ sar(ov.kpis.aov) }}</span>
          </div>
        </div>

        <div class="panel p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2 font-bold text-brand-400"><AppIcon name="CalendarDays" :size="18" /> فترة التقرير</div>
            <div class="segmented w-full sm:w-auto">
              <button
                v-for="p in periods" :key="p.id"
                class="flex-1 rounded-xl px-5 py-2 text-sm font-semibold transition sm:flex-none"
                :class="period === p.id ? 'bg-brand-800/70 text-white' : 'text-muted hover:text-ink'"
                @click="period = p.id"
              >{{ p.label }}</button>
            </div>
          </div>
          <SalesChart v-if="ov" :data="ov.salesByDay" :monthly="period === 'year'" />
          <div v-else class="h-44 animate-pulse rounded-xl bg-surface" />
        </div>
      </div>
    </section>

    <div v-if="error" class="card p-6 text-rose-300">تعذر تحميل بيانات المتجر: {{ errMsg(error) }}</div>

    <div v-if="ov" class="grid grid-cols-2 gap-4 lg:grid-cols-4" :class="pending && 'opacity-60'">
      <StatCard label="السلات المتروكة" :value="num(ov.kpis.abandonedCarts)" icon="ShoppingCart" tone="bg-amber-500/15 text-amber-300" :hint="`قيمة قابلة للاسترجاع ${sar(ov.kpis.abandonedValue)}`" />
      <StatCard label="متوسط الطلب" :value="sar(ov.kpis.aov)" icon="Receipt" tone="bg-teal-500/15 text-teal-300" :hint="periodLabel" />
      <StatCard label="متوسط التقييم" :value="ov.kpis.avgRating ? `${num(ov.kpis.avgRating)} من ٥` : '—'" icon="Star" tone="bg-rose-500/15 text-rose-300" />
      <StatCard label="المنتجات" :value="num(ov.kpis.productsCount)" icon="Package" :hint="`${num(ov.kpis.outOfStock)} نافد · ${num(ov.kpis.customersCount)} عميل`" />
    </div>

    <div v-if="ov" class="grid gap-4 lg:grid-cols-3">
      <div class="card p-5 lg:col-span-2">
        <h2 class="mb-4 font-bold">الأكثر مبيعًا · {{ periodLabel }}</h2>
        <ol class="space-y-3">
          <li v-for="(p, i) in ov.topProducts" :key="p.id" class="flex items-center gap-3">
            <span class="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface text-xs font-bold text-muted">{{ num(i + 1) }}</span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">{{ p.name }}</div>
              <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                <div class="h-full rounded-full bg-brand-500" :style="{ width: `${(p.revenue / (ov.topProducts[0]?.revenue || 1)) * 100}%` }" />
              </div>
            </div>
            <span class="text-sm font-semibold">{{ sar(p.revenue) }}</span>
          </li>
        </ol>
      </div>
      <NuxtLink to="/app/skills/abandoned-carts" class="card-hero card-hover flex flex-col justify-between p-5">
        <div>
          <span class="chip"><AppIcon name="Zap" :size="14" /> الخطوة التالية</span>
          <h2 class="mt-3 text-lg font-bold">رجّع {{ sar(ov.kpis.abandonedValue) }} من السلات المتروكة</h2>
          <p class="mt-2 text-sm leading-6 text-muted">عندك {{ num(ov.kpis.abandonedCarts) }} سلة متروكة. شغّل بطاقة الاسترجاع وخذ رسائل وعروض جاهزة.</p>
        </div>
        <span class="mt-4 flex items-center gap-1 text-sm font-bold text-brand-400">شغّل البطاقة <AppIcon name="ArrowLeft" :size="16" /></span>
      </NuxtLink>
    </div>

    <div>
      <div class="mt-4 flex items-center justify-between">
        <h2 class="text-lg font-bold">ابدأ من هنا</h2>
        <NuxtLink to="/app/skills" class="text-sm font-semibold text-brand-400">كل البطاقات ←</NuxtLink>
      </div>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkillCard v-for="s in quick" :key="s.slug" :skill="s" />
      </div>
    </div>

    <div v-if="runs?.length">
      <div class="mt-4 flex items-center justify-between">
        <h2 class="text-lg font-bold">آخر النتائج</h2>
        <NuxtLink to="/app/history" class="text-sm font-semibold text-brand-400">السجل ←</NuxtLink>
      </div>
      <div class="card mt-4 divide-y divide-line">
        <NuxtLink v-for="r in runs.slice(0, 5)" :key="r.id" :to="`/app/history/${r.id}`" class="flex items-center gap-4 p-4 hover:bg-surface/50">
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
