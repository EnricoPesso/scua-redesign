import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../../mock/rede';
import { renderApp } from '../../../test/render';

const local = () => screen.getByTestId('local-atual').textContent;

/** Tela larga: a lista vira tabela (no celular, cartões). */
function telaLarga() {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('min-width'), media: q, addEventListener() {}, removeEventListener() {} }));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Auditoria', () => {
  it('abre já com a primeira aba e registros do período padrão (cartões no celular)', async () => {
    renderApp('/auditoria');
    // O primeiro render do arquivo carrega a tela sob demanda: damos mais tempo.
    expect(await screen.findByRole('heading', { level: 1, name: 'Auditoria' }, { timeout: 15_000 })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Parâmetros' })).toHaveAttribute('aria-selected', 'true');
    const lista = await screen.findByRole('list', { name: 'Alterações registradas' });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(24);
    expect(screen.getByLabelText('De')).toHaveValue('2026-09-13');
    expect(screen.getByLabelText('Até')).toHaveValue('2026-10-12');
  });

  it('tabela mostra item, ação, valor anterior para novo, quem alterou e data e hora', async () => {
    telaLarga();
    renderApp('/auditoria');
    const tabela = await screen.findByRole('table', { name: 'Alterações registradas' });
    expect(within(tabela).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Item alterado', 'Ação', 'Valor anterior e novo', 'Quem alterou', 'Data e hora']);
    const linhas = within(tabela).getAllByRole('row').slice(1);
    expect(linhas.length).toBeGreaterThan(5);
    expect(linhas[0]).toHaveTextContent(/\d\d\/\d\d\/\d{4} \d\d:\d\d/);
    expect(linhas[0]).toHaveTextContent(/Criou|Alterou|Excluiu/);
    // A seta tem texto alternativo "para".
    const alterou = linhas.find((l) => l.textContent?.includes('Alterou'))!;
    expect(alterou).toHaveTextContent('para');
    // Valor ausente aparece como "vazio" em itálico.
    const criou = linhas.find((l) => l.textContent?.includes('Criou'))!;
    expect(within(criou).getByText('vazio').tagName).toBe('EM');
  });

  it('trocar de aba pelo clique muda a URL e o conteúdo', async () => {
    const { user } = renderApp('/auditoria?busca=');
    await screen.findByRole('list', { name: 'Alterações registradas' });
    await user.click(screen.getByRole('tab', { name: 'Jornadas' }));
    await waitFor(() => expect(local()).toContain('/auditoria/jornadas'));
    expect(screen.getByRole('tab', { name: 'Jornadas' })).toHaveAttribute('aria-selected', 'true');
    expect((await screen.findAllByText(/Jornada comercial|Turno da tarde|Jornada administrativa|Plantão de fim de semana|Jornada 6x1/, { selector: 'p' })).length).toBeGreaterThan(0);
  });

  it('abre a aba que está na URL e troca pelo teclado', async () => {
    const { user } = renderApp('/auditoria/excecoes');
    const aba = await screen.findByRole('tab', { name: 'Exceções' });
    expect(aba).toHaveAttribute('aria-selected', 'true');
    aba.focus();
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(local()).toContain('/auditoria/liberacoes'));
    expect(screen.getByRole('tab', { name: 'Liberações de regra' })).toHaveFocus();
    await user.keyboard('{End}');
    await waitFor(() => expect(local()).toContain('/auditoria/whatsapp'));
  });

  it('aba inválida na URL cai na primeira', async () => {
    renderApp('/auditoria/nao-existe');
    expect(await screen.findByRole('tab', { name: 'Parâmetros' })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(local()).toBe('/auditoria/parametros'));
  });

  it('o filtro "Quem alterou" muda a URL e o resultado', async () => {
    telaLarga();
    const { user } = renderApp('/auditoria');
    const tabela = await screen.findByRole('table');
    const antes = within(tabela).getAllByRole('row').length;
    await user.click(screen.getByRole('combobox', { name: 'Quem alterou' }));
    await user.click(await screen.findByRole('option', { name: 'Ana Souza' }));
    await waitFor(() => expect(local()).toContain('quem=u-ana'));
    await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row').length).toBeLessThan(antes));
    for (const linha of within(screen.getByRole('table')).getAllByRole('row').slice(1)) expect(linha).toHaveTextContent('Ana Souza');
  });

  it('busca por item filtra e vai para a URL', async () => {
    telaLarga();
    const { user } = renderApp('/auditoria');
    await screen.findByRole('table');
    await user.type(screen.getByRole('searchbox', { name: 'Buscar item' }), 'almoco');
    await waitFor(() => expect(local()).toContain('busca=almoco'));
    const linhas = await waitFor(() => {
      const l = within(screen.getByRole('table')).getAllByRole('row').slice(1);
      expect(l.length).toBeGreaterThan(0);
      return l;
    });
    for (const linha of linhas) expect(linha).toHaveTextContent('Intervalo mínimo de almoço');
  });

  it('nenhum registro mostra o vazio com "Limpar filtros", que desfaz a busca', async () => {
    const { user } = renderApp('/auditoria?busca=zzzz');
    expect(await screen.findByText('Nenhuma alteração em Parâmetros nesse período.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled();
    await user.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]);
    expect(await screen.findByRole('list', { name: 'Alterações registradas' })).toBeInTheDocument();
    expect(local()).not.toContain('busca');
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
  });

  it('paginação: 25 por padrão, 10 por escolha, e o tamanho não muda sozinho', async () => {
    const { user } = renderApp('/auditoria?de=2026-01-01');
    await screen.findByRole('list', { name: 'Alterações registradas' });
    expect(screen.getByRole('combobox', { name: 'Itens por página' })).toHaveTextContent('25');
    const cartoes = () => within(screen.getByRole('list', { name: 'Alterações registradas' })).getAllByRole('listitem');
    expect(cartoes()).toHaveLength(25);
    await user.click(screen.getByRole('combobox', { name: 'Itens por página' }));
    await user.click(await screen.findByRole('option', { name: '10' }));
    await waitFor(() => expect(cartoes()).toHaveLength(10));
    expect(local()).toContain('tamanho=10');
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    await waitFor(() => expect(local()).toContain('pagina=2'));
    expect(screen.getByText('11–20 de 25')).toBeInTheDocument();
    // Trocar de aba volta para a primeira página e mantém o tamanho.
    await user.click(screen.getByRole('tab', { name: 'WhatsApp' }));
    await waitFor(() => expect(local()).toContain('/auditoria/whatsapp'));
    expect(local()).toContain('tamanho=10');
    expect(local()).not.toContain('pagina=');
  });

  it('Exportar CSV baixa a aba atual com os filtros aplicados e avisa com toast', async () => {
    const criar = vi.fn((b: Blob) => { void b; return 'blob:teste'; });
    URL.createObjectURL = criar;
    URL.revokeObjectURL = vi.fn();
    const cliques: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { cliques.push(this.download); });
    const { user } = renderApp('/auditoria/jornadas?quem=u-ana');
    const botao = await screen.findByRole('button', { name: 'Exportar CSV' });
    await waitFor(() => expect(botao).toBeEnabled());
    await user.click(botao);
    expect(cliques).toEqual(['auditoria-jornadas-2026-10-12.csv']);
    const csv = await criar.mock.calls[0][0].text();
    const linhas = csv.replace('﻿', '').split('\r\n');
    expect(linhas[0]).toBe('Item alterado;Ação;Valor anterior;Valor novo;Quem alterou;Data e hora');
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas.slice(1)) expect(l).toContain('Ana Souza');
    expect(await screen.findByText(/registros? exportados? em auditoria-jornadas-2026-10-12\.csv/)).toBeInTheDocument();
  });

  it('erro ao carregar mostra aviso amigável e "Tentar de novo" recupera', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/auditoria');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não conseguimos carregar os dados');
    expect(alerta).not.toHaveTextContent(/Falha de rede simulada|ErroDeRede/);
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled();
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('list', { name: 'Alterações registradas' })).toBeInTheDocument();
  });

  it('mostra o esqueleto enquanto carrega', async () => {
    renderApp('/auditoria');
    expect(await screen.findByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    await screen.findByRole('list', { name: 'Alterações registradas' });
  });
});
