<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const loading = ref(false)
const error = ref('')

async function tryDemo() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/demo', { method: 'POST' })
    clearNuxtData('me')
    await navigateTo('/app')
  } catch (e) {
    error.value = errMsg(e)
  } finally {
    loading.value = false
  }
}

const steps = [
  { icon: 'Plug', title: 'اربط متجرك', text: 'ثبّت رواج من متجر تطبيقات سلة بضغطة، بدون أي إعدادات تقنية.' },
  { icon: 'ScanSearch', title: 'رواج يقرأ متجرك', text: 'منتجاتك وطلباتك وعملاؤك وسلاتك المتروكة وتقييماتك، كلها تصير سياق للذكاء الاصطناعي.' },
  { icon: 'WandSparkles', title: 'اختر بطاقة وشغّلها', text: 'تحليل، أوصاف، عروض، إعلانات، حملات مواسم… نتائج مبنية على أرقامك وجاهزة للتطبيق.' },
]

const features = [
  { icon: 'Zap', title: 'قراءة وكتابة على متجرك', text: 'مو بس اقتراحات: حدّث أوصاف المنتجات وأنشئ الكوبونات من رواج مباشرة، بعد موافقتك.' },
  { icon: 'ShieldCheck', title: 'ما يتغير شي بدون إذنك', text: 'كل تعديل يطلع لك كاقتراح واضح (قبل/بعد) وأنت تضغط تطبيق أو رفض.' },
  { icon: 'Sparkles', title: 'منهجيات خبراء التسويق', text: 'كل بطاقة مبنية على منهجيات تسويق مجربة، مكيّفة للسوق السعودي ومواسمه.' },
  { icon: 'Bot', title: 'مساعد يعرف متجرك', text: 'اسأل «وش أكثر منتج ينترك في السلة؟» أو «سوّ لي كوبون لليوم الوطني» ويتصرف.' },
]

const faqs = [
  { q: 'هل رواج يعدل على متجري بدون علمي؟', a: 'لا. كل تعديل (منتج أو كوبون) يظهر لك كاقتراح، وما يتنفذ إلا لما تضغط «تطبيق».' },
  { q: 'كيف الدفع؟', a: 'الاشتراك يتم من داخل متجر تطبيقات سلة، والفاتورة تنضاف على حسابك في سلة مثل أي تطبيق.' },
  { q: 'وش البيانات اللي يقرأها رواج؟', a: 'بيانات المتجر، المنتجات، الطلبات، العملاء، السلات المتروكة، التقييمات، والكوبونات. بياناتك ما تُستخدم لأي غرض غير خدمتك.' },
  { q: 'أقدر أجرب قبل الاشتراك؟', a: 'أكيد. فيه تجربة مجانية عند التثبيت، وتقدر الحين تجرب المتجر التجريبي بدون تسجيل.' },
]

const preview = SKILLS.slice(0, 8)
</script>

