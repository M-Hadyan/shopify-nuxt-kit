<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'المراقبة · إدارة رواج' })

interface Point { hour: string; value: number }
interface LogItem { id: string; ts: string; level: string; type: string; message: string; storeId?: string }
interface Overview {
  health: { storage: { ok: boolean; kind: string; ms: number }; anthropic: boolean; salla: boolean; alerts: boolean; demoMode: boolean; uptimeSec: number; memoryMb: number; heapMb: number; node: string; commit: string | null }
  stores: { total: number; active: number; byStatus: Record<string, number>; byPlan: Record<string, number>; demo: number }
  money: { mrrSar: number; monthAiCostSar: number; monthDemoCostSar: number; marginPct: number | null }
  last24h: { runs: number; runErrors: number; errors: number; costSar: number; rateLimited: number; security: number; requests: number }
  series: { runs: Point[]; errors: Point[]; cost: Point[]; requests: Point[] }
  topSkills: { slug: string; title: string; runs: number; costSar: number }[]
  recentProblems: LogItem[]
}

const { data, refresh, pending, error } = await useFetch<Overview>('/api/admin/overview')
const auto = ref(true)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => auto.value && refresh(), 30_000) })
onBeforeUnmount(() => clearInterval(timer))

const uptime = computed(() => {
  const s = data.value?.health.uptimeSec ?? 0
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
  return d ? `${d} يوم ${h} س` : h ? `${h} س ${m} د` : `${m} د`
})
const errorRate = computed(() => {
  const l = data.value?.last24h
  return l && l.runs + l.runErrors ? Math.round((l.runErrors / (l.runs + l.runErrors)) * 100) : 0
})
const statusLabel: Record<string, string> = { active: 'مشترك', trial: 'تجربة', expired: 'منتهي', uninstalled: 'ألغى التثبيت', suspended: 'موقوف' }
const planLabel: Record<string, string> = { starter: 'انطلاقة', growth: 'نمو', pro: 'احتراف' }
const levelCls: Record<string, string> = { error: 'bg-rose-500/15 text-rose-300', security: 'bg-amber-500/15 text-amber-300', warn: 'bg-amber-500/10 text-amber-200', info: 'bg-surface text-muted' }
</script>

