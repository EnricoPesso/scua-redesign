import { expect, test, type Page } from '@playwright/test';

/**
 * Assistente de IA de ponta a ponta, sempre no modo simulado: nenhum teste fala com um provedor de IA.
 * Cada teste falha se a página pedir qualquer coisa a /api/assistente ou se houver erro no console.
 */

const TAMANHOS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

let errosConsole: string[] = [];
let chamadasAoServidor: string[] = [];

test.beforeEach(async ({ page }) => {
  errosConsole = [];
  chamadasAoServidor = [];
  await page.addInitScript(() => { (globalThis as { __SCUA_IA_SIMULADO__?: boolean }).__SCUA_IA_SIMULADO__ = true; });
  page.on('console', (m) => { if (m.type() === 'error') errosConsole.push(m.text()); });
  page.on('pageerror', (e) => errosConsole.push(`pageerror: ${e.message}`));
  page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/api/assistente')) chamadasAoServidor.push(r.url()); });
});

test.afterEach(() => {
  expect(chamadasAoServidor, 'o teste não pode chamar o servidor do assistente').toEqual([]);
  expect(errosConsole, 'erros no console').toEqual([]);
});

async function abrir(page: Page, rota: string, titulo: string | RegExp) {
  await page.goto(rota);
  // A primeira abertura de cada área compila o código sob demanda no servidor de desenvolvimento.
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#conteudo [aria-busy="true"]')).toHaveCount(0);
}

const bolha = (page: Page) => page.getByRole('button', { name: 'Assistente Scua', exact: true });
const janela = (page: Page) => page.getByRole('dialog', { name: 'Assistente Scua' });

/** Abre a janela pela bolha e manda a mensagem. */
async function perguntar(page: Page, texto: string) {
  await bolha(page).click();
  const campo = janela(page).getByRole('textbox', { name: 'Mensagem para o assistente' });
  await campo.fill(texto);
  await campo.press('Enter');
}

async function semRolagemHorizontal(page: Page) {
  const { doc, largura } = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, largura: window.innerWidth }));
  expect(doc, 'rolagem horizontal').toBeLessThanOrEqual(largura);
}

for (const [nome, tamanho] of Object.entries(TAMANHOS)) {
  test.describe(`${nome} ${tamanho.width}×${tamanho.height}`, () => {
    test.use({ viewport: tamanho });

    test('pedido no Início cria uma jornada: abre o formulário preenchido e a pessoa salva', async ({ page }) => {
      await abrir(page, '/inicio', 'Início');
      await perguntar(page, 'cria uma jornada seg a sex, 8h às 17h, almoço 12 às 13, nome E2E-8H, tipo Comercial');

      await expect(page).toHaveURL(/\/jornadas\/nova/, { timeout: 30_000 });
      const identificador = page.getByRole('textbox', { name: /Identificador/ });
      await expect(identificador).toHaveValue('E2E-8H', { timeout: 30_000 });
      await expect(page.getByText('Preenchido pelo assistente. Confira antes de salvar.')).toBeVisible();
      const noFormulario = page.getByRole('region', { name: 'Assistente Scua' });
      await expect(noFormulario.getByText(/Confira e clique em Salvar\./)).toBeVisible();
      await semRolagemHorizontal(page);
      await page.screenshot({ path: `e2e/screenshots/assistente/jornada-preenchida-${nome}.png` });

      await page.getByRole('textbox', { name: /Descrição/ }).fill('Criada no teste de ponta a ponta');
      await page.getByRole('button', { name: 'Salvar', exact: true }).click();
      await expect(page.getByText('Jornada E2E-8H adicionada.')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('#conteudo').getByText('E2E-8H').first()).toBeVisible();
    });

    test('analisa o relatório aberto e cita o título', async ({ page }) => {
      await abrir(page, '/relatorios/tempo-de-bloqueio', 'Tempo de bloqueio');
      // O assistente só enxerga o relatório depois que os dados chegam (os indicadores aparecem).
      await expect(page.locator('#conteudo').getByText('Bloqueios liberados').first()).toBeVisible({ timeout: 30_000 });
      await perguntar(page, 'analisa esse relatório');
      const conversa = janela(page).getByRole('log', { name: 'Conversa com o assistente' });
      await expect(conversa).toContainText('Tempo de bloqueio', { timeout: 15_000 });
      await expect(conversa).toContainText('Bloqueios liberados');
      await semRolagemHorizontal(page);
      await page.screenshot({ path: `e2e/screenshots/assistente/relatorio-analisado-${nome}.png` });
    });
  });
}

