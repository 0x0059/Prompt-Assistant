# Prompt Assistant 部署指南

本文档详细说明了如何将 Prompt Assistant 项目部署到 Cloudflare Pages 平台。

## 先决条件

1. Cloudflare 账户（[注册地址](https://dash.cloudflare.com/sign-up)）
2. Node.js 18+ 和 pnpm 10+
3. Wrangler CLI (`pnpm install -g wrangler`)
4. 项目代码已克隆到本地

## 部署步骤

### 1. 环境准备

```bash
# 登录到 Cloudflare
wrangler login

# 安装项目依赖
pnpm install

# 构建项目
pnpm build:web
```

### 2. 手动部署

```bash
# 切换到 web 包目录
cd packages/web

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name prompt-assistant
```

### 3. 自动部署（GitHub Actions）

1. 在 GitHub 仓库设置中添加以下 Secrets:
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API 令牌
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID

2. 推送代码到 GitHub，自动触发部署流程。

## 自定义域名设置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择 "Pages" 项目
3. 点击 "prompt-assistant" 项目
4. 导航至 "Custom domains" 选项卡
5. 点击 "Set up a custom domain"
6. 输入您的域名并按照提示完成 DNS 设置

## 安全配置

我们已经在 `security-headers.json` 中预配置了安全头信息，确保符合最佳安全实践：

- 强制 HTTPS
- 设置 CSP 策略
- 防止点击劫持
- XSS 保护
- HSTS 预加载

## 性能优化

- 静态资源配置了 7 天缓存
- 启用了 HTTP/3 传输
- 自动缓存清理

## 故障排查

如遇到部署问题，请检查：

1. Wrangler 版本是否最新
2. 构建产物是否正确生成在 `dist` 目录中
3. Cloudflare API 令牌权限是否足够

可通过 `packages/web/e2e-test.sh` 脚本执行端到端测试，检测部署质量。

## 注意事项

- 默认使用 Cloudflare 提供的 SSL 证书
- 部署后的变更需经过 CI/CD 流水线验证
- 建议保留至少3个历史版本以备回滚

## 支持与帮助

如有部署问题，请提交 Issue 到 [GitHub 仓库](https://github.com/0x0059/prompt-assistant/issues) 