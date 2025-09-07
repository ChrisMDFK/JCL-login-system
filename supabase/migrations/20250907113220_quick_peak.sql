/*
  JCL 企業級多租戶身分驗證系統 - 初始資料腳本
  
  # 系統初始化資料
  
  1. 系統權限
    - 建立基礎 CRUD 權限
    - 建立管理員專用權限
    
  2. 預設角色
    - 超級管理員 (Super Admin)
    - 系統管理員 (System Admin)
    - 租戶管理員 (Tenant Admin)
    - 一般使用者 (User)
    
  3. 預設租戶
    - 建立系統預設租戶
    
  4. 管理員帳戶
    - 建立超級管理員帳戶
*/

-- 插入系統基礎權限
INSERT INTO permissions (name, description, resource, action) VALUES
-- 使用者管理權限
('users_create', '建立使用者', 'users', 'create'),
('users_read', '檢視使用者', 'users', 'read'),
('users_update', '更新使用者', 'users', 'update'),
('users_delete', '刪除使用者', 'users', 'delete'),
('users_manage', '完整使用者管理', 'users', 'manage'),

-- 角色權限管理
('roles_create', '建立角色', 'roles', 'create'),
('roles_read', '檢視角色', 'roles', 'read'),
('roles_update', '更新角色', 'roles', 'update'),
('roles_delete', '刪除角色', 'roles', 'delete'),
('roles_assign', '分配角色', 'roles', 'assign'),

-- 租戶管理權限
('tenants_create', '建立租戶', 'tenants', 'create'),
('tenants_read', '檢視租戶', 'tenants', 'read'),
('tenants_update', '更新租戶', 'tenants', 'update'),
('tenants_delete', '刪除租戶', 'tenants', 'delete'),
('tenants_manage', '完整租戶管理', 'tenants', 'manage'),

-- 系統管理權限
('system_admin', '系統管理', 'system', 'admin'),
('system_monitor', '系統監控', 'system', 'monitor'),
('system_audit', '系統稽核', 'system', 'audit'),

-- 個人資料權限
('profile_read', '檢視個人資料', 'profile', 'read'),
('profile_update', '更新個人資料', 'profile', 'update'),

-- 多重驗證權限
('mfa_setup', '設定多重驗證', 'mfa', 'setup'),
('mfa_manage', '管理多重驗證', 'mfa', 'manage'),

-- 會話管理權限
('sessions_read', '檢視會話', 'sessions', 'read'),
('sessions_revoke', '撤銷會話', 'sessions', 'revoke'),

-- 稽核日誌權限
('audit_logs_read', '檢視稽核日誌', 'audit_logs', 'read'),
('audit_logs_export', '匯出稽核日誌', 'audit_logs', 'export')

ON CONFLICT (name) DO NOTHING;

-- 建立預設租戶
INSERT INTO tenants (id, name, slug, status, settings) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  'JCL 系統管理',
  'jcl-system',
  'active',
  '{
    "theme": {
      "primaryColor": "#3b82f6",
      "logo": "/images/jcl-logo.png"
    },
    "features": {
      "mfaRequired": true,
      "passwordPolicy": {
        "minLength": 8,
        "requireUppercase": true,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSymbols": true
      }
    },
    "limits": {
      "maxUsers": 10000,
      "maxSessions": 100
    }
  }'
)
ON CONFLICT (id) DO NOTHING;

