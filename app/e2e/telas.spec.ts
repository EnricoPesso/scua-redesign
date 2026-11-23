import { expect, test, type Page } from '@playwright/test';
import { CONFIGURACOES } from '../src/features/configuracoes/catalogo.ts';
import { RELATORIOS } from '../src/features/relatorios/catalogo.ts';

/**
 * Passada geral em TODAS as telas, nos 3 tamanhos dos critérios de pronto (CLAUDE.md, seção 3):
 * abre, tem o título certo, não tem rolagem horizontal, não tem erro no console, nenhum link do menu
 * está quebrado e, no celular, os controles têm pelo menos 44px. Gera os screenshots em e2e/screenshots/telas/.
 */

const TAMANHOS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

interface Tela { arquivo: string; rota: string; titulo: string }

const TELAS: Tela[] = [
  { arquivo: 'inicio', rota: '/inicio', titulo: 'Início' },
  { arquivo: 'extensoes', rota: '/extensoes/aprovar', titulo: 'Extensões de jornada' },
  { arquivo: 'ausencias', rota: '/ausencias', titulo: 'Ausências' },
  { arquivo: 'meus-dados', rota: '/meus-dados', titulo: 'Meus dados' },
  { arquivo: 'previsao', rota: '/previsao', titulo: 'Previsão de jornada' },
  { arquivo: 'radar-de-passivo', rota: '/radar-de-passivo', titulo: 'Radar de passivo' },
  { arquivo: 'dossie', rota: '/dossie?pessoa=u-ana', titulo: 'Dossiê do colaborador' },
  { arquivo: 'usuarios', rota: '/usuarios', titulo: 'Usuários' },
  { arquivo: 'jornadas', rota: '/jornadas', titulo: 'Jornadas de trabalho' },
  { arquivo: 'pausas', rota: '/pausas', titulo: 'Pausas' },
  { arquivo: 'liberacoes-por-diretoria', rota: '/liberacoes-por-diretoria', titulo: 'Liberações por diretoria' },
  { arquivo: 'relatorios', rota: '/relatorios', titulo: 'Relatórios' },
  ...RELATORIOS.map((r) => ({ arquivo: `relatorio-${r.slug}`, rota: `/relatorios/${r.slug}`, titulo: r.titulo })),
  { arquivo: 'configuracoes', rota: '/configuracoes', titulo: 'Configurações' },
  ...CONFIGURACOES.map((c) => ({ arquivo: `configuracao-${c.slug}`, rota: `/configuracoes/${c.slug}`, titulo: c.titulo })),
  { arquivo: 'carga-de-dados', rota: '/carga-de-dados', titulo: 'Carga de dados' },
  { arquivo: 'auditoria', rota: '/auditoria', titulo: 'Auditoria' },
  { arquivo: 'sobre', rota: '/sobre', titulo: 'Sobre' },
];

let errosConsole: string[] = [];

test.beforeEach(async ({ page }) => {
  errosConsole = [];
  page.on('console', (m) => { if (m.type() === 'error') errosConsole.push(m.text()); });
  page.on('pageerror', (e) => errosConsole.push(`pageerror: ${e.message}`));
});

/** Espera a tela assentar: título visível, sem esqueleto de carregamento e animações de entrada terminadas. */
async function abrir(page: Page, tela: Tela) {
  await page.goto(tela.rota);
  // A primeira abertura de cada área compila o código sob demanda no servidor de desenvolvimento.
  await expect(page.getByRole('heading', { level: 1, name: tela.titulo, exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#conteudo [aria-busy="true"]')).toHaveCount(0);
  await page.waitForTimeout(700);
}

async function conferirLargura(page: Page, tela: Tela) {
  const { doc, janela } = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));
  expect(doc, `rolagem horizontal em ${tela.rota}`).toBeLessThanOrEqual(janela);
}

/** Controles visíveis da tela com menos de 44px de altura (área clicável: o <label> em volta conta). */
async function alvosPequenos(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const seletor = '#conteudo :is(button, a[data-slot="button"], input:not([type="hidden"]):not([type="file"]), select, textarea, [role="combobox"], [role="tab"])';
    const pequenos: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(seletor))) {
      const alvo = (el.matches('input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="switch"]') ? el.closest('label') : null) ?? el;
      const caixa = alvo.getBoundingClientRect();
      if (caixa.width === 0 || caixa.height === 0) continue;
      if (el.closest('[aria-hidden="true"], .sr-only')) continue;
      if (caixa.height < 43.5) pequenos.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? el.getAttribute('name') ?? '').trim().slice(0, 40)}" ${Math.round(caixa.height)}px`);
    }
    return pequenos;
  });
}

