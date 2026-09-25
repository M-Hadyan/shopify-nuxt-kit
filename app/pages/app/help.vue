<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'الشروحات · رواج' })

const guides = [
  { icon: 'LayoutDashboard', title: 'مركز القيادة', to: '/app', text: 'يعرض مبيعاتك ومتوسط الطلب والسلات المتروكة والتقييم. غيّر الفترة (أسبوعي / شهري / سنوي) من «فترة التقرير».' },
  { icon: 'LayoutGrid', title: 'البطاقات التسويقية', to: '/app/skills', text: 'كل بطاقة خبير متخصص. اختر بطاقة، عبّ المدخلات (اختياري)، واضغط «شغّل». النتيجة تنكتب قدامك وتنحفظ في السجل.' },
  { icon: 'Package', title: 'تحسين المنتجات', to: '/app/products', text: 'اضغط «حسّن بالذكاء الاصطناعي» على أي منتج، اختر الأسلوب، وراجع الاسم والوصف ومعاينة قوقل. اختر الحقول واضغط «طبّق على متجري».' },
  { icon: 'Bot', title: 'مساعد رواج', to: '/app/assistant', text: 'اسأل عن متجرك بلغتك، مثل: «وش أكثر منتج ينترك في السلة؟». إذا اقترح تعديل أو كوبون، يطلع لك قبل/بعد ولا يتنفذ إلا بموافقتك.' },
  { icon: 'History', title: 'السجل', to: '/app/history', text: 'كل النتائج السابقة محفوظة. تقدر تنسخها أو تحملها أو تعيد تشغيل البطاقة.' },
  { icon: 'Crown', title: 'الباقة والفوترة', to: '/app/settings', text: 'الاشتراك يتم من متجر تطبيقات سلة. كل باقة لها عدد تشغيلات شهري، والتشغيل اللي يفشل ما ينحسب عليك.' },
]
</script>

<template>
  <div>
    <section class="card-hero p-6 sm:p-7">
      <span class="chip"><AppIcon name="CircleHelp" :size="15" /> الشروحات</span>
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
