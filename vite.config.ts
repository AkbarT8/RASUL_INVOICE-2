import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  define: {
    __BUILD_SHA__: JSON.stringify(
      process.env.VITE_BUILD_SHA || process.env.GITHUB_SHA || 'local',
    ),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8888',
        changeOrigin: true,
      },
    },
  },
})
