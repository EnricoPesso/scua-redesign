import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Critérios de aceite 1–13 da spec (docs/superpowers/specs/2026-10-22-extensao-de-jornada-design.md, seção 13).
 * Usuário padrão do mock: Carlos Mendes (gestor de Ana, João, Bia e Rui). `?como=<chave>` troca o usuário.
 * Fila "Para aprovar" do Carlos, do mais antigo para o mais novo: Bia (p-8), João (p-2), Ana (p-1), Bia (p-3), Rui (p-4).
 */

const TAMANHOS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

// ---------- erros de console: zero, exceto onde o teste provoca a falha ----------

let errosConsole: string[] = [];
/** Cenários que provocam erro da API (403, 409, 503): o navegador registra a resposta e a tela registra o detalhe técnico, de propósito. */
let ignorarErrosDeRede = false;

test.beforeEach(async ({ page }) => {
  errosConsole = [];
  ignorarErrosDeRede = false;
  page.on('console', (m) => { if (m.type() === 'error') errosConsole.push(m.text()); });
  page.on('pageerror', (e) => errosConsole.push(`pageerror: ${e.message}`));
});

test.afterEach(() => {
  const tecnico = /Failed to load resource: the server responded with a status of (403|409|503)|\[extensoes\] erro da API|ApiError/;
  const relevantes = ignorarErrosDeRede ? errosConsole.filter((t) => !tecnico.test(t)) : errosConsole;
  expect(relevantes, 'erros no console do navegador').toEqual([]);
});

// ---------- utilitários ----------

/** Dia daqui a `n` dias, no formato YYYY-MM-DD (dia local). */
function diaDaqui(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

async function escolher(page: Page, campo: string, opcao: string) {
  await page.getByRole('combobox', { name: campo }).click();
  await page.getByRole('option', { name: opcao, exact: true }).click();
}

async function semRolagemHorizontal(page: Page) {
  const larguras = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));
  expect(larguras.doc, 'rolagem horizontal').toBeLessThanOrEqual(larguras.janela);
}

/** Mede a área clicável: para caixas de seleção, o <label> em volta (o quadrado em si tem 20px). */
async function alvoDeToque(alvos: Locator) {
  for (const a of await alvos.all()) {
    if (!(await a.isVisible())) continue;
    const altura = await a.evaluate((el) => (el.closest('label') ?? el).getBoundingClientRect().height);
    const nome = (await a.getAttribute('aria-label')) ?? (await a.innerText());
    expect(altura, `altura de "${nome}"`).toBeGreaterThanOrEqual(44);
  }
}

const mock = (page: Page, codigo: string) => page.evaluate(codigo);

async function preencherPedidoParaAna(page: Page, inicio: string, fim: string) {
  await escolher(page, 'Colaborador', 'Ana Souza');
  await page.getByLabel('Primeiro dia').fill(inicio);
  await page.getByLabel('Último dia (opcional)').fill(fim);
  await page.getByLabel('Início').fill('18:00');
  await page.getByLabel('Fim').fill('20:00');
  await escolher(page, 'Por quê?', 'Janela de deploy');
}

// ---------- critérios ----------

test('1 e 3: pedido de 3 dias × 2h mostra 6h antes de enviar e aparece em Meus pedidos e na fila do gestor', async ({ page }) => {
  const inicio = diaDaqui(7);
  const fim = diaDaqui(9);
  await page.goto('/extensoes/meus/novo');
  await preencherPedidoParaAna(page, inicio, fim);
  await expect(page.getByText('3 dias × 2h = 6h de extensão')).toBeVisible();
  await page.getByRole('button', { name: 'Enviar pedido' }).click();
  await expect(page.getByText('Pedido enviado. Carlos Mendes vai receber o aviso.')).toBeVisible();

  const periodo = new RegExp(`^${inicio.slice(8, 10)}`);
  const linhaMeus = page.getByRole('row').filter({ has: page.getByRole('cell', { name: periodo }) });
  await expect(linhaMeus).toContainText('Ana Souza');
  await expect(linhaMeus).toContainText('Pendente');

  await page.getByRole('tab', { name: /Para aprovar/ }).click();
  await expect(page.getByRole('row').filter({ hasText: ddmm(fim) })).toContainText('Ana Souza');
});

