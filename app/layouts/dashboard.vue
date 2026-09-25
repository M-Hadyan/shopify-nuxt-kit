<script setup lang="ts">
const route = useRoute()
const { data: me } = await useMe()
const open = ref(false)
watch(() => route.fullPath, () => (open.value = false))

const nav = [
  { to: '/app', label: 'المهارات التسويقية', icon: 'LayoutGrid', exact: false },
  { to: '/app/history', label: 'السجل', icon: 'History', exact: false },
  { to: '/app/settings', label: 'الإعدادات والباقة', icon: 'Settings', exact: false },
]
const isActive = (i: typeof nav[number]) => (i.to === '/app' ? route.path === '/app' || route.path.startsWith('/app/skills') : route.path.startsWith(i.to))
const usagePct = computed(() => me.value ? Math.min(100, (me.value.usage.runs / me.value.usage.limit) * 100) : 0)
const initial = computed(() => me.value?.store.name.trim().charAt(0) ?? 'ر')

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
      class="fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-line bg-card p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
      :class="open ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="flex items-center justify-between px-2 py-2">
        <NuxtLink to="/app"><AppLogo /></NuxtLink>
        <button class="btn-ghost p-2 lg:hidden" aria-label="إغلاق" @click="open = false"><AppIcon name="X" /></button>
      </div>

      <nav class="mt-6 flex flex-1 flex-col gap-1">
        <NuxtLink
          v-for="i in nav" :key="i.to" :to="i.to"
          class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition"
          :class="isActive(i) ? 'border border-brand-500/25 bg-brand-500/10 text-brand-300' : 'border border-transparent text-muted hover:bg-surface hover:text-ink'"
        >
          <AppIcon :name="i.icon" :size="19" /> {{ i.label }}
        </NuxtLink>
      </nav>

      <div v-if="me" class="panel p-4">
        <div class="flex items-center justify-between text-sm">
          <span class="font-semibold">تشغيلات الشهر</span>
          <span class="text-xs text-muted" dir="ltr">{{ me.usage.runs }} / {{ me.usage.limit }}</span>
        </div>
        <div class="mt-2.5 h-2 overflow-hidden rounded-full bg-surface">
          <div class="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-700" :style="{ width: `${usagePct}%` }" />
        </div>
      </div>
      <button class="btn-ghost mt-2 justify-start" @click="signOut"><AppIcon name="LogOut" :size="18" /> تسجيل الخروج</button>
    </aside>
    <div v-if="open" class="fixed inset-0 z-30 bg-black/60 lg:hidden" @click="open = false" />

    <div class="min-w-0 flex-1">
      <!-- الشريط العلوي -->
      <header class="sticky top-0 z-20 border-b border-line bg-page/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div class="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <!-- المتجر -->
          <div class="flex items-center gap-2">
            <button class="btn-ghost size-11 shrink-0 p-0 lg:hidden" aria-label="القائمة" @click="open = true"><AppIcon name="Menu" :size="24" /></button>
            <NuxtLink to="/app/settings" class="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-surface/70 py-2 pr-4 pl-2.5 transition hover:bg-surface lg:flex-none">
              <AppIcon name="Store" :size="20" class="shrink-0 text-muted" />
              <span class="flex-1 truncate text-center font-semibold lg:flex-none">{{ me?.store.name }}</span>
              <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-800">{{ me?.demo ? 'تجريبي' : 'سلة' }}</span>
              <AppIcon name="ChevronDown" :size="16" class="text-muted" />
            </NuxtLink>
          </div>
          <!-- الإجراءات -->
          <div class="flex items-center gap-2">
            <NuxtLink to="/app/settings" class="badge-gold shrink-0"><AppIcon name="Crown" :size="17" /> {{ me?.plan.name }}</NuxtLink>
            <div class="flex flex-1 justify-end lg:flex-none">
              <span class="flex size-10 items-center justify-center rounded-full bg-brand-500/15 font-bold text-brand-300">{{ initial }}</span>
            </div>
          </div>
        </div>
      </header>

      <div v-if="me?.demo" class="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
        أنت في متجر تجريبي ببيانات وهمية. التعديلات هنا ما تأثر على أي متجر حقيقي.
      </div>
      <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
