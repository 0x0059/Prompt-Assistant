<template>
  <div class="theme-card h-full flex flex-col">
    <div class="flex-1 min-h-0 overflow-y-auto markdown-body">
      <div class="prose dark:prose-invert max-w-none p-4" v-html="renderedContent"></div>
    </div>
    <div class="flex-none border-t theme-border p-2 flex justify-end gap-2">
      <button
        class="theme-button-secondary px-3 py-1 text-sm"
        @click="$emit('copy')"
      >
        {{ t('common.copy') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'

const { t } = useI18n()

const props = defineProps<{
  content: string
}>()

const md = MarkdownIt('default', {
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
})

const renderedContent = computed(() => {
  return md.render(props.content)
})

defineEmits<{
  (e: 'copy'): void
}>()
</script>

<style>
.markdown-body {
  background-color: transparent !important;
}

.markdown-body pre {
  background-color: var(--color-bg-secondary) !important;
  border: 1px solid var(--color-border);
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.markdown-body table {
  display: table;
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  text-align: left;
}

.markdown-body table th {
  background-color: var(--color-bg-secondary);
  font-weight: 600;
}

.dark .markdown-body {
  color: var(--color-text);
}

.dark .markdown-body pre {
  background-color: var(--color-bg-secondary) !important;
}

.dark .markdown-body code {
  color: var(--color-text);
  background-color: var(--color-bg-secondary);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
}

.dark .markdown-body table th {
  background-color: var(--color-bg-secondary);
}

.markdown-body h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.markdown-body h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0;
}

.markdown-body h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1rem 0;
}
</style> 