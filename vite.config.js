import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// dev 用 '/'（根路径正常服务），build 用 './'（Electron loadFile 相对路径加载资源）
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? './' : '/',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
}))