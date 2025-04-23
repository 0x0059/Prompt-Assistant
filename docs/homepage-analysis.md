# Prompt Optimizer 首页代码分析

## 1. 文件结构

首页主要由两个文件组成：

```
web/src/
├── App.vue    # 主页面组件
└── main.js    # 应用入口文件
```

## 2. 入口文件 (main.js)

入口文件负责应用的初始化和配置：

```javascript
import { createApp } from 'vue'
import { installI18n } from '@prompt-assistant/ui'
import App from './App.vue'

import '@prompt-assistant/ui/dist/style.css'

const app = createApp(App)
installI18n(app)
app.mount('#app')
```

主要功能：
- 创建 Vue 应用实例
- 安装国际化插件
- 导入 UI 样式
- 挂载应用

## 3. 主页面组件 (App.vue)

### 3.1 组件结构

主页面采用插槽式布局，主要包含以下部分：

1. **标题区域** (`#title`)
   - 显示应用标题
   - 支持国际化

2. **操作按钮区域** (`#actions`)
   - 主题切换按钮
   - 模板管理按钮
   - 历史记录按钮
   - 模型管理按钮
   - 语言切换按钮

3. **主要内容区域**
   - 提示词输入面板
   - 优化结果面板
   - 测试面板

4. **弹窗区域** (`#modals`)
   - 模型管理弹窗
   - 模板管理弹窗
   - 历史记录抽屉

### 3.2 主要组件

1. **输入面板** (`InputPanelUI`)
   ```vue
   <InputPanelUI
     v-model="prompt"
     v-model:selectedModel="selectedOptimizeModel"
     :label="$t('promptOptimizer.originalPrompt')"
     :placeholder="$t('promptOptimizer.inputPlaceholder')"
     :model-label="$t('promptOptimizer.optimizeModel')"
     :template-label="$t('promptOptimizer.templateLabel')"
     :button-text="$t('promptOptimizer.optimize')"
     :loading-text="$t('common.loading')"
     :loading="isOptimizing"
     :disabled="isOptimizing"
     @submit="handleOptimizePrompt"
     @configModel="showConfig = true"
   >
     <!-- 模型选择插槽 -->
     <template #model-select>
       <ModelSelectUI />
     </template>
     <!-- 模板选择插槽 -->
     <template #template-select>
       <TemplateSelectUI />
     </template>
   </InputPanelUI>
   ```

2. **结果面板** (`PromptPanelUI`)
   ```vue
   <PromptPanelUI 
     v-model:optimized-prompt="optimizedPrompt"
     :is-iterating="isIterating"
     v-model:selected-iterate-template="selectedIterateTemplate"
     :versions="currentVersions"
     :current-version-id="currentVersionId"
     @iterate="handleIteratePrompt"
     @openTemplateManager="openTemplateManager"
     @switchVersion="handleSwitchVersion"
   />
   ```

3. **测试面板** (`TestPanelUI`)
   ```vue
   <TestPanelUI
     :prompt-service="promptServiceRef"
     :original-prompt="prompt"
     :optimized-prompt="optimizedPrompt"
     v-model="selectedTestModel"
     @showConfig="showConfig = true"
   />
   ```

### 3.3 状态管理

使用组合式 API 管理状态：

1. **提示词助理** (`usePromptAssistant`)
   ```typescript
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
     handleOptimizePrompt,
     handleIteratePrompt,
     handleSwitchVersion,
     saveTemplateSelection
   } = usePromptAssistant(...)
   ```

2. **模型管理器** (`useModelManager`)
   ```typescript
   const {
     showConfig,
     selectedOptimizeModel,
     selectedTestModel,
     handleModelManagerClose,
     handleModelsUpdated,
     handleModelSelect
   } = useModelManager(...)
   ```

3. **历史记录管理器** (`usePromptHistory`)
   ```typescript
   const {
     history,
     handleSelectHistory,
     handleClearHistory,
     handleDeleteChain
   } = usePromptHistory(...)
   ```

### 3.4 主题管理

```javascript
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
```

## 4. 组件依赖

主要依赖来自 `@prompt-assistant/ui` 包：

1. **UI 组件**
   - ToastUI
   - ModelManagerUI
   - ThemeToggleUI
   - OutputPanelUI
   - PromptPanelUI
   - TemplateManagerUI
   - TemplateSelectUI
   - ModelSelectUI
   - HistoryDrawerUI
   - InputPanelUI
   - MainLayoutUI
   - ContentCardUI
   - ActionButtonUI
   - TestPanelUI
   - LanguageSwitchUI

2. **组合式函数**
   - usePromptAssistant
   - usePromptTester
   - useToast
   - usePromptHistory
   - useServiceInitializer
   - useTemplateManager
   - useModelManager
   - useHistoryManager
   - useModelSelectors

3. **服务**
   - modelManager
   - templateManager
   - historyManager

## 5. 功能流程

1. **提示词优化流程**
   - 用户输入原始提示词
   - 选择优化模型和模板
   - 点击优化按钮
   - 显示优化结果
   - 支持迭代优化

2. **测试流程**
   - 选择测试模型
   - 对比原始和优化后的提示词
   - 显示测试结果

3. **模板管理流程**
   - 打开模板管理器
   - 选择或创建模板
   - 应用模板到当前提示词

4. **历史记录流程**
   - 查看历史记录
   - 重用历史提示词
   - 清除历史记录
   - 删除特定记录链 