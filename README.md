# JCL 企業級多租戶身分驗證系統

![JCL Auth Banner](./docs/images/banner.png)

## 🚀 系統概述

JCL 企業級多租戶身分驗證系統是一個功能完整、安全可靠的企業級身分驗證平台，採用現代化的微服務架構設計。系統提供完整的使用者管理、多租戶隔離、多重驗證、OAuth 整合等功能，適用於大型企業的身分驗證需求。

### ✨ 核心特色

- **🏢 多租戶架構**: 完整的租戶隔離，支援 SaaS 模式部署
- **🔐 企業級安全**: JWT + 刷新令牌、MFA、WebAuthn、OAuth2 整合
- **📊 完整稽核**: 不可變稽核日誌、雜湊鏈驗證、詳細操作記錄
- **⚡ 高效能**: Redis 快取、PgBouncer 連線池、Nginx 負載平衡
- **🌐 國際化**: 完整繁體中文支援，可擴展多語系
- **📱 現代化 UI**: 響應式設計、PWA 支援、深色模式

## 🏗️ 系統架構

### 技術堆疊

- **後端**: Node.js + TypeScript + Express
- **前端**: Next.js 14 + React + TailwindCSS
- **資料庫**: PostgreSQL 15+ 
- **連線池**: PgBouncer
- **快取**: Redis 7+
- **反向代理**: Nginx
- **容器化**: Docker + Docker Compose

### 架構圖

```
┌─────────────┐    ┌──────────────┐    ┌────────────┐
│   客戶端    │ => │    Nginx     │ => │  Frontend  │
│ (瀏覽器/App) │    │ (反向代理)   │    │ (Next.js)  │
└─────────────┘    └──────┬───────┘    └────────────┘
                          │
                   ┌──────▼───────┐    ┌────────────┐
                   │   Backend    │ => │  PgBouncer │
                   │ (Node.js API)│    │ (連線池)   │
                   └──────┬───────┘    └─────┬──────┘
                          │                  │
                   ┌──────▼───────┐    ┌─────▼──────┐
                   │    Redis     │    │PostgreSQL │
                   │   (快取)     │    │ (資料庫)  │
                   └──────────────┘    └────────────┘
```

## 🔧 快速開始

### 環境需求

- Docker >= 20.10
- Docker Compose >= 2.0
- Node.js >= 18 (本地開發)
- 至少 4GB RAM

### 安裝步驟

1. **複製專案**
   ```bash
   git clone https://github.com/jcl-system/enterprise-auth.git
   cd enterprise-auth
   ```

2. **設定環境變數**
   ```bash
   # 檢查並修改 secrets 資料夾中的檔案
   ls secrets/
   # 請修改以下檔案中的預設值：
   # - jwt_secret.txt
   # - db_password.txt
   # - redis_password.txt
   # - smtp_password.txt (如需要郵件功能)
   ```

3. **啟動服務**
   ```bash
   # 建置並啟動所有服務
   npm run docker:up
   
   # 或使用原生 Docker Compose
   docker-compose up -d
   ```

4. **等待服務啟動**
   ```bash
   # 檢查服務狀態
   docker-compose ps
   
   # 查看日誌
   docker-compose logs -f api
   ```

5. **存取系統**
   - 主應用程式: http://localhost (將重新導向到 HTTPS)
   - 管理介面: http://admin.localhost
   - API 文件: http://api.localhost/docs

### 預設帳戶

```
電子郵件: admin@jcl-system.com
密碼: JCL@Admin2024!
```

> ⚠️ **重要**: 請立即登入並更改預設密碼！

## 📁 專案結構

