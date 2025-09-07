import './globals.css';
import type { Metadata } from 'next';
import { Inter, Noto_Sans_TC } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

/**
 * 字型設定
 * 支援英文和繁體中文顯示
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  variable: '--font-noto-sans-tc',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

/**
 * 網站元資料設定
 */
export const metadata: Metadata = {
  title: {
    default: 'JCL 企業身分驗證系統',
    template: '%s | JCL 企業身分驗證系統',
  },
  description: '安全、可靠的企業級多租戶身分驗證平台，提供完整的使用者管理和存取控制解決方案。',
  keywords: [
    '企業身分驗證',
    '多租戶',
    '單一登入',
    'SSO',
    '身分管理',
    '存取控制',
    'RBAC',
    'MFA',
    '多重驗證'
  ],
  authors: [{ name: 'JCL Enterprise Team', url: 'https://jcl-system.com' }],
  creator: 'JCL Enterprise',
  publisher: 'JCL Enterprise',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://jcl-system.com'),
  alternates: {
    canonical: '/',
    languages: {
      'zh-TW': '/zh-tw',
      'zh-CN': '/zh-cn',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://jcl-system.com',
    title: 'JCL 企業身分驗證系統',
    description: '安全、可靠的企業級多租戶身分驗證平台',
    siteName: 'JCL Enterprise Auth',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JCL 企業身分驗證系統',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JCL 企業身分驗證系統',
    description: '安全、可靠的企業級多租戶身分驗證平台',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#3b82f6' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JCL Auth',
  },
};

/**
 * 視窗設定
 */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

/**
 * 根布局元件
 * 提供全域樣式和上下文提供者
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="zh-TW" 
      className={`${inter.variable} ${notoSansTC.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* 預載入關鍵字型 */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/noto-sans-tc-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        
        {/* DNS 預解析 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//api.jcl-system.com" />
        
        {/* 預連接到重要域名 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* 安全政策 */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      </head>
      <body 
        className={`
          font-sans antialiased 
          bg-neutral-50 text-neutral-900
          dark:bg-neutral-900 dark:text-neutral-100
          selection:bg-primary-100 selection:text-primary-900
          dark:selection:bg-primary-900 dark:selection:text-primary-100
        `}
        suppressHydrationWarning
      >
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 btn btn-primary btn-sm"
        >
          跳到主要內容
        </a>

        {/* 全域提供者 */}
        <Providers>
          {/* 主要內容 */}
          <div id="main-content" className="min-h-screen">
            {children}
          </div>

          {/* Toast 通知系統 */}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '16px',
                fontSize: '14px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 25px -5px rgba(0, 0, 0, 0.04)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </Providers>

        {/* 背景圖案 */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-gradient-to-r from-secondary-100 to-accent-100 opacity-20 blur-3xl" />
        </div>

        {/* 載入指示器 */}
        <div id="global-loading" className="hidden">
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              <p className="text-sm font-medium text-neutral-600">載入中...</p>
            </div>
          </div>
        </div>

        {/* Service Worker 註冊腳本 */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}