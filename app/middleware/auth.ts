// يحمي صفحات لوحة التحكم
export default defineNuxtRouteMiddleware(async () => {
  const headers = useRequestHeaders(['cookie'])
  try {
    await $fetch('/api/me', { headers })
  } catch {
    return navigateTo('/?login=1')
  }
})
