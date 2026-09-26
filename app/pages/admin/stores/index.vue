<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'المتاجر · إدارة رواج' })

interface Row { id: string; name: string; domain: string; demo: boolean; plan: string; planStatus: string; suspended: boolean; uninstalled: boolean; installedAt: string; runsMonth: number; costMonthSar: number; connected: boolean }
const q = ref('')
const filter = ref<'real' | 'demo' | 'all'>('real')
const { data, pending } = await useFetch<Row[]>('/api/admin/stores', { query: { q, filter } })
const planLabel: Record<string, string> = { starter: 'انطلاقة', growth: 'نمو', pro: 'احتراف' }
function status(r: Row) {
  if (r.uninstalled) return { t: 'ألغى التثبيت', c: 'bg-surface text-muted' }
  if (r.suspended) return { t: 'موقوف', c: 'bg-rose-500/15 text-rose-300' }
  return ({ active: { t: 'مشترك', c: 'bg-brand-500/15 text-brand-300' }, trial: { t: 'تجربة', c: 'bg-sky-500/15 text-sky-300' }, expired: { t: 'منتهي', c: 'bg-amber-500/15 text-amber-300' } } as Record<string, { t: string; c: string }>)[r.planStatus]!
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h1 class="text-2xl font-extrabold">المتاجر</h1>
      <div class="flex flex-wrap gap-2">
        <div class="segmented">
          <button v-for="f in [{ id: 'real', l: 'حقيقية' }, { id: 'demo', l: 'تجريبية' }, { id: 'all', l: 'الكل' }]" :key="f.id" class="rounded-xl px-4 py-2 text-sm font-bold" :class="filter === f.id ? 'bg-brand-900/80 text-white' : 'text-muted'" @click="filter = f.id as typeof filter">{{ f.l }}</button>
        </div>
        <input v-model.lazy="q" class="input w-60" placeholder="بحث بالاسم أو المعرف">
      </div>
    </div>

    <div class="card mt-5 overflow-x-auto">
      <table class="w-full min-w-[760px] text-sm">
        <thead class="text-right text-xs text-muted">
          <tr class="border-b border-line"><th class="p-3">المتجر</th><th class="p-3">الحالة</th><th class="p-3">الباقة</th><th class="p-3">تشغيلات الشهر</th><th class="p-3">التكلفة</th><th class="p-3">الربط</th><th class="p-3">التثبيت</th></tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="r in data" :key="r.id" class="cursor-pointer hover:bg-surface/50" @click="navigateTo(`/admin/stores/${r.id}`)">
            <td class="p-3"><div class="font-semibold">{{ r.name }}</div><div class="text-xs text-muted" dir="ltr" style="text-align: right">{{ r.id }}</div></td>
            <td class="p-3"><span class="chip border-0" :class="status(r).c">{{ status(r).t }}</span></td>
            <td class="p-3">{{ r.demo ? 'تجريبي' : planLabel[r.plan] }}</td>
            <td class="p-3">{{ num(r.runsMonth) }}</td>
            <td class="p-3">{{ r.costMonthSar }} ر.س</td>
            <td class="p-3"><span :class="r.connected ? 'text-brand-400' : 'text-muted'">{{ r.demo ? '—' : r.connected ? 'متصل' : 'غير متصل' }}</span></td>
            <td class="p-3 text-xs text-muted">{{ fmtDate(r.installedAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!pending && !data?.length" class="p-8 text-center text-muted">ما فيه متاجر.</p>
    </div>
  </div>
</template>
