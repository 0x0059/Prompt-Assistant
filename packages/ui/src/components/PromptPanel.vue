<template>
  <div class="flex flex-col h-full">
    <!-- 标题和按钮区域 -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 flex-none">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold theme-text">{{ t('prompt.optimized') }}</h3>
        <div v-if="versions && versions.length > 0" class="flex items-center gap-1">
          <button
            v-for="version in versions.slice().reverse()"
            :key="version.id"
            @click="switchVersion(version)"
            class="px-2 py-1 text-xs rounded transition-colors"
            :class="[
              currentVersionId === version.id
                ? 'font-medium theme-prompt-version-selected'
                : 'theme-prompt-version-unselected'
            ]"
          >
            V{{ version.version }}
          </button>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <!-- <button
          v-if="optimizedPrompt"
          @click="handleIterate"
          class="px-3 py-1.5 theme-button-secondary flex items-center space-x-2"
          :disabled="isIterating"
        >
          <span>{{ isIterating ? t('prompt.optimizing') : t('prompt.continueOptimize') }}</span>
        </button>
        <button
          v-if="optimizedPrompt"
          @click="copyPrompt"
          class="px-3 py-1.5 theme-button-secondary flex items-center space-x-2"
        >
          <span>{{ t('prompt.copy') }}</span>
        </button> -->
      </div>
    </div>
    
    <!-- 对话框内容区域 -->
    <div class="flex-1 min-h-0 p-[2px] overflow-hidden">
      <div class="h-full relative">
        <!-- 对话气泡容器 -->
        <div ref="chatContainer" class="h-full flex flex-col space-y-4 p-4 overflow-y-auto prompt-body">
          <!-- 用户问题气泡 -->
          <div v-if="userQuestion" class="flex justify-end">
            <div class="max-w-[80%] theme-chat-bubble-user rounded-2xl px-4 py-3 relative group">
              <button
                @click="copyText(userQuestion)"
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity theme-copy-button"
                title="复制问题"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </button>
              <div class="text-sm theme-text markdown-content" v-html="parseMarkdown(userQuestion)"></div>
            </div>
          </div>
          
          <!-- AI回答气泡 -->
          <div v-if="optimizedPrompt" class="flex justify-start">
            <div class="max-w-[80%] theme-chat-bubble-ai rounded-2xl px-4 py-3 relative group">
              <div class="text-sm theme-text markdown-content" v-html="parseMarkdown(optimizedPrompt)"></div>
              <div class="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-current/10">
                <button
                  @click="handleIterate"
                  class="px-2 py-1 text-xs rounded transition-colors theme-button-secondary flex items-center space-x-1"
                  :disabled="isIterating"
                >
                  <span>{{ isIterating ? t('prompt.optimizing') : t('prompt.continueOptimize') }}</span>
                </button>
                <button
                  @click="copyText(optimizedPrompt)"
                  class="px-2 py-1 text-xs rounded transition-colors theme-button-secondary flex items-center space-x-1"
                  title="复制回答"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                  <span>{{ t('prompt.copy') }}</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- AI思考中气泡 -->
          <div v-if="isIterating" class="flex justify-start">
            <div class="max-w-[80%] theme-chat-bubble-ai rounded-2xl px-4 py-3">
              <div class="flex items-center space-x-2">
                <div class="animate-pulse">
                  <div class="w-2 h-2 bg-current rounded-full"></div>
                </div>
                <div class="animate-pulse">
                  <div class="w-2 h-2 bg-current rounded-full"></div>
                </div>
                <div class="animate-pulse">
                  <div class="w-2 h-2 bg-current rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <!-- <div class="absolute bottom-0 left-0 right-0 p-4">
          <div class="relative">
            <textarea
              ref="promptTextarea"
              :value="userQuestion"
              @input="handleInput"
              class="w-full theme-chat-input rounded-2xl px-4 py-3 resize-none"
              :placeholder="t('prompt.optimizedPlaceholder')"
              rows="3"
            ></textarea>
          </div>
        </div> -->
      </div>
    </div>

    <!-- 迭代优化弹窗 -->
    <Modal
      v-model="showIterateInput"
      @confirm="submitIterate"
    >
      <template #title>
        {{ templateTitleText }}
      </template>
      
      <div class="space-y-4">
        <div>
          <h4 class="theme-label mb-2">{{ templateSelectText }}</h4>
          <TemplateSelect
            :modelValue="selectedIterateTemplate"
            @update:modelValue="$emit('update:selectedIterateTemplate', $event)"
            :type="templateType"
            @manage="$emit('openTemplateManager', templateType)"
          />
        </div>
        
        <div>
          <h4 class="theme-label mb-2">{{ t('prompt.iterateDirection') }}</h4>
          <textarea
            v-model="iterateInput"
            class="w-full theme-input resize-none"
            :placeholder="t('prompt.iteratePlaceholder')"
            rows="3"
          ></textarea>
        </div>
      </div>
      
      <template #footer>
        <button
          @click="cancelIterate"
          class="theme-button-secondary"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          @click="submitIterate"
          class="theme-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!iterateInput.trim() || isIterating"
        >
          {{ isIterating ? t('prompt.optimizing') : t('prompt.confirmOptimize') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, defineProps, defineEmits, computed, nextTick, watch, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import { useAutoScroll } from '../composables/useAutoScroll'
import { useClipboard } from '../composables/useClipboard'
import TemplateSelect from './TemplateSelect.vue'
import Modal from './Modal.vue'
import type {
  Template,
  PromptRecord,
  PromptRecordChain
} from '@prompt-assistant/core'

const { t } = useI18n()
const toast = useToast()
const { copyText } = useClipboard()

// 使用自动滚动组合式函数
const { elementRef: chatContainer, watchSource, forceScrollToBottom } = useAutoScroll<HTMLDivElement>({
  debug: import.meta.env.DEV,
  threshold: 10,
  enabled: true // 确保自动滚动始终启用
})

interface IteratePayload {
  originalPrompt: string;
  iterateInput: string;
}

const props = defineProps({
  optimizedPrompt: {
    type: String,
    default: ''
  },
  isIterating: {
    type: Boolean,
    default: false
  },
  selectedIterateTemplate: {
    type: Object as () => Template | null,
    default: null
  },
  versions: {
    type: Array as () => PromptRecord[],
    default: () => []
  },
  currentVersionId: {
    type: String,
    default: ''
  },
  userQuestion: {
    type: String,
    default: ''
  }
})

// 监听optimizedPrompt变化，强制滚动到底部
watch(() => props.optimizedPrompt, () => {
  nextTick(() => {
    forceScrollToBottom()
  })
}, { immediate: true })

// 监听isIterating状态变化
watch(() => props.isIterating, (newVal) => {
  if (newVal) {
    nextTick(() => {
      forceScrollToBottom()
    })
  }
})

// 监听userQuestion变化
watch(() => props.userQuestion, () => {
  nextTick(() => {
    forceScrollToBottom()
  })
})

// 组件挂载后确保滚动到底部
onMounted(() => {
  nextTick(() => {
    forceScrollToBottom()
  })
})

// 添加MutationObserver监听内容变化
onMounted(() => {
  if (chatContainer.value) {
    const observer = new MutationObserver(() => {
      nextTick(() => {
        forceScrollToBottom()
      })
    })
    
    observer.observe(chatContainer.value, {
      childList: true,
      subtree: true,
      characterData: true
    })
  }
})

const emit = defineEmits<{
  'update:optimizedPrompt': [value: string];
  'iterate': [payload: IteratePayload];
  'openTemplateManager': [type: 'optimize' | 'iterate'];
  'update:selectedIterateTemplate': [template: Template | null];
  'switchVersion': [version: PromptRecord];
}>()

const showIterateInput = ref(false)
const iterateInput = ref('')
const templateType = ref<'optimize' | 'iterate'>('iterate')

// 计算标题文本
const templateTitleText = computed(() => {
  return t('prompt.iterateTitle')
})

// 计算模板选择标题
const templateSelectText = computed(() => {
  return t('prompt.selectIterateTemplate')
})

// 处理输入变化
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:optimizedPrompt', target.value)
}

// 复制提示词
const copyPrompt = async () => {
  if (!props.optimizedPrompt) return
  
  copyText(props.optimizedPrompt)
}

const handleIterate = () => {
  if (!props.selectedIterateTemplate) {
    toast.error(t('prompt.error.noTemplate'))
    return
  }
  showIterateInput.value = true
}

const cancelIterate = () => {
  showIterateInput.value = false
  iterateInput.value = ''
}

const submitIterate = () => {
  if (!iterateInput.value.trim()) return
  if (!props.selectedIterateTemplate) {
    toast.error(t('prompt.error.noTemplate'))
    return
  }
  
  emit('iterate', {
    originalPrompt: props.optimizedPrompt,
    iterateInput: iterateInput.value.trim()
  })
  
  // 重置输入
  iterateInput.value = ''
  showIterateInput.value = false
}

// 添加版本切换函数
const switchVersion = (version: PromptRecord) => {
  if (version.id === props.currentVersionId) return
  emit('switchVersion', version)
  
  // 版本切换后强制滚动到底部，确保用户能看到新版本的内容
  nextTick(() => {
    forceScrollToBottom()
  })
}

// 简单的 Markdown 解析函数
const parseMarkdown = (text: string) => {
  if (!text) return ''
  
  // 处理标题
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  
  // 处理加粗和斜体
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 处理代码块
  text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  text = text.replace(/`(.*?)`/g, '<code>$1</code>')
  
  // 处理列表
  text = text.replace(/^\s*[-*+]\s+(.*$)/gm, '<li>$1</li>')
  text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
  
  // 处理引用
  text = text.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
  
  // 处理链接
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  // 处理换行
  text = text.replace(/\n/g, '<br>')
  
  return text
}
</script>

<style scoped>
.prompt-body {
  height: calc(100vh - 29.45rem);
  overflow-y: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* 增加iOS滚动支持 */
}

/* 自定义滚动条样式 */
.prompt-body::-webkit-scrollbar {
  width: 6px;
}

.prompt-body::-webkit-scrollbar-track {
  background: rgba(139, 92, 246, 0.1);
  border-radius: 3px;
}

.prompt-body::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}

