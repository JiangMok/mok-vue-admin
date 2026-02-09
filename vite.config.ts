import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())

  // 只在开发环境设置 API 地址，生产环境使用相对路径
  const isDevelopment = mode === 'development'
  const apiBaseUrl = isDevelopment
    ? env.VITE_API_BASE_URL || 'http://localhost:8080/api'
    : '' // 生产环境使用相对路径

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: isDevelopment ? {
      port: 5173,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path
        },
        '/uploads': {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    } : undefined,
    // 生产环境构建配置
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      // 生产环境使用相对路径
      emptyOutDir: true,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      }
    }
  }
})