test('2: "Outra" sem detalhes impede o envio e mostra a mensagem no campo', async ({ page }) => {
  await page.goto('/extensoes/meus/novo');
  await preencherPedidoParaAna(page, diaDaqui(7), '');
  await escolher(page, 'Por quê?', 'Outra');
  await page.getByRole('button', { name: 'Enviar pedido' }).click();
  await expect(page.getByText('Descreva o motivo')).toBeVisible();
  await expect(page.getByLabel('Detalhes (obrigatório)')).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'Nova extensão' })).toBeVisible();
});

test('4: o gestor aprova em 2 cliques e o próximo pedido da fila abre sozinho', async ({ page }) => {
  await page.goto('/extensoes/aprovar');
  await page.getByRole('link', { name: 'Ana Souza' }).click();
  await page.getByRole('dialog', { name: 'Pedido de Ana Souza' }).getByRole('button', { name: 'Aprovar' }).click();
  await expect(page.getByText('Pedido aprovado. Ana Souza vai receber o aviso.')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Pedido de Bia Rocha' })).toBeVisible();
  await expect(page).toHaveURL(/\/extensoes\/aprovar\/p-3$/);
});

test('5: reprovar sem motivo não é possível; o motivo aparece em destaque para quem pediu', async ({ page }) => {
  await page.goto('/extensoes/aprovar/p-1');
  await page.getByRole('button', { name: 'Reprovar' }).click();
  const passo = page.getByRole('dialog', { name: 'Reprovar pedido de Ana Souza' });
  await passo.getByRole('button', { name: 'Confirmar reprovação' }).click();
  await expect(passo.getByText('Escolha um motivo')).toBeVisible();
  await passo.getByRole('radio', { name: 'Combinar outro horário' }).check();
  await passo.getByRole('button', { name: 'Confirmar reprovação' }).click();
  await expect(page.getByText('Pedido reprovado. Ana Souza vai receber o aviso.')).toBeVisible();

  await page.goto('/extensoes/meus/p-6?como=joao');
  const motivo = page.getByRole('region', { name: 'Motivo da reprovação' });
  await expect(motivo).toContainText('Combinar outro horário');
  await expect(page.getByRole('link', { name: 'Pedir de novo com outra data' })).toBeVisible();
});

test('6: lote mostra o total de horas e, em falha parcial, cada falha com o motivo', async ({ page }) => {
  await page.goto('/extensoes/aprovar');
  await page.getByRole('checkbox', { name: 'Selecionar Ana Souza' }).click();
  await page.getByRole('checkbox', { name: 'Selecionar João Lima' }).click();
  await expect(page.getByRole('region', { name: 'Ações em lote' })).toContainText('2 selecionados · 8h no total');
  await mock(page, "window.__scuaMock.decidirExterno('p-2', 'aprovado', 'whatsapp')");
  await page.getByRole('region', { name: 'Ações em lote' }).getByRole('button', { name: 'Aprovar' }).click();
  const confirmar = page.getByRole('dialog', { name: 'Aprovar 2 pedidos?' });
  await expect(confirmar).toContainText('Total: 8h');
  await confirmar.getByRole('button', { name: 'Aprovar 2' }).click();
  const resultado = page.getByRole('dialog', { name: 'Resultado da aprovação' });
  await expect(resultado).toContainText('✓ 1 pedido aprovado');
  await expect(resultado).toContainText(/João Lima — já tinha sido aprovado por Carlos Mendes via WhatsApp às \d\d:\d\d/);
});

test('7: pedido decidido em outro canal mostra o conflito e os botões desativados', async ({ page }) => {
  ignorarErrosDeRede = true;
  await page.goto('/extensoes/aprovar/p-1');
  const painel = page.getByRole('dialog', { name: 'Pedido de Ana Souza' });
  await expect(painel.getByRole('button', { name: 'Aprovar' })).toBeEnabled();
  await mock(page, "window.__scuaMock.decidirExterno('p-1', 'aprovado', 'teams')");
  await painel.getByRole('button', { name: 'Aprovar' }).click();
  await expect(painel.getByText(/Este pedido já foi aprovado por Carlos Mendes via Teams às \d\d:\d\d\./)).toBeVisible();
  await expect(painel.getByRole('button', { name: 'Aprovar' })).toBeDisabled();
  await expect(painel.getByRole('button', { name: 'Reprovar' })).toBeDisabled();
});

test('8: os contadores mudam com o período e o rótulo mostra o período', async ({ page }) => {
  await page.goto('/extensoes/todos?como=renata');
  const pendentes = page.getByRole('group').filter({ hasText: 'Em aprovação' });
  await expect(pendentes).toContainText(/no mês/i);
  await expect(pendentes).toContainText('0');
  await page.getByLabel('De', { exact: true }).fill('2026-10-01');
  await page.getByLabel('Até', { exact: true }).fill('2026-10-31');
  await expect(pendentes).toContainText(/em outubro\/2026/i);
  await expect(pendentes).not.toContainText(/^Em aprovação0/);
  await expect(pendentes.locator('p').nth(1)).not.toHaveText('0');
});

test('9: cada aba vazia tem sua mensagem e filtro sem resultado oferece "Limpar filtros"', async ({ page }) => {
  await page.goto('/extensoes/meus?como=joao');
  await expect(page.getByText('Você ainda não pediu nenhuma extensão.')).toBeVisible();

  await page.goto('/extensoes/todos?como=renata');
  await expect(page.getByText('Nenhum pedido no mês.')).toBeVisible();

  await page.goto('/extensoes/aprovar?como=olga');
  await expect(page.getByRole('link', { name: 'Xavier Pinto' })).toBeVisible();
  await mock(page, "window.__scuaMock.decidirExterno('p-9', 'aprovado')");
  await page.getByRole('tab', { name: 'Meus pedidos' }).click();
  await page.getByRole('tab', { name: /Para aprovar/ }).click();
  await expect(page.getByText('Tudo em dia!')).toBeVisible();

  await page.goto('/extensoes/aprovar?pessoa=zzz');
  await expect(page.getByText(/com esses filtros\./)).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).first().click();
  await expect(page.getByRole('link', { name: 'Ana Souza' })).toBeVisible();
});

