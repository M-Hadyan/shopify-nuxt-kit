<script setup lang="ts">
import { marked } from 'marked'

const props = defineProps<{ source: string }>()
const html = ref('')

// DOMPurify يعمل في المتصفح فقط
watchEffect(async () => {
  const raw = marked.parse(props.source ?? '', { async: false, gfm: true, breaks: false }) as string
  if (import.meta.client) {
    const { default: DOMPurify } = await import('dompurify')
    html.value = DOMPurify.sanitize(raw)
  }
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="prose prose-invert max-w-none overflow-x-auto prose-headings:font-bold prose-headings:text-ink prose-a:text-brand-400 prose-strong:text-ink prose-table:text-sm prose-th:bg-surface prose-th:p-2 prose-td:p-2 prose-th:text-start" v-html="html" />
</template>
