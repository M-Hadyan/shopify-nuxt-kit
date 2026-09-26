<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'السجلات · إدارة رواج' })

interface LogItem { id: string; ts: string; level: string; type: string; message: string; storeId?: string; ip?: string; data?: Record<string, unknown> }
const route = useRoute()
const channel = ref<'events' | 'requests'>('events')
const level = ref(String(route.query.level ?? ''))
const type = ref('')
const store = ref(String(route.query.store ?? ''))
const q = ref('')
const offset = ref(0)
const limit = 100
const query = computed(() => ({ channel: channel.value, level: level.value || undefined, type: type.value || undefined, store: store.value || undefined, q: q.value || undefined, limit, offset: offset.value }))
const { data, refresh, pending } = await useFetch<{ total: number; items: LogItem[]; types: string[] }>('/api/admin/logs', { query })
watch([channel, level, type, store, q], () => (offset.value = 0))

const live = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
watch(live, (v) => { clearInterval(timer); if (v) timer = setInterval(() => refresh(), 5000) })
onBeforeUnmount(() => clearInterval(timer))

const open = ref<string | null>(null)
const levelCls: Record<string, string> = { error: 'bg-rose-500/15 text-rose-300', security: 'bg-amber-500/15 text-amber-300', warn: 'bg-amber-500/10 text-amber-200', info: 'bg-surface text-muted' }
const time = (s: string) => new Date(s).toLocaleString('en-GB', { hour12: false })
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold">السجلات</h1>
        <p class="text-sm text-muted">{{ num(data?.total ?? 0) }} سجل مطابق</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-2 text-sm text-muted"><input v-model="live" type="checkbox" class="accent-brand-600"> مباشر (كل ٥ ث)</label>
        <button class="btn-secondary" :disabled="pending" @click="refresh()"><AppIcon name="RefreshCw" :size="16" :spin="pending" /></button>
      </div>
    </div>

    <div class="card mt-4 flex flex-wrap gap-2 p-3">
      <div class="segmented">
        <button class="rounded-xl px-4 py-2 text-sm font-bold" :class="channel === 'events' ? 'bg-brand-900/80 text-white' : 'text-muted'" @click="channel = 'events'">الأحداث</button>
        <button class="rounded-xl px-4 py-2 text-sm font-bold" :class="channel === 'requests' ? 'bg-brand-900/80 text-white' : 'text-muted'" @click="channel = 'requests'">طلبات الـ API</button>
      </div>
      <select v-model="level" class="input w-36"><option value="">كل المستويات</option><option value="error">error</option><option value="security">security</option><option value="warn">warn</option><option value="info">info</option></select>
      <select v-if="channel === 'events'" v-model="type" class="input w-40"><option value="">كل الأنواع</option><option v-for="t in data?.types" :key="t" :value="t">{{ t }}</option></select>
      <input v-model.lazy="store" class="input w-48" placeholder="معرف المتجر" dir="ltr">
      <input v-model.lazy="q" class="input min-w-48 flex-1" placeholder="بحث في الرسالة أو IP أو البيانات">
    </div>

    <div class="card mt-4 overflow-x-auto">
      <div v-for="l in data?.items" :key="l.id" class="border-b border-line last:border-0">
        <button class="flex w-full min-w-[640px] items-center gap-3 px-4 py-2.5 text-start text-sm hover:bg-surface/40" @click="open = open === l.id ? null : l.id">
          <span class="w-36 shrink-0 text-xs text-muted" dir="ltr">{{ time(l.ts) }}</span>
          <span class="chip w-20 shrink-0 justify-center border-0" :class="levelCls[l.level]">{{ l.level }}</span>
          <code class="w-44 shrink-0 truncate text-xs text-brand-300" dir="ltr">{{ l.type }}</code>
          <span class="min-w-0 flex-1 truncate">{{ l.message }}</span>
          <span v-if="l.storeId" class="shrink-0 text-xs text-muted" dir="ltr">{{ l.storeId }}</span>
        </button>
        <div v-if="open === l.id" class="bg-page/60 px-4 py-3">
          <div class="mb-2 flex flex-wrap gap-4 text-xs text-muted" dir="ltr">
            <span>id: {{ l.id }}</span><span v-if="l.ip">ip: {{ l.ip }}</span>
            <NuxtLink v-if="l.storeId" :to="`/admin/stores/${l.storeId}`" class="text-brand-400">store: {{ l.storeId }}</NuxtLink>
          </div>
          <pre v-if="l.data" class="overflow-x-auto rounded-xl bg-black/40 p-3 text-xs leading-5 text-ink/80" dir="ltr">{{ JSON.stringify(l.data, null, 2) }}</pre>
        </div>
      </div>
      <p v-if="!data?.items.length" class="p-8 text-center text-muted">ما فيه سجلات مطابقة.</p>
    </div>

    <div v-if="(data?.total ?? 0) > limit" class="mt-4 flex items-center justify-center gap-3">
      <button class="btn-secondary" :disabled="offset === 0" @click="offset = Math.max(0, offset - limit)">السابق</button>
      <span class="text-sm text-muted">{{ num(offset + 1) }}–{{ num(Math.min(offset + limit, data?.total ?? 0)) }}</span>
      <button class="btn-secondary" :disabled="offset + limit >= (data?.total ?? 0)" @click="offset += limit">التالي</button>
    </div>
  </div>
</template>