.prompt-body::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.4);
}

/* 基础样式 */
textarea {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

textarea::-webkit-scrollbar {
  display: none;
}

/* 对话气泡样式 */
.theme-chat-bubble-user {
  background-color: rgb(139, 92, 246);
  color: white;
  position: relative;
}

.theme-chat-bubble-user::after {
  content: '';
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-left: 8px solid rgb(139, 92, 246);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
}

.theme-chat-bubble-ai {
  background-color: rgba(139, 92, 246, 0.1);
  color: rgb(139, 92, 246);
  position: relative;
}

.theme-chat-bubble-ai::after {
  content: '';
  position: absolute;
  left: -8px;
  top: 15px;
  border-right: 8px solid rgba(139, 92, 246, 0.1);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
}

/* 复制按钮样式 */
.theme-copy-button {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 4px;
  color: currentColor;
  transition: all 0.2s ease;
  z-index: 10;
}

.theme-copy-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

/* 输入框样式 */
.theme-chat-input {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: inherit;
  transition: all 0.3s ease;
}

.theme-chat-input:focus {
  border-color: rgb(139, 92, 246);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
  outline: none;
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Markdown 样式 */
.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
  margin: 0.5em 0;
  font-weight: 600;
}

.markdown-content :deep(h2) {
  font-size: 1.3em;
  margin: 0.5em 0;
  font-weight: 600;
}

.markdown-content :deep(h3) {
  font-size: 1.1em;
  margin: 0.5em 0;
  font-weight: 600;
}

.markdown-content :deep(p) {
  margin: 0.5em 0;
}

.markdown-content :deep(ul) {
  margin: 0.5em 0;
  padding-left: 1.5em;
  list-style-type: disc;
}

.markdown-content :deep(li) {
  margin: 0.25em 0;
}

.markdown-content :deep(code) {
  background-color: rgba(139, 92, 246, 0.1);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: rgba(139, 92, 246, 0.1);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid rgba(139, 92, 246, 0.5);
  margin: 0.5em 0;
  padding: 0.5em 1em;
  background-color: rgba(139, 92, 246, 0.1);
}

.markdown-content :deep(a) {
  color: rgb(139, 92, 246);
  text-decoration: underline;
}

.markdown-content :deep(strong) {
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
}

/* 代码块滚动条样式 */
.markdown-content :deep(pre)::-webkit-scrollbar {
  height: 6px;
}

.markdown-content :deep(pre)::-webkit-scrollbar-track {
  background: rgba(139, 92, 246, 0.1);
  border-radius: 3px;
}

.markdown-content :deep(pre)::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}

.markdown-content :deep(pre)::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.4);
}

/* 气泡框底部按钮样式 */
.theme-button-secondary {
  background-color: rgba(139, 92, 246, 0.1);
  color: currentColor;
  transition: all 0.2s ease;
}

.theme-button-secondary:hover {
  background-color: rgba(139, 92, 246, 0.2);
}

.theme-button-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>