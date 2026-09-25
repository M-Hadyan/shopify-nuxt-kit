<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'الإعدادات والباقة · رواج' })

const { data: me } = await useMe()
</script>

<template>
  <div v-if="me">
    <h1 class="text-2xl font-bold">الإعدادات والباقة</h1>

    <div class="mt-6 grid gap-4 lg:grid-cols-2">
      <div class="card p-6">
        <h2 class="font-bold">المتجر المربوط</h2>
        <dl class="mt-4 space-y-3 text-sm">
          <div class="flex justify-between gap-4"><dt class="text-muted">الاسم</dt><dd class="font-medium">{{ me.store.name }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-muted">الرابط</dt><dd class="font-medium" dir="ltr">{{ me.store.domain }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-muted">المعرف</dt><dd class="font-medium" dir="ltr">{{ me.store.id }}</dd></div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">حالة الربط</dt>
            <dd><span class="chip" :class="me.demo ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'">{{ me.demo ? 'متجر تجريبي' : 'متصل بسلة' }}</span></dd>
          </div>
        </dl>
        <div class="mt-5 rounded-xl bg-surface p-4 text-sm text-muted">
          <div class="mb-1 font-semibold text-ink">الصلاحيات</div>
          قراءة فقط: بيانات المتجر، المنتجات، الطلبات، العملاء، السلات المتروكة، التقييمات، والكوبونات. رواج ما يعدّل أي شي في متجرك.
        </div>
        <a v-if="me.demo" href="/api/auth/salla" class="btn-primary mt-5 w-full"><AppIcon name="Plug" :size="18" /> اربط متجرك الحقيقي من سلة</a>
      </div>

      <div class="card p-6">
        <h2 class="font-bold">الباقة والاستخدام</h2>
        <div class="mt-4 flex items-center justify-between">
          <span class="badge-gold"><AppIcon name="Crown" :size="18" /> {{ me.plan.name }}</span>
          <span class="chip" :class="me.status === 'expired' && 'border-rose-500/30 bg-rose-500/10 text-rose-300'">{{ { active: 'فعّال', trial: 'فترة تجربة', expired: 'منتهي' }[me.status] }}</span>
        </div>
        <div class="mt-5">
          <div class="flex justify-between text-sm"><span class="text-muted">تشغيلات هذا الشهر</span><span class="font-semibold" dir="ltr">{{ me.usage.runs }} / {{ me.usage.limit }}</span></div>
          <div class="mt-2 h-2.5 overflow-hidden rounded-full bg-surface">
            <div class="h-full rounded-full bg-brand-500" :style="{ width: `${Math.min(100, (me.usage.runs / me.usage.limit) * 100)}%` }" />
          </div>
        </div>
        <ul class="mt-5 space-y-2 text-sm">
          <li v-for="f in me.plan.features" :key="f" class="flex items-center gap-2"><AppIcon name="CircleCheck" :size="16" class="text-brand-400" /> {{ f }}</li>
        </ul>
        <p class="mt-5 text-center text-xs text-muted">الاشتراك والفواتير تُدار من داخل حسابك في سلة.</p>
      </div>
    </div>

    <h2 class="mt-10 mb-6 text-lg font-bold">الباقات</h2>
    <PricingCards :current="me.status === 'trial' ? undefined : me.plan.id" />
  </div>
</template>
