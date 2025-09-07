# JCL 企業級身分驗證後端 API Docker 映像檔
# 多階段建置優化

# 開發階段
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=development
COPY . .
CMD ["npm", "run", "dev"]

# 建置階段
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

# 生產階段
FROM node:18-alpine AS production
LABEL maintainer="JCL Enterprise Team"
LABEL description="JCL 企業級身分驗證後端 API"

# 建立非 root 使用者
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 安裝必要的系統套件
RUN apk add --no-cache curl

# 設定工作目錄
WORKDIR /app

# 複製建置檔案
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./

# 切換到非 root 使用者
USER nodejs

# 開放連接埠
EXPOSE 3001

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# 啟動應用程式
CMD ["node", "dist/app.js"]