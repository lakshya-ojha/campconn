import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    allowedHosts: true, // Allow any tunnel host
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      }
    }
  }
})
