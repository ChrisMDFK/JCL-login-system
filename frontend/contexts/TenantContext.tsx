'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  settings: {
    theme?: {
      primaryColor: string;
      logo?: string;
    };
    features?: {
      mfaRequired: boolean;
      passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSymbols: boolean;
      };
    };
  };
}

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 從 URL 或其他來源取得租戶資訊
  useEffect(() => {
    const loadTenant = async () => {
      try {
        // TODO: 實作從 API 載入租戶資訊的邏輯
        // 這裡可以根據子域名或其他方式識別租戶
        
        // 模擬載入延遲
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模擬租戶資料
        const mockTenant: Tenant = {
          id: 'demo-tenant',
          name: '示範公司',
          slug: 'demo-company',
          settings: {
            theme: {
              primaryColor: '#3b82f6',
              logo: '/images/demo-logo.png'
            },
            features: {
              mfaRequired: false,
              passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSymbols: false
              }
            }
          }
        };
        
        setTenant(mockTenant);
      } catch (error) {
        console.error('載入租戶資訊失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{
      tenant,
      setTenant,
      isLoading
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant 必須在 TenantProvider 內使用');
  }
  return context;
}