for (const [nome, tamanho] of Object.entries(TAMANHOS)) {
  test.describe(`${nome} ${tamanho.width}×${tamanho.height}`, () => {
    test.use({ viewport: tamanho });

    for (const tela of TELAS) {
      test(`${tela.rota}`, async ({ page }) => {
        await abrir(page, tela);
        await conferirLargura(page, tela);
        if (nome === 'mobile') expect(await alvosPequenos(page), `alvos de toque menores que 44px em ${tela.rota}`).toEqual([]);
        await expect(page).toHaveTitle(`${tela.titulo} · Scua Logon`);
        await page.screenshot({ path: `e2e/screenshots/telas/${tela.arquivo}-${nome}.png`, fullPage: true });
        expect(errosConsole, `erros no console em ${tela.rota}`).toEqual([]);
      });
    }
  });
}

// Tema escuro em todas as telas (desktop): o sistema operacional em modo escuro já abre o app escuro.
test.describe('tema escuro, desktop 1440×900', () => {
  test.use({ viewport: TAMANHOS.desktop, colorScheme: 'dark' });

  for (const tela of TELAS) {
    test(`${tela.rota}`, async ({ page }) => {
      await abrir(page, tela);
      await expect(page.locator('html')).toHaveClass(/dark/);
      await conferirLargura(page, tela);
      await page.screenshot({ path: `e2e/screenshots/telas/${tela.arquivo}-escuro.png`, fullPage: true });
      expect(errosConsole, `erros no console em ${tela.rota}`).toEqual([]);
    });
  }
});

test('o botão "Modo escuro" alterna o tema e a escolha vale depois de recarregar', async ({ page }) => {
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible({ timeout: 30_000 });
  const botao = page.getByRole('button', { name: 'Modo escuro' });
  await expect(botao).toHaveAttribute('aria-pressed', 'false');
  await botao.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Modo escuro' })).toHaveAttribute('aria-pressed', 'true');
});

test('todos os links do menu abrem uma tela que existe', async ({ page }) => {
  // Abre as 16 telas em sequência: o limite padrão de 30 s é por teste, não por tela.
  test.setTimeout(180_000);
  await page.goto('/inicio');
  const menu = page.getByRole('navigation', { name: 'Menu principal' }).first();
  await expect(menu.getByRole('link', { name: 'Sobre' })).toBeVisible();
  const destinos = await menu.getByRole('link').evaluateAll((links: Element[]) => links.map((a) => a.getAttribute('href') ?? ''));
  expect(destinos).toHaveLength(16);
  for (const destino of destinos) {
    await page.goto(destino);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(/não encontrada|Sem acesso|Tela em construção/);
    await expect(page.getByText('Tela em construção')).toHaveCount(0);
  }
  expect(errosConsole).toEqual([]);
});

test('menu pelo teclado: Tab chega aos itens, Enter abre a tela e o foco é visível', async ({ page }) => {
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  const usuarios = page.getByRole('navigation', { name: 'Menu principal' }).first().getByRole('link', { name: 'Usuários' });
  for (let i = 0; i < 15 && !(await usuarios.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(usuarios).toBeFocused();
  const anel = await usuarios.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(anel, 'anel de foco visível').not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Usuários' })).toBeVisible();
});

test('busca de telas (Ctrl+K) abre um relatório pelo nome', async ({ page }) => {
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible();
  await page.keyboard.press('Control+k');
  const busca = page.getByRole('dialog', { name: 'Buscar tela' });
  await busca.getByRole('searchbox').fill('batidas');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Batidas de ponto' })).toBeVisible();
});

test('perfil de colaboração vê só Extensões e Meus dados e é barrado nas outras telas', async ({ page }) => {
  await page.goto('/?como=ana');
  await expect(page).toHaveURL(/\/extensoes/);
  const menu = page.getByRole('navigation', { name: 'Menu principal' }).first();
  await expect(menu.getByRole('link')).toHaveText(['Extensões de jornada', 'Meus dados']);
  await page.goto('/usuarios?como=ana');
  await expect(page.getByRole('heading', { level: 1, name: 'Sem acesso' })).toBeVisible();
});
