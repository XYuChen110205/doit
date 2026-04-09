import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// 生成版本号 (时间戳)
const version = new Date().getTime()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DoIt - 高效待办管理',
        short_name: 'DoIt',
        description: '多角色任务管理系统，支持多端同步',
        theme_color: '#4A9FD4',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    // 添加版本号到文件名，强制浏览器刷新
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-${version}.js`,
        chunkFileNames: `assets/[name]-${version}.js`,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          return `assets/[name]-${version}[extname]`
        }
      }
    }
  }
})
