<script setup lang="ts">
const route = useRoute()
const { data: me } = await useMe()
const open = ref(false)
watch(() => route.fullPath, () => (open.value = false))

const nav = [
  { to: '/app', label: 'الرئيسية', icon: 'LayoutDashboard', exact: true },
  { to: '/app/skills', label: 'البطاقات التسويقية', icon: 'LayoutGrid' },
  { to: '/app/assistant', label: 'مساعد رواج', icon: 'Bot' },
  { to: '/app/products', label: 'المنتجات', icon: 'Package' },
  { to: '/app/history', label: 'السجل', icon: 'History' },
  { to: '/app/settings', label: 'الإعدادات والباقة', icon: 'Settings' },
]
const isActive = (i: typeof nav[number]) => (i.exact ? route.path === i.to : route.path.startsWith(i.to))
const usagePct = computed(() => me.value ? Math.min(100, (me.value.usage.runs / me.value.usage.limit) * 100) : 0)

async function signOut() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  clearNuxtData('me')
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen lg:flex">
    <!-- الشريط الجانبي -->
    <aside
      class="fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-line bg-white p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
      :class="open ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="flex items-center justify-between px-2 py-2">
        <NuxtLink to="/app"><AppLogo /></NuxtLink>
        <button class="btn-ghost p-2 lg:hidden" aria-label="إغلاق" @click="open = false"><AppIcon name="X" /></button>
      </div>

      <div v-if="me" class="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-3">
        <div class="icon-tile size-10 rounded-xl bg-brand-600 text-white"><AppIcon name="Store" :size="18" /></div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold">{{ me.store.name }}</div>
          <div class="truncate text-xs text-muted" dir="ltr">{{ me.store.domain }}</div>
        </div>
      </div>

      <nav class="mt-5 flex flex-1 flex-col gap-1">
        <NuxtLink
          v-for="i in nav" :key="i.to" :to="i.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
          :class="isActive(i) ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-surface hover:text-ink'"
        >
          <AppIcon :name="i.icon" :size="19" /> {{ i.label }}
        </NuxtLink>
      </nav>

      <div v-if="me" class="rounded-2xl border border-line p-4">
        <div class="flex items-center justify-between text-sm">
          <span class="font-semibold">باقة {{ me.plan.name }}</span>
          <span class="text-xs text-muted">{{ num(me.usage.runs) }} / {{ num(me.usage.limit) }}</span>
        </div>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-surface">
          <div class="h-full rounded-full bg-gradient-to-l from-brand-600 to-accent-500" :style="{ width: `${usagePct}%` }" />
        </div>
        <p class="mt-2 text-xs text-muted">تشغيلات هذا الشهر</p>
      </div>
      <button class="btn-ghost mt-2 justify-start" @click="signOut"><AppIcon name="LogOut" :size="18" /> تسجيل الخروج</button>
    </aside>
    <div v-if="open" class="fixed inset-0 z-30 bg-ink/30 lg:hidden" @click="open = false" />

    <div class="min-w-0 flex-1">
      <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
        <button class="btn-ghost p-2" aria-label="القائمة" @click="open = true"><AppIcon name="Menu" /></button>
        <AppLogo />
      </header>
      <div v-if="me?.demo" class="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
        أنت في متجر تجريبي ببيانات وهمية. التعديلات هنا ما تأثر على أي متجر حقيقي.
      </div>
      <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
