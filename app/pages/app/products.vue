<script setup lang="ts">
import type { Product } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'المنتجات · رواج' })

interface Copy { name: string; description_html: string; seo_title: string; seo_description: string; highlights: string[]; rationale: string }

const q = ref('')
const broken = reactive<Record<string, boolean>>({})
const { data: products, pending, refresh } = await useFetch<Product[]>('/api/store/products', { query: { q } })
const { refresh: refreshMe } = useMe()

const active = ref<Product | null>(null)
const tone = ref('ودّي وقريب')
const notes = ref('')
const copy = ref<Copy | null>(null)
const busy = ref(false)
const applying = ref(false)
const msg = ref<{ ok: boolean; text: string } | null>(null)
const fields = reactive({ name: true, description: true, seo: true })

function open(p: Product) {
  active.value = p
  copy.value = null
  msg.value = null
}

async function generate() {
  if (!active.value) return
  busy.value = true
  msg.value = null
  try {
    const r = await $fetch<{ copy: Copy }>(`/api/products/${active.value.id}/optimize`, { method: 'POST', body: { tone: tone.value, notes: notes.value } })
    copy.value = r.copy
  } catch (e) {
    msg.value = { ok: false, text: errMsg(e) }
  } finally {
    busy.value = false
    refreshMe()
  }
}

async function apply() {
  if (!active.value || !copy.value) return
  applying.value = true
  try {
    const body: Record<string, string> = {}
    if (fields.name) body.name = copy.value.name
    if (fields.description) body.description = copy.value.description_html
    if (fields.seo) { body.seoTitle = copy.value.seo_title; body.seoDescription = copy.value.seo_description }
    active.value = await $fetch<Product>(`/api/store/products/${active.value.id}`, { method: 'PUT', body })
    msg.value = { ok: true, text: 'تم تحديث المنتج في متجرك ✓' }
    refresh()
  } catch (e) {
    msg.value = { ok: false, text: errMsg(e) }
  } finally {
    applying.value = false
  }
}

