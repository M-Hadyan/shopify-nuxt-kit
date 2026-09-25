<script setup lang="ts">
useHead({ title: 'دخول الإدارة · رواج', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
const form = reactive({ email: '', password: '', code: '' })
const loading = ref(false)
const error = ref('')
async function submit() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: form })
    await navigateTo('/admin')
  } catch (e) {
    error.value = errMsg(e)
    form.code = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <form class="card-hero w-full max-w-sm p-7" @submit.prevent="submit">
      <div class="flex items-center justify-between">
        <AppLogo />
        <span class="rounded-full border border-gold-500/60 px-2.5 py-0.5 text-xs font-bold text-gold-300">الإدارة</span>
      </div>
      <h1 class="mt-6 text-2xl font-extrabold">دخول لوحة الإدارة</h1>
      <div class="mt-6 space-y-4">
        <div><label class="label" for="email">الإيميل</label><input id="email" v-model="form.email" type="email" autocomplete="username" class="input" required dir="ltr"></div>
        <div><label class="label" for="pw">كلمة المرور</label><input id="pw" v-model="form.password" type="password" autocomplete="current-password" class="input" required dir="ltr"></div>
        <div><label class="label" for="code">كود التحقق (2FA)</label><input id="code" v-model="form.code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" class="input text-center text-lg tracking-[0.5em]" required dir="ltr" placeholder="000000"></div>
      </div>
      <p v-if="error" class="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{{ error }}</p>
      <button class="btn-primary mt-6 w-full rounded-2xl py-3" :disabled="loading">
        <AppIcon :name="loading ? 'Loader' : 'ShieldCheck'" :spin="loading" :size="18" /> دخول
      </button>
    </form>
  </div>
</template>