```
jcl-enterprise-auth/
├── backend/              # 後端 API 服務
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── middleware/   # 中介軟體
│   │   ├── models/       # 資料模型
│   │   ├── routes/       # 路由定義
│   │   ├── services/     # 業務邏輯
│   │   └── utils/        # 工具函數
│   ├── Dockerfile
│   └── package.json
├── frontend/             # 前端應用程式
│   ├── app/              # Next.js App Router
│   ├── components/       # React 元件
│   ├── contexts/         # React 上下文
│   ├── hooks/            # 自訂 Hooks
│   ├── lib/              # 工具庫
│   ├── public/           # 靜態資源
│   ├── styles/           # 樣式檔案
│   ├── Dockerfile
│   └── package.json
├── database/             # 資料庫相關
│   ├── init/             # 初始化腳本
│   └── migrations/       # 資料庫遷移
├── nginx/                # Nginx 設定
│   ├── nginx.conf        # 主設定檔
│   └── conf.d/           # 額外設定
├── docker/               # Docker 設定
│   └── pgbouncer/        # PgBouncer 設定
├── secrets/              # 機密檔案
├── docs/                 # 專案文件
├── docker-compose.yml    # Docker Compose 設定
└── README.md
```

## 🔒 安全特性

### 身分驗證機制
- **JWT + 刷新令牌**: 無狀態驗證與令牌輪換
- **密碼安全**: Argon2id 雜湊演算法
- **帳戶鎖定**: 防暴力破解機制
- **會話管理**: Redis 黑名單與過期管理

### 多重驗證 (MFA)
- **TOTP**: Time-based One-Time Password
- **Email OTP**: 電子郵件一次性密碼
- **WebAuthn**: FIDO2 安全金鑰支援
- **備用碼**: 緊急存取機制

### 存取控制
- **RBAC**: 基於角色的存取控制
- **動態權限**: 資料庫儲存的靈活權限系統
- **租戶隔離**: 完整的多租戶資料隔離
- **RLS**: PostgreSQL 列級安全性

### 安全標頭
- **CSP**: 內容安全政策
- **HSTS**: HTTP 嚴格傳輸安全
- **CSRF 保護**: 跨站請求偽造防護
- **XSS 防護**: 跨站腳本攻擊防護

## 📊 監控與日誌

### 健康檢查端點
- `GET /health`: 基本服務狀態
- `GET /ready`: 依賴服務健康檢查
- `GET /metrics`: Prometheus 指標

### 稽核日誌
- 所有重要操作記錄
- 不可變雜湊鏈驗證
- 支援 7 年資料保存
- 詳細的使用者行為追蹤

### 日誌格式
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "使用者登入成功",
  "userId": "uuid",
  "tenantId": "uuid",
  "ip": "192.168.1.1",
  "userAgent": "...",
  "correlationId": "req-123"
}
```

## 🔄 API 端點

### 身分驗證
- `POST /api/auth/login`: 使用者登入
- `POST /api/auth/register`: 使用者註冊
- `POST /api/auth/refresh`: 刷新令牌
- `POST /api/auth/logout`: 使用者登出
- `POST /api/auth/forgot-password`: 忘記密碼
- `POST /api/auth/reset-password`: 重設密碼

### 多重驗證
- `POST /api/auth/mfa/setup`: 設定 MFA
- `POST /api/auth/mfa/verify`: 驗證 MFA
- `POST /api/auth/mfa/backup-codes`: 產生備用碼
- `DELETE /api/auth/mfa/disable`: 停用 MFA

### 使用者管理
- `GET /api/users`: 取得使用者列表
- `POST /api/users`: 建立使用者
- `GET /api/users/:id`: 取得使用者詳情
- `PUT /api/users/:id`: 更新使用者
- `DELETE /api/users/:id`: 刪除使用者

### 租戶管理
- `GET /api/tenants`: 取得租戶列表
- `POST /api/tenants`: 建立租戶
- `PUT /api/tenants/:id`: 更新租戶設定
- `DELETE /api/tenants/:id`: 刪除租戶

## 🚀 部署指南

### 開發環境

```bash
# 本地開發
npm run dev

# 或分別啟動前後端
npm run dev:backend
npm run dev:frontend
```

### 測試環境

```bash
# 建置測試映像
docker-compose -f docker-compose.test.yml up -d

