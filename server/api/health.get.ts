// فحص صحة الخدمة (يستخدمه Coolify)
export default defineEventHandler(async () => {
  await useStorage('data').hasItem('health')
  return { ok: true }
})
