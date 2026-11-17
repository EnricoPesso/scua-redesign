import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  // prototipos.html: exemplos do modelo de relatório, também no build (preview e Lighthouse de performance)
  build: { rolldownOptions: { input: ['index.html', 'prototipos.html'] } },
})
