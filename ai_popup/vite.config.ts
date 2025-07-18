import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    host: '0.0.0.0'
  },
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
    host: '0.0.0.0',
    allowedHosts: [
      'aipopup-production.up.railway.app',
      'mpencil.online',
      'www.mpencil.online',
      'localhost',
      '127.0.0.1'
    ]
  }
})
