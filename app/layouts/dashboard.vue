<script setup lang="ts">
const route = useRoute()
const { data: me } = await useMe()
const open = ref(false)
const bell = ref(false)
watch(() => route.fullPath, () => { open.value = false; bell.value = false })

const nav = [
  { to: '/app', label: 'المهارات التسويقية', icon: 'LayoutGrid' },
  { to: '/app/history', label: 'السجل', icon: 'History' },
  { to: '/app/help', label: 'الشروحات', icon: 'CircleHelp' },
  { to: '/app/settings', label: 'الإعدادات والباقة', icon: 'Settings' },
]
const isActive = (to: string) => (to === '/app' ? route.path === '/app' || route.path.startsWith('/app/skills') : route.path.startsWith(to))
const usagePct = computed(() => me.value ? Math.min(100, (me.value.usage.runs / me.value.usage.limit) * 100) : 0)
const initial = computed(() => me.value?.store.name.trim().charAt(0) ?? 'ر')

async function signOut() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  clearNuxtData('me')
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen">
    <!-- الشريط العلوي (نمط كارتات) -->
    <header class="sticky top-0 z-30 print:hidden border-b border-line bg-page/90 backdrop-blur-md">
      <div class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
        <!-- الصف الأول: القائمة + المتجر -->
        <div class="flex flex-1 items-center gap-2 rounded-full bg-card/80 py-1.5 pr-2 pl-3 ring-1 ring-line/60">
          <button class="flex size-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface" aria-label="القائمة" @click="open = true">
            <AppIcon name="Menu" :size="24" />
          </button>
          <AppIcon name="Store" :size="21" class="shrink-0 text-ink/80" />
          <span class="min-w-0 flex-1 truncate text-center text-lg font-bold">{{ me?.store.name }}</span>
          <span class="rounded-full bg-brand-50 px-3 py-0.5 text-sm font-extrabold text-brand-700">{{ me?.demo ? 'تجريبي' : 'سلة' }}</span>
          <NuxtLink to="/app/settings" aria-label="المتجر" class="text-muted hover:text-ink"><AppIcon name="ChevronDown" :size="20" /></NuxtLink>
        </div>

        <!-- الصف الثاني: الباقة + الشروحات + الإشعارات + الحساب -->
        <div class="flex items-center gap-2">
          <NuxtLink to="/app/settings" class="badge-gold shrink-0"><AppIcon name="Crown" :size="18" /> {{ me?.plan.name }}<span v-if="me?.status === 'trial'" class="text-xs font-medium opacity-80">(تجربة)</span></NuxtLink>
          <NuxtLink to="/app/help" class="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-800/50 px-4 py-2 text-sm font-bold text-brand-300 ring-1 ring-brand-700/40 transition hover:bg-brand-800/70">
            <AppIcon name="CircleHelp" :size="18" /> الشروحات
          </NuxtLink>
          <div class="relative">
            <button class="flex size-10 items-center justify-center rounded-full text-ink hover:bg-surface" aria-label="الإشعارات" @click="bell = !bell">
              <AppIcon name="Bell" :size="21" />
            </button>
            <div v-if="bell" class="card absolute top-12 left-0 z-40 w-60 p-4 text-center text-sm text-muted">ما عندك إشعارات جديدة</div>
          </div>
          <div class="flex flex-1 justify-center rounded-full bg-card/80 py-1 ring-1 ring-line/60 md:flex-none md:px-2">
            <span class="flex size-10 items-center justify-center rounded-full bg-brand-900/70 font-extrabold text-brand-300">{{ initial }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- القائمة الجانبية المنبثقة -->
    <Transition enter-from-class="translate-x-full" leave-to-class="translate-x-full">
      <aside v-if="open" class="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col border-l border-line bg-card p-5 transition-transform duration-200">
        <div class="flex items-center justify-between">
          <AppLogo />
          <button class="flex size-10 items-center justify-center rounded-full hover:bg-surface" aria-label="إغلاق" @click="open = false"><AppIcon name="X" /></button>
        </div>
        <nav class="mt-6 flex flex-1 flex-col gap-1.5">
          <NuxtLink
            v-for="i in nav" :key="i.to" :to="i.to"
            class="flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold transition"
            :class="isActive(i.to) ? 'bg-brand-800/50 text-brand-300 ring-1 ring-brand-700/40' : 'text-muted hover:bg-surface hover:text-ink'"
          >
            <AppIcon :name="i.icon" :size="20" /> {{ i.label }}
          </NuxtLink>
        </nav>
        <div v-if="me" class="panel p-4">
          <div class="flex items-center justify-between text-sm">
            <span class="font-semibold">تشغيلات الشهر</span>
            <span class="font-bold text-brand-400" dir="ltr">{{ me.usage.runs }} / {{ me.usage.limit }}</span>
          </div>
          <div class="mt-2.5 h-2 overflow-hidden rounded-full bg-surface">
            <div class="h-full rounded-full bg-brand-500" :style="{ width: `${usagePct}%` }" />
          </div>
        </div>
        <button class="btn-ghost mt-3 justify-start" @click="signOut"><AppIcon name="LogOut" :size="18" /> تسجيل الخروج</button>
      </aside>
    </Transition>
    <div v-if="open" class="fixed inset-0 z-40 bg-black/60" @click="open = false" />

    <div v-if="me?.demo" class="print:hidden border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
      متجر تجريبي ببيانات وهمية
    </div>
    <main class="mx-auto max-w-5xl px-4 py-5 sm:py-7">
      <slot />
    </main>
  </div>
</template>
