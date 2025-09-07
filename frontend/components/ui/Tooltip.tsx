'use client';

import { createContext, useContext, ReactNode } from 'react';

// 簡單的 Tooltip Provider 實作
interface TooltipContextType {
  // 可以在這裡加入全域 tooltip 設定
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

interface TooltipProviderProps {
  children: ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return (
    <TooltipContext.Provider value={{}}>
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltip() {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error('useTooltip 必須在 TooltipProvider 內使用');
  }
  return context;
}