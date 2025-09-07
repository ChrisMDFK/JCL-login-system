'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// 認證狀態類型定義
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
  tenantId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 認證動作類型
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// 初始狀態
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Reducer 函數
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Context 類型定義
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  clearError: () => void;
}

// 建立 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 元件
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 登入函數
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      // TODO: 實作實際的登入 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬 API 延遲
      
      // 模擬成功回應
      const mockUser: User = {
        id: '1',
        email,
        name: 'Test User',
        roles: ['user'],
        tenantId: 'demo-tenant'
      };
      
      dispatch({ type: 'AUTH_SUCCESS', payload: mockUser });
    } catch (error) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: error instanceof Error ? error.message : '登入失敗' 
      });
    }
  };

  // 登出函數
  const logout = async (): Promise<void> => {
    try {
      // TODO: 實作實際的登出 API 呼叫
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('登出錯誤:', error);
    }
  };

  // 註冊函數
  const register = async (email: string, password: string, name: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      // TODO: 實作實際的註冊 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬 API 延遲
      
      // 模擬成功回應
      const mockUser: User = {
        id: '1',
        email,
        name,
        roles: ['user'],
        tenantId: 'demo-tenant'
      };
      
      dispatch({ type: 'AUTH_SUCCESS', payload: mockUser });
    } catch (error) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: error instanceof Error ? error.message : '註冊失敗' 
      });
    }
  };

  // 清除錯誤
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // 檢查本地儲存的認證狀態
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // TODO: 檢查 localStorage 或 cookie 中的認證資訊
        // 並驗證 token 是否有效
        const token = localStorage.getItem('auth_token');
        if (token) {
          // 驗證 token 並取得使用者資訊
          // const user = await validateToken(token);
          // dispatch({ type: 'AUTH_SUCCESS', payload: user });
        }
      } catch (error) {
        console.error('認證狀態檢查失敗:', error);
      }
    };

    checkAuthStatus();
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook 來使用 AuthContext
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  return context;
}