/** @type {import('next').NextConfig} */
const nextConfig = {
  // 輸出設定
  output: 'standalone',
  
  // 實驗性功能
  experimental: {
    // 啟用 App Router
    appDir: true,
  },

  // PWA 支援
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  },

  // 圖片優化設定
  images: {
    domains: ['localhost', 'jcl-system.com', 'admin.jcl-system.com', 'app.jcl-system.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // 國際化設定
  i18n: {
    locales: ['zh-TW', 'zh-CN', 'en'],
    defaultLocale: 'zh-TW',
  },

  // 安全標頭
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(self), payment=(), usb=()'
          }
        ]
      }
    ];
  },

  // 重寫規則
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`
      }
    ];
  },

  // Webpack 設定
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 自訂 webpack 配置
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // 環境變數
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // TypeScript 設定
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint 設定
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 壓縮設定
  compress: true,

  // 追蹤設定
  excludeDefaultMomentLocales: true,

  // 建置 ID
  generateBuildId: async () => {
    return `jcl-auth-${Date.now()}`;
  }
};

module.exports = nextConfig;