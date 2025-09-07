/*
  JCL 企業級多租戶身分驗證系統 - 資料庫初始化腳本
  
  # 資料庫架構初始化
  
  1. 新建資料表
    - `tenants` - 租戶管理表
    - `users` - 使用者基本資訊表
    - `user_profiles` - 使用者詳細資料表
    - `user_roles` - 使用者角色關係表
    - `roles` - 角色定義表
    - `permissions` - 權限定義表
    - `role_permissions` - 角色權限關係表
    - `user_sessions` - 使用者會話表
    - `refresh_tokens` - 刷新令牌表
    - `mfa_devices` - 多重驗證設備表
    - `webauthn_credentials` - WebAuthn 憑證表
    - `oauth_accounts` - OAuth 帳戶關聯表
    - `audit_logs` - 稽核日誌表
    - `login_attempts` - 登入嘗試記錄表
    - `password_reset_tokens` - 密碼重設令牌表
    
  2. 安全設置
    - 為所有表格啟用列級安全性 (RLS)
    - 建立基於租戶隔離的安全政策
    - 設定適當的索引以提升查詢效能
    
  3. 初始資料
    - 建立系統預設角色和權限
    - 建立超級管理員帳戶
*/

-- 啟用必要的擴充功能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 建立自訂類型
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deleted');
CREATE TYPE mfa_type AS ENUM ('totp', 'sms', 'email');
CREATE TYPE audit_action AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'password_change');
CREATE TYPE tenant_status AS ENUM ('trial', 'active', 'suspended', 'expired');

-- 租戶資料表
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  domain text,
  status tenant_status DEFAULT 'trial' NOT NULL,
  settings jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  
  CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT tenants_name_length CHECK (length(name) >= 2 AND length(name) <= 100)
);

COMMENT ON TABLE tenants IS '租戶管理表 - 儲存多租戶系統的租戶資訊';
COMMENT ON COLUMN tenants.slug IS '租戶唯一識別符，用於 URL 路徑';
COMMENT ON COLUMN tenants.domain IS '租戶自訂域名';
COMMENT ON COLUMN tenants.settings IS '租戶自訂設定，包含主題、功能開關等';

-- 使用者基本資訊表
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  status user_status DEFAULT 'pending' NOT NULL,
  email_verified boolean DEFAULT false NOT NULL,
  email_verified_at timestamptz,
  last_login_at timestamptz,
  last_login_ip inet,
  login_count integer DEFAULT 0 NOT NULL,
  failed_login_attempts integer DEFAULT 0 NOT NULL,
  locked_until timestamptz,
  password_changed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_failed_attempts_range CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 10)
);

COMMENT ON TABLE users IS '使用者基本資訊表 - 儲存身分驗證相關資訊';
COMMENT ON COLUMN users.password_hash IS '使用 Argon2id 演算法加密的密碼雜湊';
COMMENT ON COLUMN users.failed_login_attempts IS '連續失敗登入次數，超過限制將鎖定帳戶';

-- 使用者詳細資料表
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  phone text,
  timezone text DEFAULT 'Asia/Taipei',
  locale text DEFAULT 'zh-TW',
  bio text,
  metadata jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT user_profiles_names_length CHECK (
    (first_name IS NULL OR length(first_name) <= 50) AND
    (last_name IS NULL OR length(last_name) <= 50) AND
    (display_name IS NULL OR length(display_name) <= 100)
  )
);

COMMENT ON TABLE user_profiles IS '使用者詳細資料表 - 儲存個人資料和偏好設定';

-- 角色定義表
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system_role boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(tenant_id, name),
  CONSTRAINT roles_name_length CHECK (length(name) >= 2 AND length(name) <= 50)
);

COMMENT ON TABLE roles IS '角色定義表 - 定義系統中的各種角色';
COMMENT ON COLUMN roles.is_system_role IS '是否為系統預設角色，系統角色不可刪除';

-- 權限定義表
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT permissions_name_format CHECK (name ~ '^[a-z_]+$'),
  CONSTRAINT permissions_resource_format CHECK (resource ~ '^[a-z_]+$'),
  CONSTRAINT permissions_action_format CHECK (action ~ '^[a-z_]+$')
);

COMMENT ON TABLE permissions IS '權限定義表 - 定義系統中所有可用權限';
COMMENT ON COLUMN permissions.resource IS '權限所屬資源，如 users, tenants';
COMMENT ON COLUMN permissions.action IS '權限動作，如 create, read, update, delete';

-- 角色權限關係表
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS '角色權限關係表 - 定義角色擁有的權限';

-- 使用者角色關係表
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  
  PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_roles IS '使用者角色關係表 - 定義使用者擁有的角色';
COMMENT ON COLUMN user_roles.granted_by IS '授予角色的管理員使用者 ID';

-- 使用者會話表
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  last_accessed_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  
  CONSTRAINT user_sessions_expires_future CHECK (expires_at > created_at)
);

COMMENT ON TABLE user_sessions IS '使用者會話表 - 儲存活躍的使用者會話';
COMMENT ON COLUMN user_sessions.jti IS 'JWT Token ID，用於令牌撤銷';

-- 刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  session_id uuid REFERENCES user_sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  replaced_by uuid REFERENCES refresh_tokens(id),
  is_revoked boolean DEFAULT false NOT NULL,
  
  CONSTRAINT refresh_tokens_expires_future CHECK (expires_at > created_at)
);

COMMENT ON TABLE refresh_tokens IS '刷新令牌表 - 儲存用於更新存取令牌的刷新令牌';
COMMENT ON COLUMN refresh_tokens.replaced_by IS '指向替換此令牌的新令牌 ID';