test('10: com a API fora do ar, mensagem amigável e "Tentar de novo", sem texto técnico', async ({ page }) => {
  ignorarErrosDeRede = true;
  await page.goto('/extensoes/aprovar');
  await expect(page.getByRole('link', { name: 'Ana Souza' })).toBeVisible();
  await mock(page, 'window.__scuaMock.simularFalha(true)');
  await page.getByRole('tab', { name: 'Meus pedidos' }).click();
  // O QueryClient tenta mais 2 vezes (1 s + 2 s) antes de desistir: falha passageira não assusta ninguém.
  const alerta = page.getByRole('alert');
  await expect(alerta).toContainText('Não conseguimos carregar os pedidos.', { timeout: 15_000 });
  await expect(alerta).toContainText('Verifique sua conexão. Se continuar, fale com o TI da sua empresa.');
  const corpo = await page.locator('body').innerText();
  expect(corpo).not.toMatch(/503|INDISPONIVEL|ProgressEvent|ApiError|Error:/);
  await mock(page, 'window.__scuaMock.simularFalha(false)');
  await page.getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(alerta).toBeHidden({ timeout: 15_000 });
});

test('11: link direto abre o painel; pedido sem permissão mostra acesso negado', async ({ page }) => {
  ignorarErrosDeRede = true;
  await page.goto('/extensoes/aprovar/p-1');
  await expect(page.getByRole('dialog', { name: 'Pedido de Ana Souza' })).toBeVisible();
  await page.goto('/extensoes/aprovar/p-1?como=olga');
  await expect(page.getByText('Você não tem acesso a este pedido.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voltar para minhas extensões' })).toBeVisible();
});

