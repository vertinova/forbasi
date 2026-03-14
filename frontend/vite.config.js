import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'

const versionJson = JSON.parse(readFileSync('./public/version.json', 'utf8'));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(versionJson.version),
  },
  server: {
    proxy: {
      '/uploads': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
    },
  },
})
