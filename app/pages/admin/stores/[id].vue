<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface Detail {
  store: { id: string; info: { name: string; domain: string }; demo: boolean; plan: string; planStatus: string; planEndsAt?: string; installedAt: string; uninstalledAt?: string; suspended?: boolean; suspendedReason?: string; connected: boolean; tokenExpiresAt: string | null }
  usage: { runs: number; limit: number; bonus: number; costSar: number }
  runs: { id: string; title: string; status: string; createdAt: string; model?: string; costSar?: number | null; outputChars: number }[]
  logs: { id: string; ts: string; level: string; type: string; message: string }[]
}
const route = useRoute()
const id = String(route.params.id)
const { data, refresh, error } = await useFetch<Detail>(`/api/admin/stores/${id}`)
useHead({ title: () => `${data.value?.store.info.name ?? 'متجر'} · إدارة رواج` })

const plan = ref('growth')
const status = ref('active')
const runs = ref(20)
const reason = ref('')
const busy = ref(false)
const msg = ref('')
watchEffect(() => { if (data.value) { plan.value = data.value.store.plan; status.value = data.value.store.planStatus } })

async function act(body: Record<string, unknown>, confirmText?: string) {
  if (confirmText && !confirm(confirmText)) return
  busy.value = true
  msg.value = ''
  try {
    await $fetch(`/api/admin/stores/${id}/action`, { method: 'POST', body })
    msg.value = 'تم ✓'
    await refresh()
  } catch (e) {
    msg.value = errMsg(e)
  } finally {
    busy.value = false
  }
}
const levelCls: Record<string, string> = { error: 'bg-rose-500/15 text-rose-300', security: 'bg-amber-500/15 text-amber-300', warn: 'bg-amber-500/10 text-amber-200', info: 'bg-surface text-muted' }
</script>

<template>
  <div v-if="error" class="card p-6 text-rose-300">{{ errMsg(error) }}</div>
  <div v-else-if="data" class="space-y-5">
    <NuxtLink to="/admin/stores" class="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><AppIcon name="ArrowLeft" :size="16" class="rotate-180" /> المتاجر</NuxtLink>

    <section class="card-hero p-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-extrabold">{{ data.store.info.name }}</h1>
          <div class="mt-1 text-sm text-muted" dir="ltr" style="text-align: right">{{ data.store.id }} · {{ data.store.info.domain }}</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-if="data.store.demo" class="chip">تجريبي</span>
          <span v-if="data.store.suspended" class="chip border-0 bg-rose-500/15 text-rose-300">موقوف</span>
          <span v-if="data.store.uninstalledAt" class="chip border-0 bg-surface text-muted">ألغى التثبيت</span>
          <span v-if="!data.store.demo" class="chip" :class="!data.store.connected && 'border-0 bg-surface text-muted'">{{ data.store.connected ? 'متصل بسلة' : 'غير متصل' }}</span>
        </div>
      </div>
      <div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="panel p-3"><div class="text-xs text-muted">التشغيلات</div><div class="text-xl font-bold">{{ num(data.usage.runs) }} / {{ num(data.usage.limit) }}</div></div>
        <div class="panel p-3"><div class="text-xs text-muted">تشغيلات مهداة</div><div class="text-xl font-bold">{{ num(data.usage.bonus) }}</div></div>
        <div class="panel p-3"><div class="text-xs text-muted">تكلفة الشهر</div><div class="text-xl font-bold">{{ data.usage.costSar }} ر.س</div></div>
        <div class="panel p-3"><div class="text-xs text-muted">التثبيت</div><div class="text-sm font-bold">{{ fmtDate(data.store.installedAt) }}</div></div>
      </div>
      <p v-if="data.store.suspendedReason" class="mt-3 text-sm text-rose-300">سبب الإيقاف: {{ data.store.suspendedReason }}</p>
    </section>

    <!-- الإجراءات -->
    <section class="card p-5">
      <h2 class="font-bold">الإجراءات</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <div class="panel space-y-2 p-4">
          <div class="text-sm font-semibold">الباقة</div>
          <select v-model="plan" class="input"><option value="starter">انطلاقة</option><option value="growth">نمو</option><option value="pro">احتراف</option></select>
          <select v-model="status" class="input"><option value="active">مشترك</option><option value="trial">تجربة</option><option value="expired">منتهي</option></select>
          <button class="btn-secondary w-full" :disabled="busy" @click="act({ action: 'set_plan', plan, status }, 'تغيير الباقة يدويًا؟ (ويبهوك سلة القادم ممكن يغيّرها)')">حفظ الباقة</button>
        </div>
        <div class="panel space-y-2 p-4">
          <div class="text-sm font-semibold">إهداء تشغيلات (هذا الشهر)</div>
          <input v-model.number="runs" type="number" min="1" max="10000" class="input">
          <button class="btn-secondary w-full" :disabled="busy" @click="act({ action: 'add_runs', runs }, `إضافة ${runs} تشغيل؟`)">إضافة</button>
        </div>
        <div class="panel space-y-2 p-4">
          <div class="text-sm font-semibold">إيقاف الحساب</div>
          <template v-if="!data.store.suspended">
            <input v-model="reason" class="input" placeholder="السبب (اختياري)">
            <button class="btn w-full border border-rose-500/40 text-rose-300 hover:bg-rose-500/10" :disabled="busy" @click="act({ action: 'suspend', reason }, 'إيقاف المتجر؟ ما راح يقدر يستخدم رواج.')">إيقاف</button>
          </template>
          <button v-else class="btn-primary w-full" :disabled="busy" @click="act({ action: 'unsuspend' })">إعادة التفعيل</button>
        </div>
      </div>
      <p v-if="msg" class="mt-3 text-sm text-brand-300">{{ msg }}</p>
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <div class="card p-5">
        <h2 class="font-bold">آخر التشغيلات</h2>
        <div v-if="data.runs.length" class="mt-3 divide-y divide-line text-sm">
          <div v-for="r in data.runs" :key="r.id" class="flex flex-wrap items-center gap-2 py-2">
            <span class="min-w-0 flex-1 truncate">{{ r.title }}</span>
            <span class="chip border-0" :class="r.status === 'done' ? 'bg-brand-500/15 text-brand-300' : 'bg-rose-500/15 text-rose-300'">{{ r.status }}</span>
            <code class="text-xs text-muted" dir="ltr">{{ r.model?.replace('claude-', '') }}</code>
            <span class="text-xs text-muted">{{ r.costSar ?? '—' }} ر.س</span>
            <span class="text-xs text-muted">{{ fmtDate(r.createdAt) }}</span>
          </div>
        </div>
        <p v-else class="mt-3 text-sm text-muted">ما فيه تشغيلات.</p>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between"><h2 class="font-bold">سجل المتجر</h2><NuxtLink :to="`/admin/logs?store=${data.store.id}`" class="text-sm text-brand-400">كل السجل ←</NuxtLink></div>
        <div v-if="data.logs.length" class="mt-3 divide-y divide-line text-sm">
          <div v-for="l in data.logs.slice(0, 30)" :key="l.id" class="flex flex-wrap items-center gap-2 py-2">
            <span class="chip border-0" :class="levelCls[l.level]">{{ l.level }}</span>
            <span class="min-w-0 flex-1 truncate">{{ l.message }}</span>
            <span class="text-xs text-muted">{{ fmtDate(l.ts) }}</span>
          </div>
        </div>
        <p v-else class="mt-3 text-sm text-muted">ما فيه سجلات.</p>
      </div>
    </section>
  </div>
</template>