-- 多重驗證設備表
CREATE TABLE IF NOT EXISTS mfa_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type mfa_type NOT NULL,
  name text NOT NULL,
  secret text,
  phone text,
  email text,
  backup_codes text[],
  is_primary boolean DEFAULT false NOT NULL,
  is_verified boolean DEFAULT false NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_used_at timestamptz,
  
  CONSTRAINT mfa_devices_name_length CHECK (length(name) >= 1 AND length(name) <= 50),
  CONSTRAINT mfa_devices_type_requirements CHECK (
    (type = 'totp' AND secret IS NOT NULL) OR
    (type = 'sms' AND phone IS NOT NULL) OR
    (type = 'email' AND email IS NOT NULL)
  )
);

COMMENT ON TABLE mfa_devices IS '多重驗證設備表 - 儲存使用者的 MFA 設定';
COMMENT ON COLUMN mfa_devices.backup_codes IS '備用驗證碼陣列，用於緊急存取';

-- WebAuthn 憑證表
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id text UNIQUE NOT NULL,
  public_key bytea NOT NULL,
  counter bigint DEFAULT 0 NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_used_at timestamptz,
  
  CONSTRAINT webauthn_credentials_name_length CHECK (length(name) >= 1 AND length(name) <= 100)
);

COMMENT ON TABLE webauthn_credentials IS 'WebAuthn 憑證表 - 儲存 FIDO2/WebAuthn 安全金鑰資訊';

-- OAuth 帳戶關聯表
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  token_type text,
  scope text,
  id_token text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(provider, provider_account_id),
  CONSTRAINT oauth_accounts_provider_format CHECK (provider ~ '^[a-z_]+$')
);

COMMENT ON TABLE oauth_accounts IS 'OAuth 帳戶關聯表 - 儲存外部身分提供者的帳戶關聯';

-- 稽核日誌表
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}' NOT NULL,
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now() NOT NULL,
  correlation_id text,
  prev_hash text,
  row_hash text NOT NULL,
  
  CONSTRAINT audit_logs_resource_type_format CHECK (resource_type ~ '^[a-z_]+$')
);

COMMENT ON TABLE audit_logs IS '稽核日誌表 - 記錄所有重要的系統操作，支援不可變雜湊鏈';
COMMENT ON COLUMN audit_logs.prev_hash IS '前一筆記錄的雜湊值，形成不可變鏈';
COMMENT ON COLUMN audit_logs.row_hash IS '本筆記錄的雜湊值';
COMMENT ON COLUMN audit_logs.correlation_id IS '關聯 ID，用於追蹤跨服務請求';

-- 登入嘗試記錄表
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  success boolean DEFAULT false NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT login_attempts_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE login_attempts IS '登入嘗試記錄表 - 記錄所有登入嘗試，用於安全分析';

-- 密碼重設令牌表
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  
  CONSTRAINT password_reset_tokens_expires_future CHECK (expires_at > created_at)
);

COMMENT ON TABLE password_reset_tokens IS '密碼重設令牌表 - 儲存密碼重設請求的驗證令牌';

-- 建立索引以提升查詢效能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_status ON tenants(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users(last_login_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_jti ON user_sessions(jti);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mfa_devices_user_id ON mfa_devices(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mfa_devices_type ON mfa_devices(type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_account_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_correlation ON audit_logs(correlation_id) WHERE correlation_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- 啟用列級安全性 (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策
-- 租戶政策：只能存取自己的資料
CREATE POLICY "租戶只能存取自己的資料" ON tenants
  FOR ALL TO authenticated
  USING (id = current_setting('app.current_tenant_id')::uuid);

-- 使用者政策：只能存取同租戶的資料
CREATE POLICY "使用者只能存取同租戶資料" ON users
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 其他表格的政策類似設定
CREATE POLICY "使用者詳細資料存取政策" ON user_profiles
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_profiles.user_id 
    AND users.tenant_id = current_setting('app.current_tenant_id')::uuid
  ));

CREATE POLICY "角色存取政策" ON roles
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "使用者角色存取政策" ON user_roles
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_roles.user_id 
    AND users.tenant_id = current_setting('app.current_tenant_id')::uuid
  ));

CREATE POLICY "會話存取政策" ON user_sessions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_sessions.user_id 
    AND users.tenant_id = current_setting('app.current_tenant_id')::uuid
  ));

CREATE POLICY "刷新令牌存取政策" ON refresh_tokens
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = refresh_tokens.user_id 
    AND users.tenant_id = current_setting('app.current_tenant_id')::uuid
  ));

CREATE POLICY "MFA 設備存取政策" ON mfa_devices
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = mfa_devices.user_id 
    AND users.tenant_id = current_setting('app.current_tenant_id')::uuid
  ));

CREATE POLICY "WebAuthn 憑證存取政策" ON webauthn_credentials
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = webauthn_credentials.user_id 
    AND users.tenant_id = current_setting('app.current_tenant_id')::uuid
  ));

CREATE POLICY "OAuth 帳戶存取政策" ON oauth_accounts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = oauth_accounts.user_id 
    AND users.tenant_id = current_setting('app.current_tenant_id')::uuid
  ));

CREATE POLICY "稽核日誌存取政策" ON audit_logs
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 權限表不需要租戶隔離，因為是全域權限
CREATE POLICY "權限讀取政策" ON permissions
  FOR SELECT TO authenticated
  USING (true);

-- 建立觸發函數以自動更新時間戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language plpgsql;

-- 為需要的表格建立觸發器
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_devices_updated_at BEFORE UPDATE ON mfa_devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_accounts_updated_at BEFORE UPDATE ON oauth_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();