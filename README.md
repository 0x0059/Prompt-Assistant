# Prompt-Assistant

<div align="center">

[English](README_EN.md) | [中文](README.md)

</div>

## 📖 项目介绍

Prompt Assistant 是一个强大的 AI 提示词优化工具，帮助用户编写更有效的 AI 提示词，显著提高 AI 响应质量。支持 Web 应用和 Chrome 扩展，满足不同场景需求。

## 🏗️ 架构设计

### 架构说明

Prompt-Assistant 采用模块化、分层设计，主要包含以下几个层次：

1. **前端应用层**
   - Web应用 - 基于Vue 3的网页应用，提供完整的提示词优化体验
   - 浏览器扩展 - Chrome扩展版本，提供便捷的浏览器内访问

2. **共享UI层**
   - UI组件库 - 基于Vue 3的可复用组件库，包含通用组件、布局组件、提示词组件和设置组件
   - UI服务 - 提供主题系统、国际化和组合式函数等通用功能

3. **核心服务层**
   - 服务模块 - 包含5个核心服务，负责模板管理、历史记录、LLM交互、模型管理和提示词处理
   - 工具类 - 提供环境检测、存储、加密和格式化等通用工具函数

4. **API层**
   - API代理服务 - 基于Vercel Edge Functions，解决CORS问题并代理API请求
   - 流式响应处理 - 处理来自LLM的流式响应数据
   - Vercel状态检测 - 检测部署环境状态

5. **外部服务**
   - 支持多种LLM服务，包括OpenAI、Gemini、DeepSeek、SiliconFlow和自定义模型API

### 数据流向

1. **用户输入流程**：
   用户界面 → 提示词服务 → LLM服务 → API代理 → 外部AI模型 → 返回结果

2. **提示词优化流程**：
   原始提示词 → 提示词服务 → 模板服务(应用模板) → LLM服务 → 外部AI模型 → 优化结果 → 历史记录服务(保存)

3. **配置管理流程**：
   用户界面 → 模型管理服务 → 加密工具(加密API密钥) → 存储工具(本地保存)

### 设计原则

- **模块化** - 各组件高内聚低耦合，便于独立开发和测试
- **可扩展性** - 统一接口设计，便于集成新的AI模型和功能
- **安全性** - 客户端加密存储敏感信息，无中间服务器存储用户数据
- **用户体验** - 流式响应、响应式设计和多主题支持

## ✨ 核心功能

- 🎯 **智能优化** - 一键提示词优化，多轮迭代，大幅提升 AI 响应准确度和相关性
- 🔄 **对比测试** - 原始与优化提示词实时对比，直观展示质量提升
- 🌐 **多模型支持** - 无缝集成 OpenAI、Gemini、DeepSeek 等主流 AI 模型，满足不同需求
- 🔒 **隐私保护** - 纯客户端处理，数据直接与 AI 提供商交互，无中间服务器存储
- 💾 **本地存储** - 历史记录和 API 密钥本地加密存储，确保数据安全
- 📱 **多平台支持** - 提供 Web 应用和 Chrome 扩展，适配桌面和移动场景
- 🔌 **跨域支持** - Vercel 部署时使用 Edge Runtime 代理解决 CORS 问题，确保 API 连接稳定

## 📊 模块说明

| 模块 | 技术栈 | 职责 |
|------|--------|------|
| @prompt-assistant/core | TypeScript, OpenAI SDK, Google AI SDK | 提供核心业务逻辑、模型交互、提示词处理 |
| @prompt-assistant/ui | Vue 3, Element Plus, Tailwind CSS | 提供可复用UI组件、主题系统、国际化支持 |
| @prompt-assistant/web | Vue 3, Vite, Vue Router | Web应用实现、路由管理、状态管理 |
| @prompt-assistant/extension | Vue 3, Vite, Chrome Extensions API | 浏览器扩展实现、浏览器集成 |
| API代理层 | Vercel Edge Functions | 处理跨域请求、流式响应、API状态检测 |

