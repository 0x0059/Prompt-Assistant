import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [vue(), basicSsl()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@prompt-assistant/ui': resolve(__dirname, '../ui')
      },
    },
    base: './',  // 使用相对路径
    build: {
      outDir: 'dist',
      // 增加chunk大小警告阈值
      chunkSizeWarningLimit: 1000,
      // 启用 gzip 压缩大小报告
      reportCompressedSize: true,
      // 设置最小文件大小，小于此大小的文件将被内联为 base64
      assetsInlineLimit: 4096,
      // 启用源码映射
      sourcemap: isProd ? 'hidden' : true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'index.html')
        },
        output: {
          // 入口文件名
          entryFileNames: `assets/[name]-[hash].js`,
          // chunk文件名
          chunkFileNames: `assets/[name]-[hash].js`,
          // 资源文件名
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'background.js') {
              return 'background.js';
            }
            return `assets/[name]-[hash].[ext]`;
          },
          // 手动分块策略
          manualChunks(id) {
            // Vue相关库
            if (id.includes('vue')) {
              return 'vendor-vue'
            }
            // Element Plus相关
            if (id.includes('element-plus')) {
              return 'vendor-element'
            }
            // UI组件库
            if (id.includes('@prompt-assistant/ui')) {
              return 'vendor-ui'
            }
            // 工具库
            if (id.includes('uuid')) {
              return 'vendor-utils'
            }
            // 动态导入的组件
            if (id.includes('components/')) {
              return 'async-components'
            }
          }
        }
      },
      // 构建优化选项
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd
        }
      },
      copyPublicDir: true
    },
    server: {
      port: 5174,
      https: {}
    },
    // CSS 优化选项
    css: {
      devSourcemap: true,
      modules: {
        scopeBehaviour: 'local',
        localsConvention: 'camelCase'
      }
    },
    optimizeDeps: {
      // 预构建依赖
      include: ['element-plus', 'vue'],
      // 强制预构建这些依赖
      force: true,
      // 预构建的依赖将被缓存
      cacheDir: 'node_modules/.vite'
    }
  }
}) 