# 執行測試
npm test
```

### 生產環境

1. **SSL 憑證設定**
   ```bash
   # 將 SSL 憑證放置到 nginx/ssl/ 目錄
   cp your-cert.crt nginx/ssl/jcl-system.com.crt
   cp your-cert.key nginx/ssl/jcl-system.com.key
   ```

2. **環境變數檢查**
   ```bash
   # 確保所有 secrets 檔案都已設定正確的值
   cat secrets/jwt_secret.txt
   cat secrets/db_password.txt
   ```

3. **啟動生產服務**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **資料備份設定**
   ```bash
   # 設定資料庫自動備份
   crontab -e
   # 新增: 0 2 * * * /path/to/backup-script.sh
   ```

## 🔧 配置說明

### 環境變數

| 變數名稱 | 說明 | 預設值 |
|---------|-----|--------|
| `NODE_ENV` | 執行環境 | `production` |
| `JWT_SECRET_FILE` | JWT 密鑰檔案路徑 | `/run/secrets/jwt_secret` |
| `DATABASE_URL` | 資料庫連線 URL | 見 docker-compose.yml |
| `REDIS_URL` | Redis 連線 URL | `redis://redis:6379` |
| `CORS_ORIGINS` | 允許的 CORS 來源 | 見設定檔 |

### PgBouncer 設定

- **連線模式**: Transaction (交易模式)
- **連線池大小**: 25 (可根據負載調整)
- **最大客戶端連線**: 1000
- **預備語句**: 關閉 (必要設定)

### Redis 設定

- **密碼驗證**: 啟用
- **資料持久化**: AOF 模式
- **記憶體政策**: allkeys-lru

## 🛡️ 安全最佳實務

### 密碼政策
- 最小長度: 8 字元
- 必須包含大小寫字母、數字、特殊符號
- 密碼歷史: 禁止重複使用最近 5 個密碼
- 定期更換提醒

### 會話管理
- 會話超時: 1 小時
- 刷新令牌有效期: 7 天
- 自動令牌輪換
- 異常登入檢測

### 網路安全
- TLS 1.2+ 強制加密
- HSTS 強制 HTTPS
- 速率限制與 DDoS 防護
- IP 白名單管理 (管理介面)

## 📈 效能優化

### 資料庫優化
- 適當的索引設計
- 連線池管理
- 查詢效能監控
- 定期維護作業

### 快取策略
- Redis 作為會話儲存
- 靜態資源 CDN
- API 回應快取
- 資料庫查詢快取

### 前端優化
- Next.js 靜態生成
- 圖片最佳化
- 程式碼分割
- 漸進式載入

## 🐛 故障排除

### 常見問題

**1. 資料庫連線失敗**
```bash
# 檢查 PgBouncer 狀態
docker-compose logs pgbouncer

# 檢查資料庫狀態
docker-compose logs postgres
```

**2. Redis 連線問題**
```bash
# 檢查 Redis 日誌
docker-compose logs redis

# 測試 Redis 連線
docker-compose exec redis redis-cli ping
```

**3. SSL 憑證問題**
```bash
# 檢查憑證有效性
openssl x509 -in nginx/ssl/jcl-system.com.crt -text -noout
```

### 日誌查看

```bash
# 查看所有服務日誌
docker-compose logs

# 查看特定服務日誌
docker-compose logs api
docker-compose logs frontend
docker-compose logs nginx

# 即時跟蹤日誌
docker-compose logs -f api
```

## 🤝 貢獻指南

我們歡迎社群貢獻！請遵循以下步驟：

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '新增超棒功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 建立 Pull Request

### 開發規範

- 使用 TypeScript 進行強型別開發
- 遵循 ESLint 和 Prettier 設定
- 撰寫單元測試覆蓋新功能
- 更新相關文件
- 所有註解和文件使用繁體中文

## 📞 技術支援

如果您遇到問題或需要協助，請透過以下方式聯絡我們：

- **技術支援**: support@jcl-system.com
- **安全問題**: security@jcl-system.com
- **GitHub Issues**: https://github.com/jcl-system/enterprise-auth/issues

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案。

## 🙏 致謝

感謝以下開源專案和社群的貢獻：

- [Node.js](https://nodejs.org/)
- [Next.js](https://nextjs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [Docker](https://www.docker.com/)
- [Nginx](https://nginx.org/)
- [TailwindCSS](https://tailwindcss.com/)

---

© 2024 JCL Enterprise Team. 保留所有權利。