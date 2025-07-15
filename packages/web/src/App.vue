<template>
  <MainLayoutUI>
    <!-- 标题插槽 -->
    <template #title>
      {{ $t('promptAssistant.title') }}
    </template>

    <!-- 操作按钮插槽 -->
    <template #actions>
      <ThemeToggleUI />
      <ActionButtonUI
        icon="📝"
        :text="$t('nav.templates')"
        @click="openTemplateManager('optimize')"
      />
      <ActionButtonUI
        icon="📜"
        :text="$t('nav.history')"
        @click="showHistory = true"
      />
      <ActionButtonUI
        icon="⚙️"
        :text="$t('nav.modelManager')"
        @click="showConfig = true"
      />
      <LanguageSwitchUI />
    </template>

    <!-- 主要内容插槽 -->
    <template #prompt-panel>
      <!-- 提示词区 -->
      <ContentCardUI>
        <!-- 优化结果区域 -->
        <div class="flex-1 min-h-0 overflow-y-auto">
          <PromptPanelUI 
            :talk-content="talkContent"
            v-model:optimized-prompt="optimizedPrompt"
            :is-iterating="isIterating"
            v-model:selected-iterate-template="selectedIterateTemplate"
            :versions="currentVersions"
            :current-version-id="currentVersionId"
            @iterate="handleIteratePrompt"
            @openTemplateManager="openTemplateManager"
            @switchVersion="handleSwitchVersion"
            :loading="isOptimizing"
          />
        </div>
        <!-- 输入区域 -->
        <div class="flex-none">
          <InputPanelUI
            v-model="prompt"
            v-model:selectedModel="selectedOptimizeModel"
            :label="$t('promptAssistant.originalPrompt')"
            :placeholder="$t('promptAssistant.inputPlaceholder')"
            :model-label="$t('promptAssistant.optimizeModel')"
            :template-label="$t('promptAssistant.templateLabel')"
            :button-text="$t('promptAssistant.optimize')"
            :loading-text="$t('common.loading')"
            :loading="isOptimizing"
            :disabled="isOptimizing"
            @submit="handleOptimizePrompt"
            @configModel="showConfig = true"
          >
            <template #model-select>
              <ModelSelectUI
                ref="optimizeModelSelect"
                :modelValue="selectedOptimizeModel"
                @update:modelValue="selectedOptimizeModel = $event"
                :disabled="isOptimizing"
                @config="showConfig = true"
              />
            </template>
            <template #template-select>
              <TemplateSelectUI
                v-model="selectedOptimizeTemplate"
                type="optimize"
                @manage="openTemplateManager('optimize')"
                @select="handleTemplateSelect"
              />
            </template>
          </InputPanelUI>
        </div>

        
      </ContentCardUI>
    </template>

    <!-- 测试区域 -->
    <template #test-panel>
      <TestPanelUI
        :prompt-service="promptServiceRef"
        :original-prompt="prompt"
        :optimized-prompt="optimizedPrompt"
        v-model="selectedTestModel"
        @showConfig="showConfig = true"
      />
    </template>

    <!-- 弹窗插槽 -->
    <template #modals>
      <!-- 配置弹窗 -->
      <Teleport to="body">
        <ModelManagerUI
          v-if="showConfig"
          @close="handleModelManagerClose"
          @modelsUpdated="handleModelsUpdated"
          @select="handleModelSelect"
        />
      </Teleport>

      <!-- 提示词管理弹窗 -->
      <Teleport to="body">
        <TemplateManagerUI
          v-if="showTemplates"
          :template-type="currentType"
          :selected-optimize-template="selectedOptimizeTemplate"
          :selected-iterate-template="selectedIterateTemplate"
          @close="handleTemplateManagerClose"
          @select="handleTemplateSelect"
        />
      </Teleport>

      <!-- 历史记录弹窗 -->
      <HistoryDrawerUI
        v-model:show="showHistory"
        :history="history"
        @reuse="handleSelectHistory"
        @clear="handleClearHistory"
        @deleteChain="handleDeleteChain"
      />
    </template>
  </MainLayoutUI>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  // UI组件
  ToastUI,
  ModelManagerUI,
  ThemeToggleUI,
  OutputPanelUI,
  PromptPanelUI,
  TemplateManagerUI,
  TemplateSelectUI,
  ModelSelectUI,
  HistoryDrawerUI,
  InputPanelUI,
  MainLayoutUI,
  ContentCardUI,
  ActionButtonUI,
  TestPanelUI,
  LanguageSwitchUI,
  // composables
  usePromptAssistant,
  usePromptTester,
  useToast,
  usePromptHistory,
  useServiceInitializer,
  useTemplateManager,
  useModelManager,
  useHistoryManager,
  useModelSelectors,
  // 服务
  modelManager,
  templateManager,
  historyManager
} from '@prompt-assistant/ui'

// 初始化主题
onMounted(() => {
  // 检查本地存储的主题偏好
  const savedTheme = localStorage.getItem('theme')
  
  // 移除所有主题类
  document.documentElement.classList.remove('dark', 'theme-blue', 'theme-green', 'theme-purple')
  
  // 应用保存的主题或系统偏好
  if (savedTheme) {
    document.documentElement.classList.add(savedTheme)
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  }
})

// 初始化 toast
const toast = useToast()
const messages = ref<{ role: 'user' | 'ai', content: string }[]>([])

// 初始化服务
const {
  promptServiceRef
} = useServiceInitializer(modelManager, templateManager, historyManager)

// 初始化模型选择器
const {
  optimizeModelSelect,
  testModelSelect
} = useModelSelectors()

// 初始化模型管理器
const {
  showConfig,
  selectedOptimizeModel,
  selectedTestModel,
  handleModelManagerClose,
  handleModelsUpdated,
  handleModelSelect
} = useModelManager({
  modelManager,
  optimizeModelSelect,
  testModelSelect
})

// 初始化组合式函数
const {
  prompt,
  optimizedPrompt,
  isOptimizing,
  isIterating,
  selectedOptimizeTemplate,
  selectedIterateTemplate,
  currentVersions,
  currentVersionId,
  currentChainId,
  talkContent,
  handleOptimizePrompt,
  handleIteratePrompt,
  handleSwitchVersion,
  saveTemplateSelection
} = usePromptAssistant(
  modelManager,
  templateManager,
  historyManager,
  promptServiceRef,
  selectedOptimizeModel,
  selectedTestModel
)

// 初始化历史记录管理器
const {
  history,
  handleSelectHistory: handleSelectHistoryBase,
  handleClearHistory: handleClearHistoryBase,
  handleDeleteChain: handleDeleteChainBase
} = usePromptHistory(
  historyManager,
  prompt,
  optimizedPrompt,
  currentChainId,
  currentVersions,
  currentVersionId
)

// 初始化历史记录管理器UI
const {
  showHistory,
  handleSelectHistory,
  handleClearHistory,
  handleDeleteChain
} = useHistoryManager(
  historyManager,
  prompt,
  optimizedPrompt,
  currentChainId,
  currentVersions,
  currentVersionId,
  handleSelectHistoryBase,
  handleClearHistoryBase,
  handleDeleteChainBase
)

// 初始化模板管理器
const {
  showTemplates,
  currentType,
  handleTemplateSelect,
  openTemplateManager,
  handleTemplateManagerClose
} = useTemplateManager({
  selectedOptimizeTemplate,
  selectedIterateTemplate,
  saveTemplateSelection,
  templateManager
})
</script>