<template>
  <div v-if="error" class="card p-6 text-rose-300">{{ errMsg(error) }}</div>
  <div v-else-if="data" class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold">المراقبة</h1>
        <p class="text-sm text-muted">آخر ٢٤ ساعة · يتحدث كل ٣٠ ثانية</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-2 text-sm text-muted"><input v-model="auto" type="checkbox" class="accent-brand-600"> تحديث تلقائي</label>
        <button class="btn-secondary" :disabled="pending" @click="refresh()"><AppIcon name="RefreshCw" :size="16" :spin="pending" /> تحديث</button>
      </div>
    </div>

    <!-- صحة النظام -->
    <section class="card p-5">
      <h2 class="font-bold">صحة النظام</h2>
      <div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <div v-for="c in [
          { label: 'قاعدة البيانات', ok: data.health.storage.ok, detail: `${data.health.storage.kind} · ${data.health.storage.ms}ms` },
          { label: 'Claude API', ok: data.health.anthropic, detail: data.health.anthropic ? 'مضبوط' : 'المفتاح ناقص' },
          { label: 'ربط سلة', ok: data.health.salla, detail: data.health.salla ? 'مضبوط' : 'مفاتيح ناقصة' },
          { label: 'التنبيهات', ok: data.health.alerts, detail: data.health.alerts ? 'مفعّلة' : 'غير مفعّلة' },
        ]" :key="c.label" class="panel p-3 md:col-span-1 lg:col-span-2">
          <div class="flex items-center gap-2 text-sm font-semibold">
            <span class="size-2.5 rounded-full" :class="c.ok ? 'bg-brand-400 shadow-[0_0_8px] shadow-brand-400' : 'bg-rose-400'" /> {{ c.label }}
          </div>
          <div class="mt-1 text-xs text-muted">{{ c.detail }}</div>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted" dir="ltr" style="text-align: right">
        <span>uptime {{ uptime }}</span><span>RSS {{ data.health.memoryMb }}MB</span><span>heap {{ data.health.heapMb }}MB</span><span>{{ data.health.node }}</span>
        <span v-if="data.health.commit">commit {{ data.health.commit }}</span><span>demo {{ data.health.demoMode ? 'on' : 'off' }}</span>
      </div>
    </section>

    <!-- الأرقام -->
    <section class="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <div v-for="k in [
        { label: 'تشغيلات ٢٤س', value: num(data.last24h.runs), tone: 'text-brand-400' },
        { label: 'نسبة الفشل', value: `${num(errorRate)}٪`, tone: errorRate > 5 ? 'text-rose-300' : 'text-ink' },
        { label: 'أخطاء السيرفر', value: num(data.last24h.errors), tone: data.last24h.errors ? 'text-rose-300' : 'text-ink' },
        { label: 'أحداث أمنية', value: num(data.last24h.security), tone: data.last24h.security ? 'text-amber-300' : 'text-ink' },
        { label: 'طلبات محدودة', value: num(data.last24h.rateLimited), tone: 'text-ink' },
        { label: 'تكلفة ٢٤س', value: `${data.last24h.costSar} ر.س`, tone: 'text-ink' },
      ]" :key="k.label" class="card p-4">
        <div class="text-xs text-muted">{{ k.label }}</div>
        <div class="mt-1 text-2xl font-extrabold" :class="k.tone">{{ k.value }}</div>
      </div>
    </section>

    <!-- الرسوم -->
    <section class="grid gap-4 md:grid-cols-2">
      <div class="card p-5"><h3 class="mb-3 text-sm font-bold">التشغيلات بالساعة</h3><MiniBars :data="data.series.runs" /></div>
      <div class="card p-5"><h3 class="mb-3 text-sm font-bold">الأخطاء بالساعة</h3><MiniBars :data="data.series.errors" color="bg-rose-500" /></div>
      <div class="card p-5"><h3 class="mb-3 text-sm font-bold">تكلفة الذكاء الاصطناعي (ر.س)</h3><MiniBars :data="data.series.cost" color="bg-gold-500" /></div>
      <div class="card p-5"><h3 class="mb-3 text-sm font-bold">طلبات الـ API</h3><MiniBars :data="data.series.requests" color="bg-sky-500" /></div>
    </section>

    <!-- المال والمتاجر -->
    <section class="grid gap-4 lg:grid-cols-3">
      <div class="card-hero p-5">
        <h3 class="font-bold">هذا الشهر</h3>
        <div class="mt-4 text-sm text-muted">الإيراد الشهري (MRR)</div>
        <div class="text-4xl font-extrabold text-brand-400">{{ num(data.money.mrrSar) }} <span class="text-lg">ر.س</span></div>
        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="panel p-3"><div class="text-xs text-muted">تكلفة الذكاء الاصطناعي</div><div class="font-bold">{{ data.money.monthAiCostSar }} ر.س</div></div>
          <div class="panel p-3"><div class="text-xs text-muted">الهامش</div><div class="font-bold" :class="(data.money.marginPct ?? 0) < 30 ? 'text-amber-300' : 'text-brand-400'">{{ data.money.marginPct === null ? '—' : `${data.money.marginPct}٪` }}</div></div>
          <div class="panel col-span-2 p-3"><div class="text-xs text-muted">تكلفة المتجر التجريبي</div><div class="font-bold">{{ data.money.monthDemoCostSar }} ر.س</div></div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between"><h3 class="font-bold">المتاجر</h3><NuxtLink to="/admin/stores" class="text-sm text-brand-400">عرض الكل ←</NuxtLink></div>
        <div class="mt-3 text-4xl font-extrabold">{{ num(data.stores.active) }} <span class="text-base font-normal text-muted">نشط من {{ num(data.stores.total) }}</span></div>
        <div class="mt-4 space-y-2 text-sm">
          <div v-for="(v, k) in data.stores.byStatus" :key="k" class="flex justify-between"><span class="text-muted">{{ statusLabel[k] }}</span><span class="font-semibold">{{ num(v) }}</span></div>
          <div class="border-t border-line pt-2" />
          <div v-for="(v, k) in data.stores.byPlan" :key="k" class="flex justify-between"><span class="text-muted">باقة {{ planLabel[k] }}</span><span class="font-semibold">{{ num(v) }}</span></div>
          <div class="flex justify-between text-muted"><span>متاجر تجريبية</span><span>{{ num(data.stores.demo) }}</span></div>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold">أكثر المهارات استخدامًا (الشهر)</h3>
        <ul v-if="data.topSkills.length" class="mt-3 space-y-2 text-sm">
          <li v-for="s in data.topSkills" :key="s.slug" class="flex items-center justify-between gap-2">
            <span class="truncate">{{ s.title }}</span><span class="shrink-0 text-muted">{{ num(s.runs) }} · {{ s.costSar }} ر.س</span>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-muted">ما فيه تشغيلات هذا الشهر.</p>
      </div>
    </section>

    <!-- آخر المشاكل -->
    <section class="card p-5">
      <div class="flex items-center justify-between"><h3 class="font-bold">آخر الأخطاء والأحداث الأمنية</h3><NuxtLink to="/admin/logs?level=error" class="text-sm text-brand-400">كل السجلات ←</NuxtLink></div>
      <div v-if="data.recentProblems.length" class="mt-3 divide-y divide-line">
        <div v-for="l in data.recentProblems" :key="l.id" class="flex flex-wrap items-center gap-2 py-2.5 text-sm">
          <span class="chip border-0" :class="levelCls[l.level]">{{ l.level }}</span>
          <code class="text-xs text-muted" dir="ltr">{{ l.type }}</code>
          <span class="min-w-0 flex-1 truncate">{{ l.message }}</span>
          <NuxtLink v-if="l.storeId" :to="`/admin/stores/${l.storeId}`" class="text-xs text-brand-400" dir="ltr">{{ l.storeId }}</NuxtLink>
          <span class="text-xs text-muted">{{ fmtDate(l.ts) }}</span>
        </div>
      </div>
      <p v-else class="mt-3 text-sm text-muted">ما فيه مشاكل. 👌</p>
    </section>
  </div>
</template>
