import { defineConfig, devices } from '@playwright/test';

const PORTA = 5190;

// Ponta a ponta contra a API simulada (MSW no navegador). O estado do mock zera a cada carregamento
// de página, então cada teste começa limpo.
export default defineConfig({
  // Os testes esperam até 30 s pela primeira carga de uma tela; o teste inteiro precisa de folga acima disso.
  timeout: 60_000,
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'retain-on-failure',
    locale: 'pt-BR',
  },
  // PW_CANAL=chrome usa o Google Chrome instalado (sem precisar de `npx playwright install`).
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...(process.env.PW_CANAL ? { channel: process.env.PW_CANAL } : {}) },
  }],
  webServer: {
    command: `npm run dev:mock -- --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}/extensoes`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