test('leva para Ausências de ontem, com as datas na URL', async ({ page }) => {
  await abrir(page, '/inicio', 'Início');
  await perguntar(page, 'me leva para ausências de ontem');
  await expect(page).toHaveURL(/\/ausencias\?de=\d{4}-\d{2}-\d{2}&ate=\d{4}-\d{2}-\d{2}/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Ausências' })).toBeVisible({ timeout: 30_000 });
  const url = new URL(page.url());
  expect(url.searchParams.get('de')).toBe(url.searchParams.get('ate'));
});

test('quem não tem acesso à Auditoria continua na mesma tela e recebe a explicação', async ({ page }) => {
  await abrir(page, '/extensoes?como=olga', /Extens/);
  const antes = new URL(page.url()).pathname;
  await perguntar(page, 'me leva para auditoria');
  await expect(janela(page).getByRole('log', { name: 'Conversa com o assistente' })).toContainText('Não encontrei essa tela entre as que você tem acesso.', { timeout: 15_000 });
  expect(new URL(page.url()).pathname).toBe(antes);
});

test.describe('celular 390×844', () => {
  test.use({ viewport: TAMANHOS.mobile });

  test('a janela ocupa a tela, sem rolagem horizontal, com controles de 44px, e Fechar devolve o foco', async ({ page }) => {
    await abrir(page, '/inicio', 'Início');
    await bolha(page).click();
    const caixa = await janela(page).boundingBox();
    expect(caixa).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
    await semRolagemHorizontal(page);

    const pequenos = await janela(page).locator('button, textarea, input, [role="switch"]').evaluateAll((els: Element[]) => els
      .map((el) => {
        const alvo = (el.matches('[role="switch"], input[type="checkbox"]') ? el.closest('label') : null) ?? el;
        const c = alvo.getBoundingClientRect();
        return { nome: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40), altura: Math.round(c.height), largura: Math.round(c.width) };
      })
      .filter((c) => c.altura > 0 && c.altura < 44));
    expect(pequenos, 'controles com menos de 44px na janela').toEqual([]);
    await page.screenshot({ path: 'e2e/screenshots/assistente/janela-mobile.png' });

    await janela(page).getByRole('button', { name: 'Fechar assistente' }).click();
    await expect(janela(page)).toHaveCount(0);
    await expect(bolha(page)).toBeFocused();

    // Esc também fecha e devolve o foco.
    await bolha(page).click();
    await expect(janela(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(janela(page)).toHaveCount(0);
    await expect(bolha(page)).toBeFocused();
  });
});

test.describe('tema escuro', () => {
  test.use({ viewport: TAMANHOS.desktop, colorScheme: 'dark' });

  test('bolha e janela aparecem no tema escuro', async ({ page }) => {
    await abrir(page, '/inicio', 'Início');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(bolha(page)).toBeVisible();
    await perguntar(page, 'o que você faz?');
    await expect(janela(page).getByRole('log', { name: 'Conversa com o assistente' })).not.toBeEmpty();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/assistente/janela-escuro.png' });
  });
});

test('administrador desliga o assistente em Configurações e a bolha some', async ({ page }) => {
  await abrir(page, '/configuracoes/assistente-ia', 'Assistente de IA');
  await expect(bolha(page)).toBeVisible();
  await page.getByRole('switch', { name: 'Assistente ligado' }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('Configurações do assistente salvas.')).toBeVisible();
  await expect(bolha(page)).toHaveCount(0);
});
