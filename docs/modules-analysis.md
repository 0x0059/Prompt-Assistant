# Prompt Optimizer 模块分析文档

## 1. 模块概述

项目采用 monorepo 架构，使用 pnpm workspace 进行包管理，主要包含四个核心模块：

```
packages/
├── core/       # 核心业务逻辑
├── ui/         # UI 组件库
├── web/        # Web 应用
└── extension/  # Chrome 插件
```

## 2. 模块详细结构

### 2.1 Core 模块

核心业务逻辑模块，提供基础功能和 API。

```
core/
├── src/           # 源代码目录
├── tests/         # 测试文件目录
├── dist/          # 构建输出目录
├── package.json   # 包配置文件
├── tsconfig.json  # TypeScript 配置
└── vitest.config.js # 测试配置
```

主要职责：
- 提示词优化算法实现
- AI 模型 API 集成
- 本地数据存储和加密
- 核心业务逻辑处理

### 2.2 UI 模块

可复用的 UI 组件库。

```
ui/
├── src/           # 源代码目录
├── tests/         # 测试文件目录
├── dist/          # 构建输出目录
├── package.json   # 包配置文件
├── tsconfig.json  # TypeScript 配置
├── vite.config.ts # Vite 构建配置
├── tailwind.config.js # Tailwind CSS 配置
└── postcss.config.js  # PostCSS 配置
```

主要职责：
- 提供可复用的 UI 组件
- 实现主题定制
- 响应式布局支持
- 组件文档和示例

### 2.3 Web 模块

Web 应用实现。

```
web/
├── src/           # 源代码目录
├── public/        # 静态资源目录
├── package.json   # 包配置文件
├── tsconfig.json  # TypeScript 配置
├── vite.config.ts # Vite 构建配置
├── index.html     # 入口 HTML 文件
└── tailwind.config.js # Tailwind CSS 配置
```

主要职责：
- Web 应用界面实现
- 用户设置管理
- API 密钥配置
- 路由管理
- 状态管理

### 2.4 Extension 模块

Chrome 插件实现。

```
extension/
├── src/           # 源代码目录
├── public/        # 静态资源目录
├── package.json   # 包配置文件
├── tsconfig.json  # TypeScript 配置
├── vite.config.ts # Vite 构建配置
├── index.html     # 入口 HTML 文件
└── chrome.md      # Chrome 插件文档
```

主要职责：
- Chrome 插件功能实现
- 浏览器集成
- 快捷操作支持
- 插件配置管理

## 3. 模块间依赖关系

### 3.1 依赖图

```
core <── ui <── web
  ^        ^
  |        |
  └────────┴── extension
```

### 3.2 依赖说明

1. **Core 模块**
   - 基础依赖：无
   - 被依赖：ui, web, extension
   - 职责：提供核心功能和 API

2. **UI 模块**
   - 基础依赖：core
   - 被依赖：web, extension
   - 职责：提供 UI 组件和样式

3. **Web 模块**
   - 基础依赖：core, ui
   - 被依赖：无
   - 职责：实现 Web 应用

4. **Extension 模块**
   - 基础依赖：core, ui
   - 被依赖：无
   - 职责：实现 Chrome 插件

## 4. 模块间通信

### 4.1 数据流

1. **Core -> UI**
   - 提供数据模型和类型定义
   - 提供业务逻辑接口
   - 提供工具函数

2. **UI -> Web/Extension**
   - 提供组件和样式
   - 提供主题配置
   - 提供布局系统

### 4.2 接口设计

1. **Core 模块接口**
   ```typescript
   // 提示词优化接口
   interface PromptAssistant {
     optimize(prompt: string): Promise<string>;
     analyze(prompt: string): Promise<AnalysisResult>;
   }

   // 模型接口
   interface AIModel {
     generate(prompt: string): Promise<string>;
     validate(apiKey: string): Promise<boolean>;
   }
   ```

2. **UI 模块接口**
   ```typescript
   // 组件接口
   interface UIComponent {
     render(): VueComponent;
     props: ComponentProps;
     events: ComponentEvents;
   }

   // 主题接口
   interface Theme {
     colors: ColorPalette;
     typography: Typography;
     spacing: Spacing;
   }
   ```

## 5. 构建和部署

### 5.1 构建流程

1. **Core 模块**
   ```bash
   pnpm build:core
   ```
   - 编译 TypeScript
   - 生成类型定义
   - 打包核心逻辑

2. **UI 模块**
   ```bash
   pnpm build:ui
   ```
   - 编译组件
   - 处理样式
   - 生成文档

3. **Web 模块**
   ```bash
   pnpm build:web
   ```
   - 构建应用
   - 优化资源
   - 生成部署文件

4. **Extension 模块**
   ```bash
   pnpm build:ext
   ```
   - 构建插件
   - 打包资源
   - 生成发布文件

### 5.2 部署策略

1. **Core 和 UI**
   - 发布到 npm 仓库
   - 版本管理
   - 依赖更新

2. **Web**
   - Vercel 部署
   - Docker 部署
   - 静态文件托管

3. **Extension**
   - Chrome Web Store 发布
   - 自动更新
   - 版本控制

## 6. 开发建议

1. **模块开发**
   - 遵循单一职责原则
   - 保持模块独立性
   - 完善文档和测试

2. **依赖管理**
   - 明确依赖关系
   - 避免循环依赖
   - 控制依赖版本

3. **接口设计**
   - 保持接口稳定
   - 提供类型定义
   - 向后兼容

4. **测试策略**
   - 单元测试
   - 集成测试
   - 端到端测试 