-- 建立系統預設角色
INSERT INTO roles (id, tenant_id, name, description, is_system_role) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'super_admin',
  '超級管理員 - 擁有系統完整權限',
  true
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'system_admin',
  '系統管理員 - 管理系統設定和監控',
  true
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'tenant_admin',
  '租戶管理員 - 管理租戶使用者和設定',
  true
),
(
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'user',
  '一般使用者 - 基本使用權限',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 為超級管理員分配所有權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '10000000-0000-0000-0000-000000000001',
  id
FROM permissions
ON CONFLICT DO NOTHING;

-- 為系統管理員分配系統管理相關權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '10000000-0000-0000-0000-000000000002',
  id
FROM permissions
WHERE name IN (
  'users_read', 'users_update', 'users_manage',
  'roles_read', 'roles_create', 'roles_update', 'roles_assign',
  'tenants_read', 'tenants_create', 'tenants_update',
  'system_monitor', 'system_audit',
  'profile_read', 'profile_update',
  'mfa_setup', 'mfa_manage',
  'sessions_read', 'sessions_revoke',
  'audit_logs_read', 'audit_logs_export'
)
ON CONFLICT DO NOTHING;

-- 為租戶管理員分配租戶管理權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '10000000-0000-0000-0000-000000000003',
  id
FROM permissions
WHERE name IN (
  'users_read', 'users_create', 'users_update', 'users_delete',
  'roles_read', 'roles_create', 'roles_update', 'roles_assign',
  'profile_read', 'profile_update',
  'mfa_setup', 'mfa_manage',
  'sessions_read', 'sessions_revoke',
  'audit_logs_read'
)
ON CONFLICT DO NOTHING;

-- 為一般使用者分配基本權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '10000000-0000-0000-0000-000000000004',
  id
FROM permissions
WHERE name IN (
  'profile_read', 'profile_update',
  'mfa_setup',
  'sessions_read'
)
ON CONFLICT DO NOTHING;

-- 建立超級管理員帳戶
-- 預設密碼: JCL@Admin2024! (請在生產環境中立即更改)
INSERT INTO users (
  id,
  tenant_id,
  email,
  password_hash,
  status,
  email_verified,
  email_verified_at
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'admin@jcl-system.com',
  '$argon2id$v=19$m=65536,t=3,p=4$YourSaltHere$YourHashHere', -- 實際使用時需要正確的 Argon2id 雜湊
  'active',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 建立超級管理員個人資料
INSERT INTO user_profiles (
  user_id,
  first_name,
  last_name,
  display_name,
  timezone,
  locale
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  'JCL',
  'Administrator',
  'JCL 系統管理員',
  'Asia/Taipei',
  'zh-TW'
)
ON CONFLICT (user_id) DO NOTHING;

-- 分配超級管理員角色
INSERT INTO user_roles (
  user_id,
  role_id,
  granted_at
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  now()
)
ON CONFLICT DO NOTHING;

-- 建立示範租戶
INSERT INTO tenants (name, slug, status, settings) VALUES 
(
  '示範公司',
  'demo-company',
  'trial',
  '{
    "theme": {
      "primaryColor": "#059669",
      "logo": "/images/demo-logo.png"
    },
    "features": {
      "mfaRequired": false,
      "passwordPolicy": {
        "minLength": 6,
        "requireUppercase": false,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSymbols": false
      }
    },
    "limits": {
      "maxUsers": 50,
      "maxSessions": 10
    }
  }'
),
(
  '測試企業',
  'test-enterprise',
  'active',
  '{
    "theme": {
      "primaryColor": "#dc2626",
      "logo": "/images/test-logo.png"
    },
    "features": {
      "mfaRequired": true,
      "passwordPolicy": {
        "minLength": 10,
        "requireUppercase": true,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSymbols": true
      }
    },
    "limits": {
      "maxUsers": 200,
      "maxSessions": 50
    }
  }'
)
ON CONFLICT (slug) DO NOTHING;

-- 為示範租戶建立角色
DO $$
DECLARE
    demo_tenant_id uuid;
    test_tenant_id uuid;
