'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (isLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto px-4 py-16">
        {/* 標題區域 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gradient mb-6">
            JCL 企業身分驗證系統
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto">
            安全、可靠的企業級多租戶身分驗證平台，提供完整的使用者管理和存取控制解決方案
          </p>
        </div>

        {/* 功能特色 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">企業級安全</h3>
            <p className="text-neutral-600 dark:text-neutral-300">
              JWT + 刷新令牌、MFA、WebAuthn、OAuth2 整合
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">多租戶架構</h3>
            <p className="text-neutral-600 dark:text-neutral-300">
              完整的租戶隔離，支援 SaaS 模式部署
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">完整稽核</h3>
            <p className="text-neutral-600 dark:text-neutral-300">
              不可變稽核日誌、雜湊鏈驗證、詳細操作記錄
            </p>
          </div>
        </div>

        {/* 系統狀態 */}
        <div className="card max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">系統狀態</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* 認證狀態 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">認證狀態</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>登入狀態:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    isAuthenticated 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {isAuthenticated ? '已登入' : '未登入'}
                  </span>
                </div>
                {user && (
                  <>
                    <div className="flex justify-between">
                      <span>使用者:</span>
                      <span>{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>電子郵件:</span>
                      <span>{user.email}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 租戶資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">租戶資訊</h3>
              <div className="space-y-2">
                {tenant ? (
                  <>
                    <div className="flex justify-between">
                      <span>租戶名稱:</span>
                      <span>{tenant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>租戶 ID:</span>
                      <span className="font-mono text-sm">{tenant.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MFA 要求:</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        tenant.settings.features?.mfaRequired 
                          ? 'bg-warning-100 text-warning-800' 
                          : 'bg-success-100 text-success-800'
                      }`}>
                        {tenant.settings.features?.mfaRequired ? '必要' : '選用'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-neutral-500">載入中...</div>
                )}
              </div>
            </div>
          </div>

          {/* 主題切換 */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">主題設定</span>
              <div className="flex space-x-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      theme === t
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {t === 'light' ? '淺色' : t === 'dark' ? '深色' : '系統'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 text-sm text-neutral-500">
              目前主題: {resolvedTheme === 'light' ? '淺色模式' : '深色模式'}
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="text-center mt-16">
          <div className="space-x-4">
            <button className="btn btn-primary btn-lg">
              開始使用
            </button>
            <button className="btn btn-outline btn-lg">
              查看文件
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}