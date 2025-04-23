import { defineConfig, loadEnv, ConfigEnv, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  // 加载环境变量（从项目根目录加载）
  const env = loadEnv(mode, resolve(process.cwd(), '../../'))
  const isProd = mode === 'production'
  
  return {
    plugins: [vue()],
    server: {
      port: 18181,
      host: true,
      fs: {
        // 允许为工作区依赖提供服务
        allow: ['..']
      },
      hmr: true,
      watch: {
        // 确保监视monorepo中其他包的变化
        ignored: ['!**/node_modules/@prompt-assistant/**']
      }
    },
    build: {
      // 增加chunk大小警告阈值
      chunkSizeWarningLimit: 1000,
      // 启用 gzip 压缩大小报告
      reportCompressedSize: true,
      // 设置最小文件大小，小于此大小的文件将被内联为 base64
      assetsInlineLimit: 4096,
      // 启用源码映射
      sourcemap: isProd ? 'hidden' : true,
      // 自定义底层的 Rollup 打包配置
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          // 入口文件名
          entryFileNames: 'assets/[name]-[hash].js',
          // chunk文件名
          chunkFileNames: 'assets/[name]-[hash].js',
          // 资源文件名
          assetFileNames: 'assets/[name]-[hash].[ext]',
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
            // 核心库
            if (id.includes('@prompt-assistant/core')) {
              return 'vendor-core'
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
      }
    },
    publicDir: 'public',
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@prompt-assistant/core': path.resolve(__dirname, '../core'),
        '@prompt-assistant/ui': path.resolve(__dirname, '../ui'),
        '@prompt-assistant/web': path.resolve(__dirname, '../web'),
        '@prompt-assistant/extension': path.resolve(__dirname, '../extension'),
        '@prompt-assistant/ui/styles/index.css': path.resolve(__dirname, '../ui/src/styles/index.css')
      }
    },
    optimizeDeps: {
      // 预构建依赖
      include: ['element-plus', 'vue'],
      // 强制预构建这些依赖
      force: true
    },
    define: {
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        ...Object.keys(env).reduce((acc, key) => {
          acc[key] = env[key];
          return acc;
        }, {})
      }
    },
    // CSS 优化选项
    css: {
      devSourcemap: true,
      modules: {
        scopeBehaviour: 'local',
        localsConvention: 'camelCase'
      }
    }
  }
})