# 🌐 国际化（i18n）指南

> 本文档提供了 Prompt Assistant 项目国际化实现的详细指南和最佳实践，帮助开发者正确实现和维护多语言支持。

## 📋 目录

1. [概述](#概述)
2. [翻译文件结构](#翻译文件结构)
3. [键名命名规范](#键名命名规范)
4. [在组件中使用 i18n](#在组件中使用-i18n)
5. [检测硬编码文本](#检测硬编码文本)
6. [添加新语言](#添加新语言)
7. [常见问题与解决方案](#常见问题与解决方案)
8. [翻译工作流程](#翻译工作流程)

## 📖 概述

Prompt Assistant 项目使用 [vue-i18n](https://vue-i18n.intlify.dev/) 实现国际化支持，目前支持以下语言：

| 语言代码 | 语言名称 | 文件路径 | 完成度 |
|---------|---------|---------|--------|
| `zh-CN` | 简体中文 | `packages/ui/src/i18n/locales/zh-CN.ts` | 100% |
| `en-US` | 英文(美国) | `packages/ui/src/i18n/locales/en-US.ts` | 100% |

国际化资源集中管理在 UI 包中，位于 `packages/ui/src/i18n/` 目录下。这样设计的好处是保证 Web 应用和浏览器扩展使用统一的翻译资源。

## 📂 翻译文件结构

翻译文件采用分层结构，按模块和功能组织翻译键。每个语言对应一个 TypeScript 文件：

```typescript
// packages/ui/src/i18n/locales/zh-CN.ts
export default {
  // 通用文本
  common: {
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    // ...更多通用文本
  },
  
  // 导航模块
  nav: {
    home: '首页',
    settings: '设置',
    history: '历史记录',
    // ...更多导航文本
  },
  
  // 提示词助理模块
  promptAssistant: {
    title: '提示词助理',
    inputPlaceholder: '请输入需要优化的提示词...',
    optimizeButton: '优化提示词',
    // ...更多提示词助理相关文本
  },
  
  // 设置模块
  settings: {
    title: '设置',
    language: {
      label: '语言',
      options: {
        zhCN: '简体中文',
        enUS: '英文(美国)',
      },
    },
    theme: {
      label: '主题',
      options: {
        light: '浅色',
        dark: '深色',
        system: '跟随系统',
      },
    },
    // ...更多设置相关文本
  },
  
  // ...更多模块
}
```

## 🔤 键名命名规范

为保持项目一致性，我们采用以下命名规范：

### 1. 基本规则

- **使用点分隔的命名空间**：`module.submodule.key`
- **命名空间反映功能模块**：如 `nav`、`promptAssistant`、`settings` 等
- **通用文本放在 `common` 命名空间下**
- **键名使用驼峰式命名**：如 `lastModified`、`noDescription`
- **相关功能使用嵌套对象组织**：如 `settings.theme.options.dark`

### 2. 命名示例

✅ **推荐写法**：
```typescript
{
  common: {
    save: '保存',
    cancel: '取消',
  },
  promptAssistant: {
    title: '提示词助理',
    inputPlaceholder: '请输入需要优化的prompt...',
  }
}
```

❌ **不推荐写法**：
```typescript
{
  // 不推荐：缺少模块分组
  save: '保存',
  cancel: '取消',
  
  // 不推荐：不一致的命名风格
  prompt_assistant_title: '提示词助理',
  prompt-input-placeholder: '请输入...',
}
```

### 3. 参数使用规范

当需要在翻译中包含变量时，使用大括号标记参数：

```typescript
// 定义
{
  common: {
    itemCount: '共 {count} 个项目',
    welcome: '{name}，欢迎回来！',
    version: 'v{version}',
  }
}

// 使用
t('common.itemCount', { count: 5 }) // -> "共 5 个项目"
```

## 💻 在组件中使用 i18n

### 1. 在模板中使用

最简单的方式是在模板中直接使用 `$t` 函数：

```vue
<template>
  <div class="header">
    <h1>{{ $t('promptAssistant.title') }}</h1>
    <button>{{ $t('common.save') }}</button>
    <p>{{ $t('common.itemCount', { count: items.length }) }}</p>
  </div>
</template>
```

### 2. 在脚本中使用

使用 `useI18n` 组合式函数来访问翻译功能：

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Composer } from 'vue-i18n';

// 导入i18n实例，指定类型以解决TypeScript类型问题
const i18n = useI18n({
  useScope: 'global',
  inheritLocale: true
}) as Composer;

// 使用 t 函数翻译
const saveButtonText = i18n.t('common.save');
const welcomeMessage = i18n.t('common.welcome', { name: userName });

// 响应式翻译 - 当语言切换时会自动更新
const title = computed(() => i18n.t('promptAssistant.title'));

// 切换语言
function toggleLanguage() {
  const newLocale = i18n.locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
  i18n.locale.value = newLocale;
  localStorage.setItem('preferred-language', newLocale);
}
</script>
```

### 3. 在属性中使用

静态属性需要使用 `v-bind` 或简写的 `:` 绑定翻译值：

```vue
<input :placeholder="$t('promptAssistant.inputPlaceholder')">
<button :title="$t('common.save')">{{ $t('common.save') }}</button>
<custom-component :customProp="$t('module.key')"></custom-component>
```

### 4. 处理复数形式

使用 vue-i18n 的复数功能处理数量相关的文本：

```typescript
// 在翻译文件中
{
  items: {
    count: '没有项目 | {count} 个项目 | {count} 个项目'
  }
}

// 在组件中使用
t('items.count', 0)  // -> "没有项目"
t('items.count', 1)  // -> "1 个项目"
t('items.count', 10) // -> "10 个项目"
```

更复杂的复数规则可以使用对象语法：

```typescript
{
  items: {
    count: {
      0: '没有项目',
      1: '{count} 个项目',
      other: '{count} 个项目'
    }
  }
}
```

## 🔍 检测硬编码文本

项目提供了自动检测硬编码文本的工具，帮助发现未国际化的文本内容。

### 1. 运行检测工具

```bash
# 检查所有组件
pnpm run lint:i18n

# 只检查特定包的组件
pnpm run lint:i18n:ui     # 检查UI组件
pnpm run lint:i18n:web    # 检查Web组件
pnpm run lint:i18n:ext    # 检查Extension组件
```

### 2. 检测工具输出示例

```
[警告] 在 packages/ui/src/components/Header.vue:5 发现可能的硬编码文本: "保存"
[警告] 在 packages/web/src/views/Home.vue:12 发现可能的硬编码文本: "设置"
[信息] 共扫描 34 个文件，发现 7 处可能的硬编码文本
```

### 3. 修复硬编码文本

应将硬编码文本替换为使用 i18n：

```vue
<!-- 修改前 -->
<button title="保存">提交</button>

<!-- 修改后 -->
<button :title="$t('common.save')">{{ $t('common.submit') }}</button>
```

## 🆕 添加新语言

要添加新的语言支持，请按照以下步骤操作：

### 1. 创建新语言文件

在 `packages/ui/src/i18n/locales` 目录下创建新的语言文件，例如 `ja-JP.ts`：

```typescript
// packages/ui/src/i18n/locales/ja-JP.ts
export default {
  common: {
    save: '保存する',
    cancel: 'キャンセル',
    // ...翻译其他键
  },
  // ...翻译其他模块
}
```

建议以英文或已有的语言文件为基础，确保所有键都被正确翻译。

### 2. 注册新语言

在 `packages/ui/src/i18n/index.ts` 中注册新语言：

```typescript
// 导入语言文件
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';
import jaJP from './locales/ja-JP'; // 新增

// 定义支持的语言类型
type SupportedLocale = 'zh-CN' | 'en-US' | 'ja-JP'; // 新增
const SUPPORTED_LOCALES: SupportedLocale[] = ['zh-CN', 'en-US', 'ja-JP']; // 新增

// 注册消息
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP, // 新增
};
```

### 3. 更新语言选择器

确保在语言选择器中添加新语言选项：

```typescript
// 在语言选项中添加
export const languageOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'ja-JP', label: '日本語' }, // 新增
];
```

### 4. 测试新语言

确保在不同页面和组件中测试新语言，验证翻译是否正确显示、布局是否正常。

## ❓ 常见问题与解决方案

### 1. 类型提示问题

**问题**：TypeScript 无法识别翻译键路径

**解决方案**：使用类型声明提供智能提示

```typescript
// packages/ui/src/i18n/types.ts
import zhCN from './locales/zh-CN';

export type MessageSchema = typeof zhCN;
export type MessagePath = keyof MessageSchema;
```

然后在 useI18n 中使用类型：

```typescript
const i18n = useI18n<{ message: MessageSchema }>({
  useScope: 'global',
  inheritLocale: true
});
```

### 2. 嵌套参数问题

**问题**：需要在嵌套对象中使用参数

**解决方案**：使用完整的路径访问

```typescript
// 定义
{
  nested: {
    path: {
      withParam: '带有参数 {param} 的文本'
    }
  }
}

// 使用
t('nested.path.withParam', { param: 'test' })
```

### 3. HTML内容问题

**问题**：翻译文本中需要包含HTML标记

**解决方案**：使用v-html（但注意避免XSS风险）

```vue
<div v-html="$t('common.htmlContent')"></div>

// 在翻译文件中
{
  common: {
    htmlContent: '这是<strong>重要</strong>内容'
  }
}
```

更安全的方式是使用组件插槽：

```vue
<i18n-t keypath="common.slotContent" tag="div">
  <template #strong>
    <strong>重要</strong>
  </template>
</i18n-t>

// 在翻译文件中
{
  common: {
    slotContent: '这是{strong}内容'
  }
}
```

## 🔄 翻译工作流程

为确保翻译质量和一致性，建议按照以下工作流程进行翻译：

### 1. 准备工作

1. 确保新功能和UI文本先在主要语言（中文）中完成
2. 使用检测工具确认所有文本已用i18n键替换，无硬编码文本

### 2. 翻译流程

1. 提取新增需要翻译的键值对
2. 由熟悉相关领域的翻译者进行翻译
3. 进行翻译审核，确保专业术语准确使用
4. 将翻译结果集成到对应语言文件

### 3. 质量控制

1. 进行视觉验证，确保翻译后的UI布局正常
2. 检查特殊字符和长文本是否显示正确
3. 在不同设备和分辨率下测试，确保响应式布局正常

### 4. 最佳实践

- **避免使用自动翻译工具**进行核心功能和专业术语翻译
- **保持术语一致性**，关键概念在不同地方应使用相同翻译
- **避免使用过长的文本**，考虑不同语言文本长度差异
- **提供翻译上下文注释**，帮助翻译者理解含义

---

最后更新：2024-07-09  
编写：国际化团队 