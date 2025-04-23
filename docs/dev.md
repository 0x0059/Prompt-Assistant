# 🛠️ 开发指南 (Development Guide)

## 📋 目录

- [环境要求](#环境要求)
- [本地开发](#本地开发)
- [Docker开发与部署](#docker开发与部署)
- [环境变量配置](#环境变量配置)
- [开发工作流程](#开发工作流程)
- [构建与部署](#构建与部署)
- [故障排除](#故障排除)

## 💻 环境要求

### 基础环境
- **Node.js**: ^18.0.0 || ^20.0.0 || ^22.0.0
- **包管理器**: pnpm >= 10.6.1
- **Git**: >= 2.0
- **推荐IDE**: VSCode

### 推荐扩展
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- i18n Ally
- Tailwind CSS IntelliSense

## 🚀 本地开发

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/0x0059/prompt-assistant.git
cd prompt-assistant

# 2. 安装依赖
pnpm install

# 3. 启动开发服务
pnpm dev               # 主开发命令：构建core/ui并运行web应用
```

### 常用开发命令

```bash
# 仅运行web应用
pnpm dev:web

# 运行浏览器扩展开发环境
pnpm dev:ext

# 完整重置并重新启动开发环境
pnpm dev:fresh

# 构建所有包
pnpm build

# 构建特定包
pnpm build:core    # 构建核心功能模块
pnpm build:ui      # 构建UI组件库
pnpm build:web     # 构建Web应用
pnpm build:ext     # 构建浏览器扩展
```

### 项目结构速览

```
prompt-assistant/
├── packages/             # 项目包目录
│   ├── core/            # 核心功能模块
│   ├── ui/              # UI组件库
│   ├── web/             # Web应用
│   └── extension/       # 浏览器扩展
├── docs/                # 项目文档
└── scripts/             # 工具脚本
```

## 🐳 Docker开发与部署

### 环境要求
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0

### 基本用法

```bash
# 使用Docker Compose启动服务（推荐）
docker compose up -d

# 查看日志
docker compose logs -f
```

### 自定义构建

```bash
# 构建开发测试镜像
docker build -t prompt-assistant:dev .

# 运行开发环境（带环境变量）
docker run -d -p 80:80 \
  --name prompt-assistant-dev \
  -e VITE_GEMINI_API_KEY=your_key \
  prompt-assistant:dev
```

### 生产环境部署

```bash
# 使用官方镜像（推荐）
docker run -d -p 80:80 --restart unless-stopped --name prompt_assistant 0x0059/prompt_assistant

# 带API密钥的部署
docker run -d -p 80:80 \
  -e VITE_OPENAI_API_KEY=your_key \
  --restart unless-stopped \
  --name prompt_assistant \
  0x0059/prompt_assistant
```

## ⚙️ 环境变量配置

### 本地开发环境变量

在项目根目录创建 `.env.local` 文件（不会被Git跟踪）：

```env
# OpenAI API配置
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_API_BASE_URL=your_openai_base_url    # 可选，自定义API地址

# Gemini API配置
VITE_GEMINI_API_KEY=your_gemini_api_key

# DeepSeek API配置
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key

# 自定义API配置
VITE_CUSTOM_API_KEY=your_custom_api_key
VITE_CUSTOM_API_BASE_URL=your_custom_api_base_url
VITE_CUSTOM_API_MODEL=your_custom_model_name
```

### Docker环境变量

使用 `-e` 参数或 docker-compose.yml 中的 environment 部分配置环境变量：

```yaml
environment:
  - VITE_OPENAI_API_KEY=your_key_here
  - VITE_GEMINI_API_KEY=your_key_here
  - VITE_DEEPSEEK_API_KEY=your_key_here
```

## 🔄 开发工作流程

### 分支管理策略

```
main        # 主分支，用于发布
develop     # 开发分支，所有开发工作的基础
feature/*   # 功能分支，用于开发新功能
bugfix/*    # 修复分支，用于修复非紧急bug
hotfix/*    # 紧急修复分支，用于紧急修复生产问题
```

### Git工作流

```bash
# 1. 从develop分支创建功能分支
git checkout develop
git pull
git checkout -b feature/new-feature

# 2. 开发并提交更改
git add .
git commit -m "feat(module): add new feature"

# 3. 推送分支到远程
git push -u origin feature/new-feature

# 4. 创建Pull Request到develop分支
# 5. 代码审查后合并
```

### 提交信息规范

格式：`<type>(<scope>): <subject>`

类型(type)：
- **feat**: 新功能
- **fix**: 修复Bug
- **docs**: 文档更新
- **style**: 代码格式（不影响代码运行的变动）
- **refactor**: 重构（既不是新增功能，也不是修改bug的代码变动）
- **perf**: 性能优化
- **test**: 增加测试
- **build**: 构建过程或辅助工具的变动
- **ci**: CI配置变更

示例：
```
feat(ui): 添加新的提示词编辑器组件
fix(core): 修复API调用超时问题
docs(readme): 更新安装说明
```

### 测试流程

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm test:core
pnpm test:ui
pnpm test:web
pnpm test:ext

# 运行测试覆盖率报告
pnpm test:coverage
```

## 📦 构建与部署

### 本地构建

```bash
# 构建所有包
pnpm build

# 监视模式构建（用于开发）
pnpm watch:ui      # 监视UI组件库变更
```

### 清理和重置

```bash
# 清理构建产物
pnpm clean:dist

# 清理Vite缓存
pnpm clean:vite

# 清理所有（构建产物和缓存）
pnpm clean

# 完全重置（清理+重新安装+启动）
pnpm dev:fresh
```

## ❓ 故障排除

### 安装问题

```bash
# 1. 检查 pnpm 版本
pnpm --version  # 应 >= 10.6.1

# 2. 清理依赖缓存
pnpm clean
rm -rf node_modules
rm -rf packages/*/node_modules

# 3. 重新安装依赖
pnpm install
```

### 构建失败

1. 检查 Node.js 版本是否符合要求（^18.0.0 || ^20.0.0 || ^22.0.0）
2. 清理构建缓存：
   ```bash
   pnpm clean
   pnpm install
   ```
3. 检查是否有编译错误：
   ```bash
   pnpm build --debug
   ```

### 常见错误及解决方案

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 端口被占用 | 其他应用占用了相同端口 | 使用`lsof -i :端口号`查找并关闭进程，或修改配置使用其他端口 |
| 构建失败 | 依赖版本不兼容 | 执行`pnpm clean && pnpm install`重新安装依赖 |
| API连接失败 | 跨域问题或API密钥无效 | 检查API密钥配置，或在设置中启用Vercel代理 |
| 热更新不工作 | 构建缓存问题 | 重启开发服务器`pnpm dev:fresh` |

### i18n 相关问题

```bash
# 检查 i18n 文件完整性
pnpm lint:i18n

# 检查特定包的 i18n
pnpm lint:i18n:ui
pnpm lint:i18n:web
pnpm lint:i18n:ext
```

---

最后更新：2024-07-09