BEGIN
    -- 取得示範租戶 ID
    SELECT id INTO demo_tenant_id FROM tenants WHERE slug = 'demo-company';
    SELECT id INTO test_tenant_id FROM tenants WHERE slug = 'test-enterprise';
    
    -- 為示範租戶建立角色
    IF demo_tenant_id IS NOT NULL THEN
        INSERT INTO roles (tenant_id, name, description, is_system_role) VALUES
        (demo_tenant_id, 'admin', '管理員', false),
        (demo_tenant_id, 'user', '使用者', false)
        ON CONFLICT (tenant_id, name) DO NOTHING;
    END IF;
    
    -- 為測試租戶建立角色
    IF test_tenant_id IS NOT NULL THEN
        INSERT INTO roles (tenant_id, name, description, is_system_role) VALUES
        (test_tenant_id, 'admin', '管理員', false),
        (test_tenant_id, 'manager', '經理', false),
        (test_tenant_id, 'user', '使用者', false)
        ON CONFLICT (tenant_id, name) DO NOTHING;
    END IF;
END $$;

-- 插入初始稽核記錄
INSERT INTO audit_logs (
  tenant_id,
  action,
  resource_type,
  details,
  timestamp,
  correlation_id,
  row_hash
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'create',
  'system_init',
  '{"message": "系統初始化完成", "version": "1.0.0"}',
  now(),
  'system-init-' || extract(epoch from now())::text,
  encode(digest('system-init-' || now()::text, 'sha256'), 'hex')
);

-- 建立系統設定函數
CREATE OR REPLACE FUNCTION get_system_info()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'version', '1.0.0',
    'initialized_at', now(),
    'tenants_count', (SELECT COUNT(*) FROM tenants),
    'users_count', (SELECT COUNT(*) FROM users),
    'roles_count', (SELECT COUNT(*) FROM roles),
    'permissions_count', (SELECT COUNT(*) FROM permissions)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立租戶統計函數
CREATE OR REPLACE FUNCTION get_tenant_stats(tenant_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'tenant_id', tenant_uuid,
    'users_count', (
      SELECT COUNT(*) FROM users 
      WHERE tenant_id = tenant_uuid AND status = 'active'
    ),
    'active_sessions', (
      SELECT COUNT(*) FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE u.tenant_id = tenant_uuid 
      AND us.is_active = true
      AND us.expires_at > now()
    ),
    'roles_count', (
      SELECT COUNT(*) FROM roles 
      WHERE tenant_id = tenant_uuid
    ),
    'last_login', (
      SELECT MAX(last_login_at) FROM users 
      WHERE tenant_id = tenant_uuid
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立清理過期會話的函數
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- 刪除過期的使用者會話
  DELETE FROM user_sessions 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- 刪除過期的刷新令牌
  DELETE FROM refresh_tokens 
  WHERE expires_at < now() OR is_revoked = true;
  
  -- 刪除過期的密碼重設令牌
  DELETE FROM password_reset_tokens 
  WHERE expires_at < now() OR used_at IS NOT NULL;
  
  -- 刪除舊的登入嘗試記錄（保留30天）
  DELETE FROM login_attempts 
  WHERE created_at < now() - INTERVAL '30 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立稽核日誌清理函數（保留指定天數）
CREATE OR REPLACE FUNCTION cleanup_audit_logs(retention_days integer DEFAULT 2555)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM audit_logs 
  WHERE timestamp < now() - (retention_days || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 輸出初始化完成訊息
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'JCL 企業級多租戶身分驗證系統初始化完成！';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '預設超級管理員帳戶:';
  RAISE NOTICE '  電子郵件: admin@jcl-system.com';
  RAISE NOTICE '  密碼: JCL@Admin2024!';
  RAISE NOTICE '  ⚠️  請立即登入並更改預設密碼！';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '系統統計:';
  RAISE NOTICE '  租戶數量: %', (SELECT COUNT(*) FROM tenants);
  RAISE NOTICE '  使用者數量: %', (SELECT COUNT(*) FROM users);
  RAISE NOTICE '  角色數量: %', (SELECT COUNT(*) FROM roles);
  RAISE NOTICE '  權限數量: %', (SELECT COUNT(*) FROM permissions);
  RAISE NOTICE '==============================================';
END $$;