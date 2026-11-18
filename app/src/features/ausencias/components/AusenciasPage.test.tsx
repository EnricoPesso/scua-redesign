import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../../mock/rede';
import { renderApp } from '../../../test/render';

const local = () => screen.getByTestId('local-atual').textContent;
const BARRA = /^(Pausa|Almoço|Reunião externa|Sem atividade), \d\d:\d\d a \d\d:\d\d, /;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  vi.unstubAllGlobals();
});

describe('Ausências', () => {
  it('abre já com os dados do período padrão (últimos 7 dias) e o resumo no topo', async () => {
    renderApp('/ausencias');
    // O primeiro render do arquivo carrega a tela sob demanda: damos mais tempo.
    expect(await screen.findByRole('heading', { level: 1, name: 'Ausências' }, { timeout: 15_000 })).toBeInTheDocument();
    const horas = await screen.findByRole('group', { name: 'Horas ausentes' });
    await waitFor(() => expect(horas).not.toHaveAttribute('aria-busy'));
    expect(horas).toHaveTextContent('06/10 a 12/10');
    expect(screen.getByRole('group', { name: 'Pessoas com ausência' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Média por pessoa por dia' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Maior ausência contínua' })).toBeInTheDocument();
    expect(screen.getByLabelText('De')).toHaveValue('2026-10-06');
    expect(screen.getByLabelText('Até')).toHaveValue('2026-10-12');
  });

  it('no celular a tabela é a visão padrão, com paginação', async () => {
    renderApp('/ausencias');
    const tabela = await screen.findByRole('table', { name: 'Ausências por pessoa, dia e horário' });
    const cabecalho = within(tabela).getAllByRole('columnheader').map((c) => c.textContent);
    expect(cabecalho).toEqual(['Pessoa', 'Dia', 'Início', 'Fim', 'Duração', 'Motivo']);
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver linha do tempo' })).toBeInTheDocument();
  });

  it('seletor de pessoas por vez, ao lado do dia: troca a quantidade, pagina e guarda na URL', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('min-width'), media: q, addEventListener() {}, removeEventListener() {} }));
    const { user } = renderApp('/ausencias');
    const lista = await screen.findByRole('list', { name: 'Ausências em Seg 12/10' }, { timeout: 15_000 });
    const grupo = screen.getByRole('group', { name: 'Pessoas exibidas' });
    expect(within(grupo).getByText('1–10 de 24')).toBeInTheDocument();
    await user.click(within(grupo).getByRole('button', { name: 'Próximas pessoas' }));
    expect(within(grupo).getByText('11–20 de 24')).toBeInTheDocument();
    expect(screen.getByTestId('local-atual').textContent).toContain('pessoasPagina=2');
    expect(within(lista).getAllByRole('listitem')[0]).toHaveTextContent('Fábio Nunes');
    await user.click(within(grupo).getByRole('combobox', { name: 'Pessoas por vez' }));
    await user.click(await screen.findByRole('option', { name: 'Todas' }));
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Ausências em Seg 12/10' })).getAllByRole('listitem')).toHaveLength(24));
    expect(screen.getByTestId('local-atual').textContent).toContain('pessoas=todas');
    expect(screen.getByTestId('local-atual').textContent).not.toContain('pessoasPagina');
    expect(screen.queryByRole('button', { name: 'Próximas pessoas' })).not.toBeInTheDocument();
  });

  it('em tela larga a linha do tempo é a padrão, com uma linha por pessoa e barras com nome acessível', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('min-width'), media: q, addEventListener() {}, removeEventListener() {} }));
    renderApp('/ausencias');
    const lista = await screen.findByRole('list', { name: 'Ausências em Seg 12/10' });
    // 10 pessoas por vez, para não precisar rolar a página inteira.
    expect(within(lista).getAllByRole('listitem')).toHaveLength(10);
    expect(within(lista).getAllByRole('button', { name: BARRA }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Ver como tabela' })).toBeInTheDocument();
    // Legenda com texto, não só cor.
    const legenda = screen.getByRole('list', { name: 'Legenda dos motivos' });
    expect(within(legenda).getAllByRole('listitem').map((i) => i.textContent)).toEqual(['Pausa', 'Almoço', 'Reunião externa', 'Sem atividade']);
  });

  it('seletor de dia navega entre os dias úteis e grava o dia na URL', async () => {
    const { user } = renderApp('/ausencias?visao=linha');
    await screen.findByRole('list', { name: 'Ausências em Seg 12/10' });
    expect(screen.getByRole('button', { name: 'Próximo dia' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Dia anterior' }));
    expect(await screen.findByRole('list', { name: 'Ausências em Sex 09/10' })).toBeInTheDocument();
    expect(local()).toContain('dia=2026-10-09');
    await user.click(screen.getByRole('button', { name: 'Próximo dia' }));
    expect(await screen.findByRole('list', { name: 'Ausências em Seg 12/10' })).toBeInTheDocument();
  });

  it('a barra mostra o mesmo texto ao passar o mouse e ao receber foco', async () => {
    const { user } = renderApp('/ausencias?visao=linha');
    const lista = await screen.findByRole('list', { name: 'Ausências em Seg 12/10' });
    const barra = within(lista).getAllByRole('button', { name: BARRA })[0];
    const nome = barra.getAttribute('aria-label')!;
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.hover(barra);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(nome);
    await user.unhover(barra);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.tab();
    barra.focus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(nome);
  });

  it('alternar entre tabela e linha do tempo muda a URL', async () => {
    const { user } = renderApp('/ausencias?visao=linha');
    await screen.findByRole('list', { name: 'Ausências em Seg 12/10' });
    await user.click(screen.getByRole('button', { name: 'Ver como tabela' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(local()).toContain('visao=tabela');
    await user.click(screen.getByRole('button', { name: 'Ver linha do tempo' }));
    expect(await screen.findByRole('list', { name: 'Ausências em Seg 12/10' })).toBeInTheDocument();
  });

  it('filtrar por colaborador (URL) mostra só essa pessoa', async () => {
    renderApp('/ausencias?colaboradores=u-ana&visao=linha');
    const lista = await screen.findByRole('list', { name: 'Ausências em Seg 12/10' });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(1);
    expect(lista).toHaveTextContent('Ana Souza');
  });

  it('o filtro de gestor muda a URL e as linhas', async () => {
    const { user } = renderApp('/ausencias?visao=linha');
    await screen.findByRole('list', { name: 'Ausências em Seg 12/10' });
    await user.click(screen.getByRole('combobox', { name: 'Gestor' }));
    await user.click(await screen.findByRole('option', { name: 'Olga Prado' }));
    await waitFor(() => expect(local()).toContain('gestor=u-olga'));
    const lista = await screen.findByRole('list', { name: 'Ausências em Seg 12/10' });
    await waitFor(() => expect(within(lista).getAllByRole('listitem')).toHaveLength(5));
    expect(lista).not.toHaveTextContent('Ana Souza');
  });

  it('mudar a data altera a URL e o resumo', async () => {
    const { user } = renderApp('/ausencias');
    await screen.findByRole('table');
    const ate = screen.getByLabelText('Até');
    await user.clear(ate);
    await user.type(ate, '2026-10-09');
    await waitFor(() => expect(local()).toContain('ate=2026-10-09'));
    expect(await screen.findByRole('group', { name: 'Horas ausentes' })).toHaveTextContent('06/10 a 09/10');
  });

  it('período com mais de 31 dias mostra mensagem amigável e não consulta', async () => {
    renderApp('/ausencias?de=2026-08-01&ate=2026-10-12');
    expect(await screen.findByText('Escolha um período de no máximo 31 dias.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('sem ausência no período mostra o vazio e "Limpar filtros" desfaz o filtro', async () => {
    // Bia Rocha nunca sai da estação nos dados de exemplo.
    const { user } = renderApp('/ausencias?colaboradores=u-bia');
    expect(await screen.findByText('Nenhuma ausência entre 06/10 e 12/10.')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]);
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(local()).not.toContain('colaboradores');
  });

  it('erro ao carregar mostra aviso amigável e "Tentar de novo" recupera', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/ausencias');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não conseguimos carregar os dados');
    expect(alerta).not.toHaveTextContent(/Falha de rede simulada|ErroDeRede/);
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('mostra o esqueleto enquanto carrega', async () => {
    renderApp('/ausencias');
    expect(await screen.findByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    await screen.findByRole('table');
  });
});
