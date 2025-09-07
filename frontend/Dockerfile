# JCL 企業級身分驗證前端應用程式 Docker 映像檔
# 多階段建置優化

# 依賴安裝階段
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 建置階段
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 設定建置環境變數
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 接收建置參數
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# 建置應用程式
RUN npm run build

# 生產階段
FROM node:18-alpine AS production
LABEL maintainer="JCL Enterprise Team"
LABEL description="JCL 企業級身分驗證前端應用程式"

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 建立非 root 使用者
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 安裝必要的系統套件
RUN apk add --no-cache curl

# 複製建置檔案
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# 複製建置輸出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切換到非 root 使用者
USER nextjs

# 開放連接埠
EXPOSE 3000

ENV PORT 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 啟動應用程式
CMD ["node", "server.js"]