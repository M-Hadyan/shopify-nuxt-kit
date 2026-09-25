<script setup lang="ts">
const props = defineProps<{ text: string }>()
const done = ref(false)
async function copy() {
  await navigator.clipboard.writeText(props.text)
  done.value = true
  setTimeout(() => (done.value = false), 1500)
}
</script>

<template>
  <button class="btn-secondary" type="button" @click="copy">
    <AppIcon :name="done ? 'Check' : 'Copy'" :size="16" /> {{ done ? 'تم النسخ' : 'نسخ' }}
  </button>
</template>
