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
        :content="isOptimizing ? thinkingContent : formattedContent"
        @copy="handleCopy"
        :class="{ 'thinking-animation': isOptimizing }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
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
  isOptimizing?: boolean
  selectedIterateTemplate: any // 使用any类型避免与Template冲突
  versions: OptimizeVersion[]
  currentVersionId: number
}>()

// 思考流程文本
const thinkingSteps = [
  "让我分析一下这个问题...首先，这个问题涉及到几个有趣的方面。表面上看似简单，但深入思考后发现有多个层次需要考虑。",
  "这让我想到之前遇到的类似情况，但是等等...这次似乎有些重要的不同。我需要仔细理清这些差异。",
  "有趣的是，当我从另一个角度看这个问题时，发现了一些新的可能性。这些新的见解可能会带来更好的解决方案。",
  "让我把这些想法串联起来...是的，现在我看到了一个更完整的图景。这些元素之间的联系开始变得清晰了。",
  "不过等等，我是否忽略了什么重要的因素？让我再检查一下假设...好的，看来基本面都考虑到了。",
  "现在我可以开始组织一个更有条理的回应了..."
]

const currentThinkingStep = ref(0)
const thinkingInterval = ref<number | null>(null)

// 当处于优化中状态时，展示思考流程
const thinkingContent = computed(() => {
  const steps = thinkingSteps.slice(0, currentThinkingStep.value + 1)
  return steps.join("\n\n")
})

// 监听优化状态变化
watch(() => props.isOptimizing, (newValue) => {
  if (newValue) {
    // 开始优化时，启动思考动画
    currentThinkingStep.value = 0
    if (thinkingInterval.value !== null) {
      clearInterval(thinkingInterval.value)
    }
    thinkingInterval.value = setInterval(() => {
      if (currentThinkingStep.value < thinkingSteps.length - 1) {
        currentThinkingStep.value++
      } else {
        // 到达最后一步后重置
        if (thinkingInterval.value !== null) {
          clearInterval(thinkingInterval.value)
          thinkingInterval.value = setInterval(() => {
            currentThinkingStep.value = 0
            setTimeout(() => {
              if (currentThinkingStep.value < thinkingSteps.length - 1) {
                currentThinkingStep.value++
              }
            }, 500)
          }, 5000)
        }
      }
    }, 1000) as unknown as number
  } else {
    // 优化结束，清除思考动画定时器
    if (thinkingInterval.value !== null) {
      clearInterval(thinkingInterval.value)
      thinkingInterval.value = null
    }
  }
})

// 组件销毁时清除定时器
onUnmounted(() => {
  if (thinkingInterval.value !== null) {
    clearInterval(thinkingInterval.value)
    thinkingInterval.value = null
  }
})

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

<style scoped>
.thinking-animation {
  transition: opacity 0.5s;
  opacity: 0.8;
}
</style> 