<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-surface p-6 text-center">
    <AppLogo />
    <h1 class="mt-8 text-5xl font-bold text-brand-600">{{ error.statusCode }}</h1>
    <p class="mt-3 text-muted">{{ error.statusCode === 404 ? 'الصفحة غير موجودة' : error.statusMessage || 'حدث خطأ' }}</p>
    <button class="btn-primary mt-6" @click="clearError({ redirect: '/' })">الرجوع للرئيسية</button>
  </div>
</template>
