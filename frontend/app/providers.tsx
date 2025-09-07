'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { TooltipProvider } from '@/components/ui/Tooltip';

/**
 * React Query 客戶端配置
 * 設定快取和重試策略
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 設定 stale time 為 5 分鐘
      staleTime: 5 * 60 * 1000,
      // 設定 cache time 為 10 分鐘
      cacheTime: 10 * 60 * 1000,
      // 重試策略
      retry: (failureCount, error: any) => {
        // 對於 4xx 錯誤不重試
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // 最多重試 3 次
        return failureCount < 3;
      },
      // 重試延遲
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 當視窗重新獲得焦點時是否重新獲取數據
      refetchOnWindowFocus: false,
      // 當網路重新連接時是否重新獲取數據
      refetchOnReconnect: true,
    },
    mutations: {
      // 變更重試策略
      retry: (failureCount, error: any) => {
        // 對於客戶端錯誤不重試
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      // 重試延遲
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

/**
 * 全域提供者元件
 * 包裝所有必要的上下文提供者
 */
interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TenantProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </AuthProvider>
        </TenantProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}