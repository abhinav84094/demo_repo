import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { env } from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
