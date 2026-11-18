import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hojeIso, valoresPadrao } from '@/lib/relatorio';
import { CARREGADORES } from './carregadores';
import { RELATORIOS, TEMAS, temaDe } from './catalogo';

const texto = (no: unknown) => renderToStaticMarkup(<>{no as never}</>).replace(/<[^>]+>/g, '');
const campo = (row: unknown, chave: string) => (row as Record<string, unknown>)[chave];

async function carregar(slug: string) {
  const { default: config } = await CARREGADORES[slug]();
  const buscar = (f = valoresPadrao(config.filtros, hojeIso())) => config.buscar(f, new AbortController().signal);
  return { config, buscar };
}

describe('catálogo e configurações', () => {
  it('há uma configuração para cada relatório do catálogo, e só para eles', () => {
    expect(Object.keys(CARREGADORES).sort()).toEqual(RELATORIOS.map((r) => r.slug).sort());
    expect(RELATORIOS).toHaveLength(17);
  });

  describe.each(RELATORIOS)('$slug', (item) => {
    it('título, grupo e arquivo seguem o catálogo', async () => {
      const { config } = await carregar(item.slug);
      expect(config.titulo).toBe(item.titulo);
      expect(config.grupo).toBe(temaDe(item.tema).titulo);
      expect(config.arquivo).toBe(item.slug);
      expect(TEMAS.some((t) => t.titulo === config.grupo)).toBe(true);
    });

    it('tem de 2 a 4 KPIs e uma frase de vazio própria', async () => {
      const { config } = await carregar(item.slug);
      expect(config.kpis.length).toBeGreaterThanOrEqual(2);
      expect(config.kpis.length).toBeLessThanOrEqual(4);
      expect(config.vazio).toBeTruthy();
    });

    it('com os filtros padrão devolve linhas', async () => {
      const { buscar } = await carregar(item.slug);
      expect((await buscar()).length).toBeGreaterThan(0);
    });

    it('todas as colunas geram texto de CSV legível, sem código técnico', async () => {
      const { config, buscar } = await carregar(item.slug);
      const rows = await buscar();
      for (const c of config.colunas) {
        if (c.render) expect(c.texto, `a coluna "${c.header}" precisa de texto para o CSV`).toBeTypeOf('function');
        for (const row of rows) {
          const csv = c.texto ? c.texto(row) : String(campo(row, c.key) ?? '');
          expect(csv, c.header).not.toMatch(/undefined|\[object Object\]|null|EVT_/);
        }
      }
    });

    it('nenhuma célula mostra código técnico', async () => {
      const { config, buscar } = await carregar(item.slug);
      const rows = (await buscar()).slice(0, 60);
      for (const row of rows) {
        for (const c of config.colunas) {
          const celula = texto(c.render ? c.render(row) : campo(row, c.key));
          expect(celula, c.header).not.toMatch(/EVT_|undefined|\[object Object\]/);
        }
      }
    });

    it('os KPIs calculam números válidos', async () => {
      const { config, buscar } = await carregar(item.slug);
      const rows = await buscar();
      for (const k of config.kpis) expect(Number.isFinite(k.valor(rows)), k.rotulo).toBe(true);
    });
  });
});

describe('consistência entre relatórios de liberação', () => {
  const soma = (rows: Array<{ total: number }>) => rows.reduce((s, r) => s + r.total, 0);

  it('"por área" e "por gestor" somam exatamente as liberações de "Liberações e bloqueios"', async () => {
    const base = await carregar('liberacoes-e-bloqueios');
    const area = await carregar('liberacoes-por-area');
    const gestor = await carregar('liberacoes-por-gestor');
    const liberacoes = (await base.buscar()).filter((r) => campo(r, 'tipo') === 'Liberação').length;
    expect(liberacoes).toBeGreaterThan(0);
    expect(soma(await area.buscar())).toBe(liberacoes);
    expect(soma(await gestor.buscar())).toBe(liberacoes);
  });

  it('"Tempo de bloqueio" tem uma linha por liberação', async () => {
    const base = await carregar('liberacoes-e-bloqueios');
    const tempo = await carregar('tempo-de-bloqueio');
    const liberacoes = (await base.buscar()).filter((r) => campo(r, 'tipo') === 'Liberação').length;
    expect((await tempo.buscar()).length).toBe(liberacoes);
  });

  it('"Tempo de bloqueio" mostra o tempo bloqueado no formato 1h20', async () => {
    const { config, buscar } = await carregar('tempo-de-bloqueio');
    const col = config.colunas.find((c) => c.key === 'minutos')!;
    for (const r of await buscar()) expect(col.texto!(r)).toMatch(/^(\d+h(\d{2})?|\d+min)$/);
  });
});

describe('Estações e Extensões', () => {
  it('"Estações" une ativas e inativas e filtra pela situação', async () => {
    const { config, buscar } = await carregar('estacoes');
    const todas = await buscar();
    const base = valoresPadrao(config.filtros, hojeIso());
    const inativas = await buscar({ ...base, situacao: 'inativa' });
    const ativas = await buscar({ ...base, situacao: 'ativa' });
    expect(inativas).toHaveLength(3);
    expect(ativas.length + inativas.length).toBe(todas.length);
    expect(inativas.find((e) => campo(e, 'nome') === 'SCUA-NB-095')).toMatchObject({ versao: 'Não instalado' });
  });

  it('"Extensões de jornada" vem dos mesmos pedidos da tela de Extensões', async () => {
    const { todosOsPedidos } = await import('../extensoes/api/mocks/db');
    const { buscar } = await carregar('extensoes-de-jornada');
    expect((await buscar()).length).toBe(todosOsPedidos().length);
  });
});