<template>
  <div>
    <!-- الهيدر -->
    <header class="sticky top-0 z-30 border-b border-line/70 bg-white/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <AppLogo />
        <nav class="hidden items-center gap-7 text-sm text-muted md:flex">
          <a href="#how" class="hover:text-ink">كيف يشتغل</a>
          <a href="#cards" class="hover:text-ink">البطاقات</a>
          <a href="#pricing" class="hover:text-ink">الباقات</a>
          <a href="#faq" class="hover:text-ink">الأسئلة</a>
        </nav>
        <div class="flex items-center gap-2">
          <a href="/api/auth/salla" class="btn-ghost hidden sm:inline-flex">دخول التجار</a>
          <a :href="config.public.sallaAppStoreUrl" target="_blank" rel="noopener" class="btn-primary">ثبّت من سلة</a>
        </div>
      </div>
    </header>

    <!-- الواجهة الرئيسية -->
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_70%_-10%,var(--color-brand-100),transparent),radial-gradient(40rem_24rem_at_0%_20%,#ccfbf1,transparent)]" />
      <div class="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-24">
        <div>
          <span class="chip"><AppIcon name="Sparkles" :size="14" /> مصمم لتجار سلة</span>
          <h1 class="mt-5 text-4xl leading-tight font-bold tracking-tight sm:text-5xl sm:leading-tight">
            خلّ متجرك
            <span class="bg-gradient-to-l from-brand-600 to-accent-500 bg-clip-text text-transparent">يروج</span>
            <br>بقرارات مبنية على أرقامك
          </h1>
          <p class="mt-5 max-w-xl text-lg leading-8 text-muted">
            رواج يقرأ متجرك في سلة ويحوّل بياناته إلى تحليلات وعروض وأوصاف وإعلانات وحملات جاهزة، ويطبّقها على متجرك بضغطة زر.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a :href="config.public.sallaAppStoreUrl" target="_blank" rel="noopener" class="btn-primary px-6 py-3 text-base">
              <AppIcon name="Plug" :size="18" /> ثبّت رواج مجانًا
            </a>
            <button class="btn-secondary px-6 py-3 text-base" :disabled="loading" @click="tryDemo">
              <AppIcon :name="loading ? 'Loader' : 'Store'" :spin="loading" :size="18" /> جرّب المتجر التجريبي
            </button>
          </div>
          <p v-if="error" class="mt-3 text-sm text-rose-600">{{ error }}</p>
          <p v-else-if="route.query.login" class="mt-3 text-sm text-amber-700">سجّل دخولك عبر سلة أو جرّب المتجر التجريبي.</p>
          <p class="mt-4 text-sm text-muted">بدون بطاقة ائتمانية · الفوترة من داخل سلة · إلغاء في أي وقت</p>
        </div>

        <!-- معاينة البطاقات -->
        <div class="relative">
          <div class="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/50 to-accent-400/20 blur-2xl" />
          <div class="card p-4 sm:p-5">
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm font-semibold"><AppIcon name="LayoutGrid" :size="18" class="text-brand-600" /> بطاقاتك التسويقية</div>
              <span class="chip bg-emerald-50 text-emerald-700">متصل بسلة</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="s in preview.slice(0, 6)" :key="s.slug" class="rounded-2xl border border-line p-3.5">
                <div class="icon-tile size-9 rounded-xl" :class="TONES[s.tone].tile"><AppIcon :name="s.icon" :size="18" /></div>
                <div class="mt-2.5 text-sm font-semibold">{{ s.title }}</div>
                <div class="mt-0.5 line-clamp-1 text-xs text-muted">{{ s.tagline }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- كيف يشتغل -->
    <section id="how" class="border-y border-line bg-surface py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 class="text-center text-3xl font-bold">ثلاث خطوات وتبدأ</h2>
        <div class="mt-12 grid gap-5 md:grid-cols-3">
          <div v-for="(s, i) in steps" :key="s.title" class="card p-6">
            <div class="flex items-center gap-3">
              <div class="icon-tile bg-brand-600 text-white"><AppIcon :name="s.icon" /></div>
              <span class="text-sm font-bold text-brand-600">الخطوة {{ num(i + 1) }}</span>
            </div>
            <h3 class="mt-4 text-lg font-bold">{{ s.title }}</h3>
            <p class="mt-2 leading-7 text-muted">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- البطاقات -->
    <section id="cards" class="py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-bold">{{ num(SKILLS.length) }} بطاقة تسويقية جاهزة</h2>
          <p class="mt-3 text-lg text-muted">كل بطاقة خبير تسويق متخصص، يشتغل على بيانات متجرك أنت.</p>
        </div>
        <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="s in SKILLS" :key="s.slug" class="card card-hover p-5">
            <div class="icon-tile" :class="TONES[s.tone].tile"><AppIcon :name="s.icon" /></div>
            <h3 class="mt-4 font-bold">{{ s.title }}</h3>
            <p class="mt-1.5 text-sm leading-6 text-muted">{{ s.tagline }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- المزايا -->
    <section class="bg-ink py-20 text-white">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 class="text-center text-3xl font-bold">مو مجرد شات، رواج متصل بمتجرك</h2>
        <div class="mt-12 grid gap-5 sm:grid-cols-2">
          <div v-for="f in features" :key="f.title" class="rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-6">
            <div class="icon-tile bg-white/10 text-accent-400"><AppIcon :name="f.icon" /></div>
            <h3 class="mt-4 text-lg font-bold">{{ f.title }}</h3>
            <p class="mt-2 leading-7 text-white/70">{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- الباقات -->
    <section id="pricing" class="py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="text-center">
          <h2 class="text-3xl font-bold">باقات تناسب حجم متجرك</h2>
          <p class="mt-3 text-muted">الاشتراك والفوترة من داخل متجر تطبيقات سلة</p>
        </div>
        <div class="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="p in PLANS" :key="p.id"
            class="card relative flex flex-col p-6"
            :class="p.highlighted && 'border-brand-400 ring-4 ring-brand-100'"
          >
            <span v-if="p.highlighted" class="chip absolute -top-3 right-6 bg-brand-600 text-white">الأكثر طلبًا</span>
            <h3 class="font-bold">{{ p.name }}</h3>
            <div class="mt-3 flex items-baseline gap-1">
              <span class="text-3xl font-bold">{{ p.price ? num(p.price) : 'مجانًا' }}</span>
              <span v-if="p.price" class="text-sm text-muted">ر.س / شهريًا</span>
            </div>
            <ul class="mt-5 flex-1 space-y-2.5 text-sm">
              <li v-for="f in p.features" :key="f" class="flex items-start gap-2">
                <AppIcon name="CircleCheck" :size="18" class="mt-0.5 shrink-0 text-accent-500" /> {{ f }}
              </li>
            </ul>
            <a :href="config.public.sallaAppStoreUrl" target="_blank" rel="noopener" class="mt-6" :class="p.highlighted ? 'btn-primary' : 'btn-secondary'">اشترك من سلة</a>
          </div>
        </div>
      </div>
    </section>

    <!-- الأسئلة -->
    <section id="faq" class="border-t border-line bg-surface py-20">
      <div class="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 class="text-center text-3xl font-bold">أسئلة شائعة</h2>
        <div class="mt-10 space-y-3">
          <details v-for="f in faqs" :key="f.q" class="card group p-5">
            <summary class="flex cursor-pointer list-none items-center justify-between font-semibold">
              {{ f.q }}
              <AppIcon name="ChevronLeft" :size="18" class="text-muted transition group-open:-rotate-90" />
            </summary>
            <p class="mt-3 leading-7 text-muted">{{ f.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- الخاتمة -->
    <section class="py-20">
      <div class="mx-auto max-w-4xl px-4 sm:px-6">
        <div class="rounded-[2rem] bg-gradient-to-l from-brand-700 to-brand-500 p-10 text-center text-white shadow-xl shadow-brand-600/20">
          <h2 class="text-3xl font-bold">جاهز تخلي متجرك يروج؟</h2>
          <p class="mt-3 text-white/80">ثبّت رواج من سلة وابدأ بأول تحليل لمتجرك خلال دقيقة.</p>
          <div class="mt-7 flex flex-wrap justify-center gap-3">
            <a :href="config.public.sallaAppStoreUrl" target="_blank" rel="noopener" class="btn bg-white px-6 py-3 text-brand-700 hover:bg-brand-50">ثبّت من سلة</a>
            <button class="btn border border-white/30 px-6 py-3 text-white hover:bg-white/10" :disabled="loading" @click="tryDemo">جرّب المتجر التجريبي</button>
          </div>
        </div>
      </div>
    </section>

    <footer class="border-t border-line py-8">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted sm:flex-row sm:px-6">
        <AppLogo />
        <span>© {{ new Date().getFullYear() }} رواج. جميع الحقوق محفوظة.</span>
      </div>
    </footer>
  </div>
</template>