const plain = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const weak = (p: Product) => plain(p.description).length < 60
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">المنتجات</h1>
        <p class="mt-1 text-muted">حسّن اسم ووصف أي منتج بالذكاء الاصطناعي وطبّقه على متجرك مباشرة.</p>
      </div>
      <div class="relative w-full sm:w-72">
        <AppIcon name="Search" :size="16" class="absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
        <input v-model.lazy="q" class="input pr-9" placeholder="ابحث باسم المنتج">
      </div>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="p in products" :key="p.id" class="card flex flex-col overflow-hidden">
        <div class="flex gap-3 p-4">
          <img v-if="p.image && !broken[p.id]" :src="p.image" alt="" class="size-16 shrink-0 rounded-xl bg-surface object-cover" loading="lazy" @error="broken[p.id] = true">
          <div v-else class="icon-tile size-16 bg-surface text-muted"><AppIcon name="Package" /></div>
          <div class="min-w-0">
            <h3 class="line-clamp-2 text-sm font-semibold">{{ p.name }}</h3>
            <div class="mt-1 text-sm">
              <span :class="p.salePrice && 'text-muted line-through'">{{ sar(p.price.amount) }}</span>
              <span v-if="p.salePrice" class="mr-1.5 font-semibold text-rose-600">{{ sar(p.salePrice.amount) }}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-1.5 px-4">
          <span v-if="p.quantity === 0" class="chip bg-rose-50 text-rose-700">نافد</span>
          <span v-else-if="p.quantity != null && p.quantity < 10" class="chip bg-amber-50 text-amber-700">مخزون منخفض ({{ num(p.quantity) }})</span>
          <span v-if="weak(p)" class="chip bg-amber-50 text-amber-700">وصف ضعيف</span>
          <span v-if="!p.seoTitle" class="chip bg-surface text-muted">بدون SEO</span>
          <span v-if="p.soldCount" class="chip bg-surface text-muted">{{ num(p.soldCount) }} مبيع</span>
        </div>
        <p class="mt-3 line-clamp-2 flex-1 px-4 text-sm text-muted">{{ plain(p.description) || 'بدون وصف' }}</p>
        <div class="mt-4 border-t border-line p-3">
          <button class="btn-ghost w-full text-brand-700" @click="open(p)"><AppIcon name="WandSparkles" :size="18" /> حسّن بالذكاء الاصطناعي</button>
        </div>
      </div>
    </div>
    <div v-if="pending && !products?.length" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="card h-48 animate-pulse" />
    </div>

    <!-- نافذة التحسين -->
    <Teleport to="body">
      <div v-if="active" class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" @click.self="active = null">
        <div class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold">تحسين المنتج</h2>
              <p class="text-sm text-muted">{{ active.name }}</p>
            </div>
            <button class="btn-ghost p-2" aria-label="إغلاق" @click="active = null"><AppIcon name="X" /></button>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label class="label">الأسلوب</label>
              <select v-model="tone" class="input">
                <option>فخم وراقي</option><option>ودّي وقريب</option><option>حماسي وشبابي</option><option>رسمي ومختصر</option>
              </select>
            </div>
            <div>
              <label class="label">ملاحظات (اختياري)</label>
              <input v-model="notes" class="input" placeholder="مثال: الحجم ١٠٠ مل، صناعة سعودية">
            </div>
          </div>
          <button class="btn-primary mt-4 w-full" :disabled="busy" @click="generate">
            <AppIcon :name="busy ? 'Loader' : 'WandSparkles'" :spin="busy" :size="18" /> {{ busy ? 'جاري الكتابة…' : copy ? 'اقترح نسخة ثانية' : 'اقترح وصف جديد' }}
          </button>

          <div v-if="msg" class="mt-4 rounded-xl p-3 text-sm" :class="msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">{{ msg.text }}</div>

          <div v-if="copy" class="mt-6 space-y-5">
            <div class="rounded-2xl bg-brand-50 p-4 text-sm text-brand-800"><strong>ليش أفضل؟</strong> {{ copy.rationale }}</div>

            <label class="flex items-start gap-3">
              <input v-model="fields.name" type="checkbox" class="mt-1 size-4 accent-brand-600">
              <div class="flex-1">
                <div class="text-sm font-semibold">الاسم</div>
                <div class="mt-1 text-sm text-muted line-through">{{ active.name }}</div>
                <div class="mt-0.5 font-medium">{{ copy.name }}</div>
              </div>
            </label>

            <label class="flex items-start gap-3">
              <input v-model="fields.description" type="checkbox" class="mt-1 size-4 accent-brand-600">
              <div class="flex-1">
                <div class="text-sm font-semibold">الوصف</div>
                <MarkdownView :source="copy.description_html" class="mt-2 rounded-xl border border-line p-4 text-sm" />
              </div>
            </label>

            <label class="flex items-start gap-3">
              <input v-model="fields.seo" type="checkbox" class="mt-1 size-4 accent-brand-600">
              <div class="flex-1 rounded-xl border border-line p-4">
                <div class="text-sm font-semibold">معاينة قوقل (SEO)</div>
                <div class="mt-2 text-xs text-emerald-700" dir="ltr">{{ active.url || 'store.salla.sa/…' }}</div>
                <div class="text-lg text-blue-700">{{ copy.seo_title }}</div>
                <div class="text-sm text-muted">{{ copy.seo_description }}</div>
              </div>
            </label>

            <div class="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
              <button class="btn-secondary" @click="active = null">إغلاق</button>
              <button class="btn-primary" :disabled="applying || !(fields.name || fields.description || fields.seo)" @click="apply">
                <AppIcon :name="applying ? 'Loader' : 'Check'" :spin="applying" :size="18" /> طبّق على متجري
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
