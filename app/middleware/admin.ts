// يحمي صفحات لوحة الأدمن
export default defineNuxtRouteMiddleware(async () => {
  const headers = useRequestHeaders(['cookie'])
  try {
    await $fetch('/api/admin/me', { headers })
  } catch {
    return navigateTo('/admin/login')
  }
})