### 核心服务详解

#### 模板服务 (TemplateManager)
- **职责**: 提供模板管理功能，包括模板的增删改查、分类和版本控制
- **设计模式**: 单例模式，工厂模式
- **关键特性**:
  - 内置模板与用户自定义模板管理
  - 模板版本控制
  - 模板元数据管理
  - 本地存储集成

#### 历史记录服务 (HistoryManager)
- **职责**: 提供历史记录管理功能，包括记录的存储、检索和链式查询
- **设计模式**: 单例模式，观察者模式
- **关键特性**:
  - 提示词迭代链管理
  - 历史记录加密存储
  - 分页和过滤查询
  - 导出和导入功能

#### 大语言模型服务 (LLMService)
- **职责**: 提供与各种大语言模型的交互功能，支持多种主流模型
- **设计模式**: 工厂模式，适配器模式
- **关键特性**:
  - 多模型支持 (OpenAI, Gemini, DeepSeek, SiliconFlow)
  - 流式响应处理
  - 错误处理与重试机制
  - API代理集成

#### 模型管理服务 (ModelManager)
- **职责**: 提供AI模型配置管理功能，包括API密钥、默认参数和模型选择
- **设计模式**: 单例模式，策略模式
- **关键特性**:
  - API密钥安全管理
  - 模型参数配置
  - 模型可用性检测
  - 配置持久化

#### 提示词服务 (PromptService)
- **职责**: 提供提示词优化、测试和迭代功能的核心服务
- **设计模式**: 工厂模式，命令模式
- **关键特性**:
  - 提示词优化算法
  - 迭代改进功能
  - 比较测试
  - 历史记录集成

### 设计模式应用

- **单例模式**: 在各服务Manager实现中使用（TemplateManager、HistoryManager、ModelManager）
- **工厂模式**: 在LLM服务和Prompt服务的创建中使用（createLLMService、createPromptService）
- **适配器模式**: 在整合不同AI模型API时使用，提供统一接口
- **观察者模式**: 在状态更新和历史记录变更通知中使用
- **策略模式**: 在模型选择和不同优化策略实现中使用
- **命令模式**: 在提示词操作和历史记录中使用，支持撤销和重做

## 🔧 快速开始

### 1. 使用在线版本（推荐）

### 2. Docker 部署
```bash
# 基本部署（使用默认配置）
docker run -d -p 80:80 --restart unless-stopped --name prompt_assistant 0x0059/prompt_assistant

# 高级部署（配置API密钥）
docker run -d -p 80:80 \
  -e VITE_OPENAI_API_KEY=your_key \
  -e VITE_GEMINI_API_KEY=your_key \
  -e VITE_DEEPSEEK_API_KEY=your_key \
  --restart unless-stopped \
  --name prompt_assistant \
  0x0059/prompt_assistant
```

### 3. Docker Compose 部署
```bash
# 1. 克隆仓库
git clone https://github.com/0x0059/prompt_assistant.git
cd prompt_assistant

# 2. 创建 .env 文件配置 API 密钥（可选）
cat > .env << EOF
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
EOF

# 3. 启动服务
docker compose up -d
```

## ⚙️ API 密钥配置

### 方式 1：通过界面配置（推荐）
1. 点击右上角的"⚙️设置"按钮
2. 选择"模型管理"选项卡
3. 点击需要配置的模型（OpenAI、Gemini、DeepSeek 等）
4. 在配置框中输入相应的 API 密钥
5. 点击"保存"完成配置

### 方式 2：通过环境变量配置
使用 Docker 部署时，通过 `-e` 参数配置环境变量：
```bash
-e VITE_OPENAI_API_KEY=your_key
-e VITE_GEMINI_API_KEY=your_key
-e VITE_DEEPSEEK_API_KEY=your_key
-e VITE_CUSTOM_API_KEY=your_custom_api_key
-e VITE_CUSTOM_API_BASE_URL=your_custom_api_base_url
```