test('12: fluxo completo no celular sem rolagem horizontal e com alvos de 44px', async ({ page }) => {
  await page.setViewportSize(TAMANHOS.mobile);

  // Pedir
  await page.goto('/extensoes/meus');
  await semRolagemHorizontal(page);
  await page.getByRole('link', { name: '+ Nova extensão' }).first().click();
  const form = page.getByRole('dialog', { name: 'Nova extensão' });
  await preencherPedidoParaAna(page, diaDaqui(10), '');
  await alvoDeToque(form.getByRole('button', { name: /Enviar pedido|Cancelar/ }));
  for (const campo of ['Primeiro dia', 'Último dia (opcional)', 'Início', 'Fim']) await alvoDeToque(form.getByLabel(campo, { exact: true }));
  await semRolagemHorizontal(page);
  await form.getByRole('button', { name: 'Enviar pedido' }).click();
  await expect(page.getByText('Pedido enviado. Carlos Mendes vai receber o aviso.')).toBeVisible();

  // Aprovar individual
  await page.getByRole('tab', { name: /Para aprovar/ }).click();
  await page.getByRole('link', { name: 'Rui Alves' }).click();
  const painel = page.getByRole('dialog', { name: 'Pedido de Rui Alves' });
  await alvoDeToque(painel.getByRole('button', { name: /^(Aprovar|Reprovar)$/ }));
  await semRolagemHorizontal(page);
  await painel.getByRole('button', { name: 'Aprovar' }).click();
  await expect(page.getByText('Pedido aprovado. Rui Alves vai receber o aviso.')).toBeVisible();
  await page.keyboard.press('Escape');

  // Aprovar em lote
  await page.getByRole('checkbox', { name: 'Selecionar Ana Souza' }).first().click();
  await page.getByRole('checkbox', { name: 'Selecionar João Lima' }).click();
  const barra = page.getByRole('region', { name: 'Ações em lote' });
  await alvoDeToque(barra.getByRole('button'));
  await alvoDeToque(page.getByRole('checkbox', { name: /^Selecionar / }));
  await semRolagemHorizontal(page);
  await barra.getByRole('button', { name: 'Aprovar' }).click();
  await page.getByRole('dialog', { name: /^Aprovar \d+ pedidos\?$/ }).getByRole('button', { name: /^Aprovar \d+$/ }).click();
  await expect(page.getByText(/pedidos aprovados\. As pessoas vão receber o aviso\./)).toBeVisible();
});

test('13: tudo pelo teclado: Tab pelas linhas, Enter abre, Esc fecha e o foco volta para a linha', async ({ page }) => {
  await page.goto('/extensoes/aprovar');
  const joao = page.getByRole('link', { name: 'João Lima' });
  await expect(joao).toBeVisible();
  // Tab até a linha do João (passa por filtros, caixas de seleção e linhas).
  for (let i = 0; i < 40 && !(await joao.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(joao).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ana Souza' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Pedido de Ana Souza' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Pedido de Ana Souza' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Ana Souza' })).toBeFocused();
});

// ---------- screenshots nos 3 tamanhos (critério de pronto 3.1) ----------

for (const [nome, tamanho] of Object.entries(TAMANHOS)) {
  test(`screenshots: ${nome} ${tamanho.width}×${tamanho.height}`, async ({ page }) => {
    await page.setViewportSize(tamanho);
    const telas: [string, string, string][] = [
      ['lista-aprovar', '/extensoes/aprovar', 'Ana Souza'],
      ['detalhe', '/extensoes/aprovar/p-1', 'Pedido de Ana Souza'],
      ['formulario', '/extensoes/meus/novo', 'Nova extensão'],
      ['meus-reprovado', '/extensoes/meus/p-6?como=joao', 'Pedido de João Lima'],
    ];
    for (const [arquivo, rota, espera] of telas) {
      await page.goto(rota);
      await expect(page.getByText(espera).first()).toBeVisible();
      await page.waitForTimeout(1500); // fim das animações de entrada e da contagem dos KpiCards
      await semRolagemHorizontal(page);
      await page.screenshot({ path: `e2e/screenshots/${arquivo}-${nome}.png`, fullPage: true });
    }
  });
}
