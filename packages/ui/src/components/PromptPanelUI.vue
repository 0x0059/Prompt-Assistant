<template>
  <div class="flex flex-col h-full gap-4">
    <!-- 版本控制区域 -->
    <div class="flex-none flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="text-sm theme-text-secondary">{{ t('common.version') }}</span>
        <div class="flex items-center gap-1">
          <button
            v-for="version in versions"
            :key="version.id"
            class="px-2 py-1 text-sm rounded"
            :class="[
              version.id === currentVersionId
                ? 'theme-button-primary'
                : 'theme-button-secondary'
            ]"
            @click="$emit('switchVersion', version.id)"
          >
            V{{ version.id }}
          </button>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <TemplateSelectUI
          v-model="selectedIterateTemplate"
          type="iterate"
          @manage="$emit('openTemplateManager', 'iterate')"
          @select="$emit('templateSelect', $event)"
        />
        <button
          class="theme-button-primary px-4 py-1"
          :class="{ 'opacity-50 cursor-not-allowed': isIterating }"
          :disabled="isIterating"
          @click="$emit('iterate')"
        >
          {{ isIterating ? t('common.loading') : t('promptAssistant.iterate') }}
        </button>
      </div>
    </div>

    <!-- 优化结果展示区域 -->
    <div class="flex-1 min-h-0">
      <OutputPanelUI
        :content="formattedContent"
        @copy="handleCopy"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@vueuse/core'
import { useToast } from '../composables/useToast'
import { TemplateSelectUI, OutputPanelUI } from '../index'
import type { OptimizeVersion } from '../types'

const { t } = useI18n()
const { copy } = useClipboard()
const toast = useToast()

const props = defineProps<{
  optimizedPrompt: string
  isIterating: boolean
  selectedIterateTemplate: string
  versions: OptimizeVersion[]
  currentVersionId: number
}>()

const formattedContent = computed(() => {
  if (!props.optimizedPrompt) return ''
  
  // 将优化后的提示词转换为markdown格式
  const lines = props.optimizedPrompt.split('\n')
  let formatted = ''
  
  // 处理标题
  if (lines[0].startsWith('# ')) {
    formatted += lines[0] + '\n\n'
    lines.shift()
  } else {
    formatted += `# ${t('prompt.optimized')}\n\n`
  }
  
  // 处理其他内容
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 处理表格标题行
    if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
      formatted += line + '\n'
      if (i + 1 < lines.length && lines[i + 1].includes('---')) {
        formatted += lines[i + 1] + '\n'
        i++
      }
    }
    // 处理代码块
    else if (line.startsWith('```')) {
      formatted += line + '\n'
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        formatted += lines[i] + '\n'
        i++
      }
      if (i < lines.length) {
        formatted += lines[i] + '\n'
      }
    }
    // 处理普通文本
    else {
      formatted += line + '\n'
    }
  }
  
  return formatted
})

const handleCopy = async () => {
  await copy(props.optimizedPrompt)
  toast.success(t('common.copied'))
}

defineEmits<{
  (e: 'iterate'): void
  (e: 'openTemplateManager', type: string): void
  (e: 'templateSelect', template: string): void
  (e: 'switchVersion', id: number): void
}>()
</script> 