## 📚 支持的模型

- **OpenAI** - 支持 GPT-3.5-Turbo、GPT-4 等系列模型
- **Gemini** - 支持 Gemini-2.0-Flash 等系列模型
- **DeepSeek** - 支持 DeepSeek-V3 等系列模型
- **自定义 API** - 支持兼容 OpenAI 接口的接口，可对接本地模型或其他服务

## 🧑‍💻 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/0x0059/prompt_assistant.git
cd prompt_assistant

# 2. 安装依赖 (带国内镜像加速)
pnpm install --registry=https://registry.npmmirror.com

# 3. 启动开发服务器
pnpm dev               # 主开发命令：构建 core/ui 并运行 web 应用
pnpm dev:web          # 仅运行 web 应用
pnpm dev:fresh        # 完全重置并重启开发环境
```

详细的开发指南请查看 [开发文档](docs/dev.md)

## 📂 项目结构
```
prompt-assistant/
├── api/                        # Vercel Edge API函数
│   ├── proxy.js                # API代理服务
│   ├── stream.js               # 流式响应处理
│   └── vercel-status.js        # Vercel环境检测
│
├── packages/
│   ├── core/                   # 核心功能模块
│   │   ├── src/
│   │   │   ├── services/       # 核心服务实现
│   │   │   │   ├── llm/        # 大语言模型服务
│   │   │   │   ├── model/      # 模型管理服务
│   │   │   │   ├── prompt/     # 提示词服务
│   │   │   │   ├── template/   # 模板服务
│   │   │   │   └── history/    # 历史记录服务
│   │   │   │
│   │   │   ├── types/          # 类型定义
│   │   │   └── utils/          # 工具函数
│   │   │
│   │   └── tests/              # 单元测试
│   │
│   ├── ui/                     # UI组件库
│   │   ├── src/
│   │   │   ├── components/     # Vue组件
│   │   │   ├── styles/         # 样式文件
│   │   │   ├── i18n/           # 国际化资源
│   │   │   └── hooks/          # Vue组合式函数
│   │   │
│   │   └── tests/              # 组件测试
│   │
│   ├── web/                    # Web应用
│   │   ├── src/
│   │   │   ├── components/     # 应用特有组件
│   │   │   ├── views/          # 页面视图
│   │   │   ├── router/         # 路由配置
│   │   │   ├── store/          # 状态管理
│   │   │   └── assets/         # 静态资源
│   │   │
│   │   └── public/             # 公共资源
│   │
│   └── extension/              # 浏览器扩展
│       ├── src/
│       │   ├── popup/          # 弹出窗口
│       │   ├── background/     # 后台脚本
│       │   ├── content/        # 内容脚本
│       │   └── options/        # 选项页面
│       │
│       └── public/             # 扩展资源
│
├── docs/                       # 项目文档
├── scripts/                    # 构建脚本
├── docker/                     # Docker配置
└── images/                     # 项目图片资源
```

## 🗺️ 项目路线图

- [x] 基础功能开发完成
- [x] Web应用上线
- [x] 自定义模型支持
- [x] 多模型集成优化
- [x] 国际化支持改进
- [ ] 移动端响应式优化
- [ ] 企业级部署方案

详细项目进展请查看 [项目状态文档](docs/project-status.md)

## 📖 相关文档

- [文档索引](docs/README.md) - 所有文档的索引
- [技术开发指南](docs/technical-development-guide.md) - 技术栈和开发规范
- [项目结构](docs/project-structure.md) - 详细的项目结构说明
- [项目状态](docs/project-status.md) - 当前进展和计划
- [产品需求](docs/prd.md) - 产品需求文档

## 🤝 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目使用 [MIT](LICENSE) 许可证。

---

如果这个项目对你有帮助，请考虑给它一个 Star ⭐️

## 👥 联系我们

- 提交 Issue
- 创建 Pull Request
- 加入讨论组 