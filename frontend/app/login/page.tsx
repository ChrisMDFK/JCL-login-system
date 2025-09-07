'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.login(email, password);
      if (response.success) {
        toast.success('登入成功！');
        await login(email, password);
      } else {
        toast.error(response.error || '登入失敗');
      }
    } catch (error) {
      toast.error('登入過程中發生錯誤');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
      <div className="card max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            JCL 企業身分驗證
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            請登入您的帳戶
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              電子郵件
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="請輸入您的電子郵件"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              密碼
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="請輸入您的密碼"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-md w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner w-4 h-4 mr-2" />
                登入中...
              </div>
            ) : (
              '登入'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            還沒有帳戶？{' '}
            <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              立即註冊
            </a>
          </p>
        </div>

        {/* 測試用預設帳戶資訊 */}
        <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            測試帳戶
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            電子郵件: admin@jcl-system.com<br />
            密碼: JCL@Admin2024!
          </p>
        </div>
      </div>
    </div>
  );
}