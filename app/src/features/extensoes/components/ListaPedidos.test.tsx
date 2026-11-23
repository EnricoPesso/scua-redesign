import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../../app/AppRoutes';
import { Provedores } from '../../../app/Provedores';
import { criarQueryClient } from '../../../app/queryClient';
import { renderApp } from '../../../test/render';
import { server } from '../../../test/server';
import { extensoesApi } from '../api/extensoesApi';
import { entrarComo } from '../api/mocks/db';
import { TabelaPedidos } from './TabelaPedidos';
import { useFiltros } from './useFiltros';
import type { Pedido } from '../domain/types';

const NOMES = /Ana Souza|João Lima|Bia Rocha|Rui Alves|Xavier Pinto/;
const kpi = (nome: string) => screen.findByRole('group', { name: nome });
const linhaDe = (nome: string) => screen.getAllByRole('link', { name: nome })[0].closest('tr')!;

function Onde() {
  const { pathname, search } = useLocation();
  return <output data-testid="onde">{pathname + search}</output>;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Lista de pedidos', () => {
  it('fila mostra pendente de setembro primeiro (mais antigo primeiro)', async () => {
    renderApp('/extensoes/aprovar');
    await screen.findByRole('link', { name: 'Rui Alves' });
    const nomes = screen.getAllByRole('link', { name: NOMES }).map((l) => l.textContent);
    expect(nomes).toEqual(['Bia Rocha', 'João Lima', 'Ana Souza', 'Bia Rocha', 'Rui Alves']);
    expect(linhaDe('Bia Rocha')).toHaveTextContent('29/09 · 18:00–20:00');
  });

  it('linha mostra horas, motivo e status; contadores mostram o período', async () => {
    renderApp('/extensoes/aprovar');
    await screen.findByRole('link', { name: 'Ana Souza' });
    const ana = linhaDe('Ana Souza');
    expect(ana).toHaveTextContent('13–15/10 · 18:00–20:00');
    expect(within(ana).getByText('6h')).toBeInTheDocument();
    expect(within(ana).getByText('Janela de deploy')).toBeInTheDocument();
    expect(within(ana).getByText('Pendente')).toBeInTheDocument();
    const emAprovacao = await kpi('Em aprovação');
    await waitFor(() => expect(emAprovacao).not.toHaveAttribute('aria-busy'));
    expect(emAprovacao).toHaveTextContent('5');
    expect(emAprovacao).toHaveTextContent('no total');
  });

  it('"Meus pedidos" mostra pedido do mês que vem e o rótulo do período', async () => {
    await extensoesApi.criar({ beneficiarioId: 'u-ana', dataInicial: '2026-11-05', dataFinal: '2026-11-05', horario: { inicio: '18:00', fim: '19:00' }, justificativaCodigo: '5', detalhes: '' });
    entrarComo('ana');
    renderApp('/extensoes/meus');
    expect(await screen.findByText('05/11 · 18:00–19:00')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Ana Souza' })).toHaveLength(4);
    const horas = await kpi('Horas aprovadas');
    await waitFor(() => expect(horas).not.toHaveAttribute('aria-busy'));
    expect(horas).toHaveTextContent('6h');
    expect(horas).toHaveTextContent('a partir de 01/10');
  });

  it('"Para aprovar" mostra só o contador "Em aprovação" (aprovadas e reprovadas não fazem sentido numa fila de pendentes)', async () => {
    entrarComo('carlos');
    renderApp('/extensoes/aprovar');
    const emAprovacao = await kpi('Em aprovação');
    await waitFor(() => expect(emAprovacao).toHaveTextContent('5'));
    expect(screen.queryByRole('group', { name: 'Horas aprovadas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Reprovados' })).not.toBeInTheDocument();
  });

  it('RH filtra por status e o link de exportar leva o filtro', async () => {
    entrarComo('renata');
    const { user } = renderApp('/extensoes/todos');
    await screen.findByRole('link', { name: 'Xavier Pinto' });
    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Reprovado' }));
    await waitFor(() => expect(screen.getAllByRole('link', { name: NOMES })).toHaveLength(1));
    expect(screen.getByRole('link', { name: 'João Lima' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Exportar' })).toHaveAttribute('href', '/api/extensoes/exportar?aba=todos&de=2026-10-01&ate=2026-10-31&status=reprovado');
  });

  it('aba vazia mostra a mensagem própria', async () => {
    renderApp('/extensoes/meus');
    expect(await screen.findByText('Você ainda não pediu nenhuma extensão.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '+ Nova extensão' })).toHaveLength(2);
  });

  it('filtro sem resultado oferece limpar filtros', async () => {
    entrarComo('renata');
    const { user } = renderApp('/extensoes/todos');
    await screen.findByRole('link', { name: 'Xavier Pinto' });
    await user.type(screen.getByLabelText('Pessoa'), 'zzz');
    const vazio = await screen.findByText('Nenhum pedido no mês com esses filtros.');
    await user.click(within(vazio.closest('[data-slot="empty-state"]') as HTMLElement).getByRole('button', { name: 'Limpar filtros' }));
    expect(await screen.findByRole('link', { name: 'Xavier Pinto' })).toBeInTheDocument();
  });

  it('erro ao carregar mostra mensagem amigável e tenta de novo', async () => {
    // A API falha até o "Tentar de novo". Não dá para falhar "só a primeira chamada": o resumo do dia
    // do cabeçalho também consulta os pedidos, e a ordem das chamadas não é garantida.
    let falhando = true;
    server.use(http.get('*/api/extensoes', () => (falhando ? HttpResponse.json({ codigo: 'X' }, { status: 500 }) : undefined)));
    const { user } = renderApp('/extensoes/aprovar');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não conseguimos carregar os pedidos');
    expect(alerta).not.toHaveTextContent('500');
    falhando = false;
    await user.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: 'Rui Alves' })).toBeInTheDocument();
  });

  it('ignora paginação e status inválidos na URL', async () => {
    renderApp('/extensoes/aprovar?pagina=abc&tamanho=9999&status=xyz');
    await screen.findByRole('link', { name: 'Rui Alves' });
    expect(screen.getByRole('combobox', { name: 'Itens por página' })).toHaveTextContent('25');
    expect(screen.getByText('1–5 de 5')).toBeInTheDocument();
  });

  it('volta para a página 1 quando a página pedida não existe', async () => {
    renderApp('/extensoes/aprovar?pagina=9');
    expect(await screen.findByRole('link', { name: 'Rui Alves' })).toBeInTheDocument();
    expect(screen.getByText('1–5 de 5')).toBeInTheDocument();
  });

  it('clicar na linha ou apertar Enter no nome leva ao pedido, mantendo os filtros', async () => {
    const client = criarQueryClient({ semRetry: true });
    const user = userEvent.setup();
    render(
      <Provedores client={client}>
        <MemoryRouter initialEntries={['/extensoes/aprovar?pessoa=Rui']}>
          <AppRoutes />
          <Onde />
        </MemoryRouter>
      </Provedores>,
    );
    const link = await screen.findByRole('link', { name: 'Rui Alves' });
    const id = link.getAttribute('href')!.split('/').pop()!.split('?')[0];
    await user.click(within(linhaDe('Rui Alves')).getByText('Pendente'));
    expect(screen.getByTestId('onde')).toHaveTextContent(`/extensoes/aprovar/${id}?pessoa=Rui`);
  });

  it('Enter no nome da pessoa abre o pedido', async () => {
    const client = criarQueryClient({ semRetry: true });
    const user = userEvent.setup();
    render(
      <Provedores client={client}>
        <MemoryRouter initialEntries={['/extensoes/aprovar']}>
          <AppRoutes />
          <Onde />
        </MemoryRouter>
      </Provedores>,
    );
    (await screen.findByRole('link', { name: 'Rui Alves' })).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('onde').textContent).toMatch(/^\/extensoes\/aprovar\/[^/?]+$/);
  });

  it('"+ Nova extensão" leva para /extensoes/meus/novo', async () => {
    const client = criarQueryClient({ semRetry: true });
    const user = userEvent.setup();
    render(
      <Provedores client={client}>
        <MemoryRouter initialEntries={['/extensoes/aprovar']}>
          <AppRoutes />
          <Onde />
        </MemoryRouter>
      </Provedores>,
    );
    await user.click(await screen.findByRole('link', { name: '+ Nova extensão' }));
    expect(screen.getByTestId('onde')).toHaveTextContent('/extensoes/meus/novo');
  });

  it('muda o tamanho da página e mostra "Próxima" desativada quando acaba', async () => {
    const { user } = renderApp('/extensoes/aprovar');
    await screen.findByRole('link', { name: 'Rui Alves' });
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await user.click(screen.getByRole('combobox', { name: 'Itens por página' }));
    await user.click(await screen.findByRole('option', { name: '10' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Itens por página' })).toHaveTextContent('10'));
  });
});

describe('Tabela com coluna de seleção opcional', () => {
  const pedido = (id: string, nome: string): Pedido => ({
    id, beneficiario: { id: `u-${id}`, nome }, solicitante: { id: 'u-s', nome: 'Sol' }, gestor: null, grupo: null,
    dataInicial: '2026-10-13', dataFinal: '2026-10-13', horario: { inicio: '18:00', fim: '19:00' },
    justificativa: { codigo: '1', descricao: 'Deploy' }, detalhes: '', status: 'pendente', criadoEm: '2026-10-10T10:00:00', decisao: null,
  });

  it('sem "selecao" não mostra caixas; com "selecao" marca e avisa', async () => {
    const aoAlternar = vi.fn();
    const aoAlternarTodos = vi.fn();
    const user = userEvent.setup();
    const pedidos = [pedido('a', 'Ana'), pedido('b', 'Bia')];
    const { rerender } = render(<MemoryRouter><TabelaPedidos aba="aprovar" pedidos={pedidos} /></MemoryRouter>);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <TabelaPedidos aba="aprovar" pedidos={pedidos} selecao={{ selecionados: new Set(['a']), aoAlternar, aoAlternarTodos }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('checkbox', { name: 'Selecionar Ana' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Selecionar Bia' })).not.toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Selecionar Bia' }));
    expect(aoAlternar).toHaveBeenCalledWith('b', true);
    await user.click(screen.getByRole('checkbox', { name: 'Selecionar todos desta página' }));
    expect(aoAlternarTodos).toHaveBeenCalledWith(['a', 'b'], true);
  });
});

describe('useFiltros', () => {
  function Sonda() {
    const { filtros, ativos } = useFiltros('meus');
    return <p>{`${filtros.de}|${filtros.ate}|${filtros.pagina}|${filtros.tamanho}|${filtros.status ?? '-'}|${ativos}`}</p>;
  }
  it('Meus pedidos começa no dia 1º do mês e sem data final', () => {
    render(<MemoryRouter initialEntries={['/x?pagina=0']}><Sonda /></MemoryRouter>);
    expect(screen.getByText('2026-10-01||1|25|-|0')).toBeInTheDocument();
  });
});
