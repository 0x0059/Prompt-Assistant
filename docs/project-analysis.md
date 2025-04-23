# Prompt Optimizer 项目分析文档

## 1. 项目概述

Prompt Optimizer 是一个强大的 AI 提示词优化工具，旨在帮助用户编写更好的 AI 提示词，从而提升 AI 输出质量。项目支持 Web 应用和 Chrome 插件两种使用方式。

### 1.1 核心特性

- 智能优化：支持一键优化提示词，多轮迭代改进
- 对比测试：支持原始提示词和优化后提示词的实时对比
- 多模型集成：支持 OpenAI、Gemini、DeepSeek 等主流 AI 模型
- 安全架构：纯客户端处理，数据直接与 AI 服务商交互
- 隐私保护：本地加密存储历史记录和 API 密钥
- 多端支持：同时提供 Web 应用和 Chrome 插件
- 用户体验：简洁直观的界面设计，响应式布局
- 跨域支持：支持 Vercel Edge Runtime 代理解决跨域问题

## 2. 技术架构

### 2.1 项目结构

项目采用 monorepo 架构，使用 pnpm workspace 进行包管理，主要包含以下模块：

```
packages/
├── core/       # 核心业务逻辑
├── ui/         # UI 组件库
├── web/        # Web 应用
└── extension/  # Chrome 插件
```

### 2.2 技术栈

- 包管理：pnpm
- 前端框架：Vue 3
- UI 框架：Element Plus
- 国际化：vue-i18n
- 工具库：
  - @vueuse/core：Vue 组合式 API 工具集
  - lodash-es：实用工具库
  - dayjs：日期处理
  - async-validator：表单验证

### 2.3 开发工具链

- TypeScript：类型系统
- Vite：构建工具
- ESLint：代码检查
- Husky：Git hooks
- Docker：容器化部署

## 3. 业务逻辑

### 3.1 核心功能模块

1. **提示词优化引擎**（core 包）
   - 提示词分析和优化算法
   - 多模型 API 集成
   - 本地数据存储和加密

2. **用户界面**（ui 包）
   - 可复用的 UI 组件
   - 主题定制
   - 响应式布局

3. **Web 应用**（web 包）
   - 完整的 Web 应用实现
   - 用户设置管理
   - API 密钥配置

4. **浏览器插件**（extension 包）
   - Chrome 插件实现
   - 浏览器集成
   - 快捷操作

### 3.2 数据流

1. 用户输入提示词
2. 核心引擎分析和优化
3. 调用选定的 AI 模型 API
4. 展示优化结果和对比
5. 本地存储历史记录

### 3.3 安全机制

- API 密钥本地加密存储
- 纯客户端处理，无服务器中转
- 支持 Vercel Edge Runtime 代理
- 跨域安全处理

## 4. 部署方案

### 4.1 部署方式

1. **在线版本**
   - Vercel 部署
   - 支持一键部署

2. **Docker 部署**
   - 支持环境变量配置
   - 支持 Docker Compose

3. **Chrome 插件**
   - Chrome Web Store 发布
   - 支持自动更新

### 4.2 环境要求

- Node.js: ^18.0.0 || ^20.0.0 || ^22.0.0
- pnpm: 10.6.1
- 现代浏览器支持

## 5. 开发流程

### 5.1 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev               # 主开发命令
pnpm dev:web          # 仅运行 web 应用
pnpm dev:fresh        # 完整重置并重启

# 构建
pnpm build            # 构建所有包
pnpm build:core       # 构建核心包
pnpm build:ui         # 构建 UI 包
pnpm build:web        # 构建 Web 应用
pnpm build:ext        # 构建插件

# 测试
pnpm test             # 运行所有测试
pnpm test:watch       # 监视模式测试
```

### 5.2 代码规范

- 使用 TypeScript 进行类型检查
- ESLint 进行代码规范检查
- Husky 进行提交前检查
- 遵循 Vue 3 组合式 API 最佳实践

## 6. 项目特点

1. **模块化设计**
   - 清晰的包结构
   - 高内聚低耦合
   - 易于维护和扩展

2. **性能优化**
   - 按需加载
   - 代码分割
   - 缓存优化

3. **用户体验**
   - 响应式设计
   - 流畅的交互
   - 直观的界面

4. **可扩展性**
   - 支持自定义模型
   - 插件化架构
   - 国际化支持

## 7. 未来规划

- [x] 基础功能开发
- [x] Web 应用发布
- [x] Chrome 插件发布
- [x] 自定义模型支持
- [x] 多模型支持优化
- [x] 国际化支持

## 8. 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 提交 Pull Request

## 9. 许可证

项目采用 MIT 许可证开源。 