# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY packages/web/package.json ./packages/web/

RUN corepack enable && pnpm install

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 运行阶段
FROM nginx:alpine

# 从构建阶段复制构建成果至nginx目录
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# 暴露80端口
EXPOSE 80

# 启动Nginx服务器
CMD ["nginx", "-g", "daemon off;"]