<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'الشروحات · رواج' })

const guides = [
  { icon: 'LayoutGrid', title: 'اختر مهارة', to: '/app', text: 'عندك ٥٠ مهارة تسويقية مقسمة على ٩ تصنيفات. استخدم التصنيف أو البحث عشان تلقى اللي تبيه.' },
  { icon: 'PenLine', title: 'اكتب طلبك', to: '/app', text: 'اكتب بالضبط وش تبي، مثل: «خطة إعلانات سناب لليوم الوطني بميزانية ٣٠٠٠ ريال». لو تركته فاضي يعطيك أهم التوصيات.' },
  { icon: 'Store', title: 'بيانات متجرك', to: '/app/settings', text: 'رواج يقرأ ملخص متجرك من سلة (المنتجات، الطلبات، العملاء، التقييمات) عشان تكون النتيجة مبنية على أرقامك. ما يعدّل أي شي.' },
  { icon: 'FileText', title: 'احفظ النتيجة', to: '/app/history', text: 'حمّل النتيجة PDF أو Markdown أو انسخها. وكل النتائج محفوظة في السجل.' },
  { icon: 'Crown', title: 'الباقة والفوترة', to: '/app/settings', text: 'الاشتراك من متجر تطبيقات سلة. كل باقة لها عدد تشغيلات شهري، والتشغيل اللي يفشل ما ينحسب عليك.' },
]
</script>

<template>
  <div>
    <section class="card-hero p-6 sm:p-7">
      <span class="inline-flex items-center gap-1.5 rounded-full border border-brand-700/60 bg-brand-900/40 px-3.5 py-1.5 text-sm font-bold text-brand-300"><AppIcon name="CircleHelp" :size="16" /> الشروحات</span>
      <h1 class="mt-4 text-3xl font-extrabold">كيف تستفيد من رواج؟</h1>
      <p class="mt-3 max-w-2xl text-lg leading-8 text-muted">دليل سريع لكل جزء في المنصة.</p>
    </section>
    <div class="mt-5 grid gap-4 sm:grid-cols-2">
      <NuxtLink v-for="g in guides" :key="g.title" :to="g.to" class="card card-hover p-5">
        <div class="flex items-center gap-3">
          <div class="icon-tile bg-brand-500/15 text-brand-300"><AppIcon :name="g.icon" /></div>
          <h2 class="font-bold">{{ g.title }}</h2>
        </div>
        <p class="mt-3 text-sm leading-7 text-muted">{{ g.text }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
