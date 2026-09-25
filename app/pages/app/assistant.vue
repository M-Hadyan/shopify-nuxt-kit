<script setup lang="ts">
import type { ChatView, PendingAction } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'مساعد رواج · رواج' })

const route = useRoute()
const chat = ref<ChatView | null>(null)
const input = ref(typeof route.query.q === 'string' ? route.query.q : '')
const sending = ref(false)
const error = ref('')
const acting = ref<string | null>(null)
const scroller = ref<HTMLElement | null>(null)
const { refresh: refreshMe } = useMe()

const suggestions = [
  'وش أكثر ٣ منتجات تنترك في السلة؟ وليش؟',
  'حسّن وصف أكثر منتج مبيعًا وجهّزه للتطبيق',
  'سوّ لي كوبون لليوم الوطني مناسب لمتوسط السلة',
  'لخّص لي آراء العملاء السلبية وكيف أعالجها',
]

async function scrollDown() {
  await nextTick()
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' })
}

async function send(text = input.value) {
  const message = text.trim()
  if (!message || sending.value) return
  sending.value = true
  error.value = ''
  input.value = ''
  const optimistic = chat.value ?? { id: '', messages: [] }
  optimistic.messages.push({ role: 'user', text: message })
  chat.value = { ...optimistic }
  scrollDown()
  try {
    chat.value = await $fetch<ChatView>('/api/assistant', { method: 'POST', body: { chatId: chat.value.id || undefined, message } })
  } catch (e) {
    chat.value.messages.pop()
    input.value = message
    error.value = errMsg(e)
  } finally {
    sending.value = false
    refreshMe()
    scrollDown()
  }
}

async function decide(a: PendingAction, decision: 'apply' | 'reject') {
  if (!chat.value) return
  acting.value = a.id
  try {
    const updated = await $fetch<PendingAction>(`/api/actions/${a.id}`, { method: 'POST', body: { chatId: chat.value.id, decision } })
    Object.assign(a, updated)
  } catch (e) {
    error.value = errMsg(e)
  } finally {
    acting.value = null
  }
}

function reset() {
  chat.value = null
  error.value = ''
}

const statusLabel: Record<PendingAction['status'], string> = { pending: 'بانتظار موافقتك', applied: 'تم التطبيق', rejected: 'مرفوض', failed: 'فشل' }
const statusCls: Record<PendingAction['status'], string> = {
  pending: 'bg-amber-50 text-amber-700', applied: 'bg-emerald-50 text-emerald-700', rejected: 'bg-surface text-muted', failed: 'bg-rose-50 text-rose-700',
}
type ProductPayload = { productName: string; before: Record<string, unknown>; patch: Record<string, unknown> }
const fieldLabel: Record<string, string> = { name: 'الاسم', description: 'الوصف', seoTitle: 'عنوان SEO', seoDescription: 'وصف SEO', price: 'السعر', salePrice: 'سعر التخفيض' }
const plain = (v: unknown) => String(v ?? '—').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
</script>

<template>
  <div class="flex h-[calc(100vh-7rem)] flex-col lg:h-[calc(100vh-4rem)]">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">مساعد رواج</h1>
        <p class="mt-1 text-sm text-muted">يقرأ متجرك ويجاوبك، ويجهز لك تعديلات تطبقها بموافقتك.</p>
      </div>
      <button v-if="chat" class="btn-secondary" @click="reset"><AppIcon name="RefreshCw" :size="16" /> محادثة جديدة</button>
    </div>

    <div ref="scroller" class="card mt-5 flex-1 overflow-y-auto p-4 sm:p-6">
      <div v-if="!chat?.messages.length" class="flex h-full flex-col items-center justify-center text-center">
        <div class="icon-tile size-16 rounded-3xl bg-brand-600 text-white"><AppIcon name="Bot" :size="30" /></div>
        <h2 class="mt-4 text-lg font-bold">وش تبي تعرف عن متجرك؟</h2>
        <div class="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
          <button v-for="s in suggestions" :key="s" class="rounded-2xl border border-line p-3.5 text-start text-sm transition hover:border-brand-300 hover:bg-brand-50" @click="send(s)">{{ s }}</button>
        </div>
      </div>

      <div v-else class="space-y-5">
        <div v-for="(m, i) in chat.messages" :key="i" class="flex" :class="m.role === 'user' ? 'justify-start' : 'justify-end'">
          <div v-if="m.role === 'user'" class="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-white">{{ m.text }}</div>
          <div v-else class="w-full max-w-[92%] space-y-3">
            <div class="rounded-2xl rounded-tl-sm bg-surface px-4 py-3"><MarkdownView :source="m.text" /></div>

            <div v-for="a in m.actions" :key="a.id" class="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2 font-semibold">
                  <AppIcon :name="a.kind === 'create_coupon' ? 'BadgePercent' : 'Package'" :size="18" class="text-brand-600" />
                  {{ a.kind === 'create_coupon' ? 'اقتراح كوبون' : 'اقتراح تعديل منتج' }}
                </div>
                <span class="chip" :class="statusCls[a.status]">{{ statusLabel[a.status] }}</span>
              </div>
              <p class="mt-2 text-sm text-muted">{{ a.summary }}</p>

              <div v-if="a.kind === 'update_product'" class="mt-3 space-y-2 text-sm">
                <div v-for="(v, k) in (a.payload as ProductPayload).patch" :key="k" class="rounded-xl bg-surface p-3">
                  <div class="text-xs font-semibold text-muted">{{ fieldLabel[k] ?? k }}</div>
                  <div class="mt-1 line-clamp-2 text-muted line-through">{{ plain((a.payload as ProductPayload).before[k]) }}</div>
                  <div class="mt-0.5 line-clamp-4">{{ plain(v) }}</div>
                </div>
              </div>

              <p v-if="a.error" class="mt-2 text-sm text-rose-600">{{ a.error }}</p>
              <div v-if="a.status === 'pending'" class="mt-3 flex gap-2">
                <button class="btn-primary" :disabled="acting === a.id" @click="decide(a, 'apply')">
                  <AppIcon :name="acting === a.id ? 'Loader' : 'Check'" :spin="acting === a.id" :size="16" /> طبّق على متجري
                </button>
                <button class="btn-secondary" :disabled="acting === a.id" @click="decide(a, 'reject')">رفض</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="sending" class="flex justify-end">
          <div class="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm text-muted">
            <AppIcon name="Loader" spin :size="16" /> رواج يقرأ متجرك…
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="mt-2 text-sm text-rose-600">{{ error }}</p>
    <form class="mt-3 flex gap-2" @submit.prevent="send()">
      <input v-model="input" class="input flex-1 py-3" placeholder="اكتب سؤالك أو طلبك…" :disabled="sending">
      <button class="btn-primary px-5" :disabled="sending || !input.trim()" aria-label="إرسال"><AppIcon name="Send" :size="18" class="-scale-x-100" /></button>
    </form>
  </div>
</template>
