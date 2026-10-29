import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

// O sistema de design fica em ../design-system (fora de app/).
// Os componentes dele importam "@/lib/utils", então "@" aponta para lá.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, '../design-system/src') },
    dedupe: ['react', 'react-dom'],
  },
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Pacotes que só existem em design-system/node_modules precisam passar pelo Vite
    // (senão o Node carrega o React deles e o app fica com dois Reacts).
    server: { deps: { inline: [/design-system[/\\]node_modules/] } },
  },
})
