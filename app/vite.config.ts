import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

// O sistema de design fica em ../design-system (fora de app/).
// Os componentes dele importam "@/lib/utils", então "@" aponta para lá.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(import.meta.dirname, '../design-system/src') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'jsdom',
    // Pacotes CommonJS de design-system/node_modules fariam `require('react')` pegar o React de lá
    // (dois Reacts, "dispatcher null"): usamos a versão ESM do lucide e um shim do hook nativo.
    alias: [
      { find: /^use-sync-external-store\/shim(\/with-selector)?$/, replacement: path.resolve(import.meta.dirname, 'src/test/shims/use-sync-external-store.ts') },
      { find: /^lucide-react$/, replacement: path.resolve(import.meta.dirname, '../design-system/node_modules/lucide-react/dist/esm/lucide-react.mjs') },
    ],
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // A primeira importação do base-ui (inline, sem cache) pode passar de 5 s.
    testTimeout: 15_000,
    // Pacotes que só existem em design-system/node_modules precisam passar pelo Vite
    // (senão o Node carrega o React deles e o app fica com dois Reacts).
    server: { deps: { inline: [/design-system[/\\]node_modules/] } },
  },
})
