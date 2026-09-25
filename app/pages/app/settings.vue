<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'الإعدادات والباقة · رواج' })

const config = useRuntimeConfig()
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
            <dd><span class="chip" :class="me.demo ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'">{{ me.demo ? 'متجر تجريبي' : 'متصل بسلة' }}</span></dd>
          </div>
        </dl>
        <div class="mt-5 rounded-xl bg-surface p-4 text-sm text-muted">
          <div class="mb-1 font-semibold text-ink">الصلاحيات</div>
          قراءة: المتجر، المنتجات، الطلبات، العملاء، السلات المتروكة، التقييمات.<br>
          كتابة: المنتجات (الاسم، الوصف، SEO، السعر) والكوبونات، وبعد موافقتك فقط.
        </div>
        <a v-if="me.demo" href="/api/auth/salla" class="btn-primary mt-5 w-full"><AppIcon name="Plug" :size="18" /> اربط متجرك الحقيقي من سلة</a>
      </div>

      <div class="card p-6">
        <h2 class="font-bold">الباقة والاستخدام</h2>
        <div class="mt-4 flex items-baseline justify-between">
          <span class="text-2xl font-bold">{{ me.plan.name }}</span>
          <span class="text-sm text-muted">{{ me.plan.price ? `${num(me.plan.price)} ر.س / شهريًا` : 'مجانًا' }}</span>
        </div>
        <div class="mt-5">
          <div class="flex justify-between text-sm"><span class="text-muted">تشغيلات هذا الشهر</span><span class="font-semibold">{{ num(me.usage.runs) }} / {{ num(me.usage.limit) }}</span></div>
          <div class="mt-2 h-2.5 overflow-hidden rounded-full bg-surface">
            <div class="h-full rounded-full bg-gradient-to-l from-brand-600 to-accent-500" :style="{ width: `${Math.min(100, (me.usage.runs / me.usage.limit) * 100)}%` }" />
          </div>
        </div>
        <ul class="mt-5 space-y-2 text-sm">
          <li v-for="f in me.plan.features" :key="f" class="flex items-center gap-2"><AppIcon name="CircleCheck" :size="16" class="text-accent-500" /> {{ f }}</li>
        </ul>
        <a :href="config.public.sallaAppStoreUrl" target="_blank" rel="noopener" class="btn-secondary mt-6 w-full">ترقية الباقة من سلة</a>
        <p class="mt-3 text-center text-xs text-muted">الاشتراك والفواتير تُدار من داخل حسابك في سلة.</p>
      </div>
    </div>

    <h2 class="mt-10 text-lg font-bold">كل الباقات</h2>
    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="p in PLANS" :key="p.id" class="card p-5" :class="p.id === me.plan.id && 'border-brand-400 ring-4 ring-brand-100'">
        <div class="flex items-center justify-between">
          <h3 class="font-bold">{{ p.name }}</h3>
          <span v-if="p.id === me.plan.id" class="chip">باقتك</span>
        </div>
        <div class="mt-2 text-xl font-bold">{{ p.price ? `${num(p.price)} ر.س` : 'مجانًا' }}</div>
        <div class="text-sm text-muted">{{ num(p.runsPerMonth) }} تشغيل شهريًا</div>
      </div>
    </div>
  </div>
</template>
