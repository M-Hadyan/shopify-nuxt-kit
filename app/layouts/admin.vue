<script setup lang="ts">
const route = useRoute()
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
const nav = [
  { to: '/admin', label: 'المراقبة', icon: 'ChartLine' },
  { to: '/admin/stores', label: 'المتاجر', icon: 'Store' },
  { to: '/admin/logs', label: 'السجلات', icon: 'ScanSearch' },
]
const active = (to: string) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))
async function signOut() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <div class="flex items-center gap-2">
          <AppLogo />
          <span class="rounded-full border border-gold-500/60 px-2.5 py-0.5 text-xs font-bold text-gold-300">الإدارة</span>
        </div>
        <nav class="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1 md:justify-center">
          <NuxtLink
            v-for="i in nav" :key="i.to" :to="i.to"
            class="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition"
            :class="active(i.to) ? 'bg-brand-800/50 text-brand-300 ring-1 ring-brand-700/40' : 'text-muted hover:bg-surface hover:text-ink'"
          ><AppIcon :name="i.icon" :size="17" /> {{ i.label }}</NuxtLink>
        </nav>
        <button class="btn-ghost mr-auto md:mr-0" @click="signOut"><AppIcon name="LogOut" :size="17" /> خروج</button>
      </div>
    </header>
    <main class="mx-auto max-w-7xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>
