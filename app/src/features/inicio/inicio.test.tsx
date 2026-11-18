import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../mock/rede';
import { renderApp } from '../../test/render';
import { decidirExterno, entrarComo } from '../extensoes/api/mocks/db';
import { inicioDaJanela, larguraDaBarra, mesCurto, nomeDoMes, resumirHistorico, textoDaJanela, ultimosMeses } from './domain';

describe('painel inicial: regras', () => {
  it('nomes de mês e os últimos meses atravessam a virada do ano', () => {
    expect(nomeDoMes('2026-10')).toBe('outubro de 2026');
    expect(mesCurto('2026-03')).toBe('mar/26');
    expect(ultimosMeses('2026-02', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  it('janelas: hoje, 7 dias (contando hoje) e o mês', () => {
    expect(inicioDaJanela('hoje', '2026-10-12')).toBe('2026-10-12');
    expect(inicioDaJanela('7dias', '2026-10-03')).toBe('2026-09-27');
    expect(inicioDaJanela('mes', '2026-10-12')).toBe('2026-10-01');
    expect(textoDaJanela('7dias', '2026-10-12')).toBe('de 06/10 a 12/10');
    expect(textoDaJanela('mes', '2026-10-12')).toBe('em outubro de 2026');
  });

  it('resumo do histórico: total, média e pico; zerado não tem pico', () => {
    const r = resumirHistorico([{ mes: '2026-08', minutos: 60 }, { mes: '2026-09', minutos: 180 }, { mes: '2026-10', minutos: 120 }]);
    expect(r).toEqual({ totalMin: 360, mediaMin: 120, pico: { mes: '2026-09', minutos: 180 } });
    expect(resumirHistorico([{ mes: '2026-10', minutos: 0 }]).pico).toBeNull();
    expect(resumirHistorico([]).pico).toBeNull();
  });

  it('barra: proporcional ao maior, zero não aparece e valor pequeno ainda é visível', () => {
    expect(larguraDaBarra(5, 10)).toBe(50);
    expect(larguraDaBarra(0, 10)).toBe(0);
    expect(larguraDaBarra(1, 1000)).toBe(2);
    expect(larguraDaBarra(3, 0)).toBe(0);
  });
});

describe('painel inicial: tela', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => definirFalhaDeRede(false));

  const kpi = (nome: string) => screen.findByRole('group', { name: nome });

  it('mostra os indicadores com o período de cada um e o aviso de pedidos para aprovar', async () => {
    entrarComo('carlos');
    renderApp('/inicio');
    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument();
    const usuarios = await kpi('Usuários cadastrados');
    await waitFor(() => expect(usuarios).toHaveTextContent('24'));
    expect(usuarios).toHaveTextContent('Situação atual');
    // Ana tem 6h aprovadas em outubro (p-5): o mesmo número que a tela de Extensões mostra.
    const horas = await kpi('Horas de extensão aprovadas');
    await waitFor(() => expect(horas).toHaveTextContent('6'));
    expect(horas).toHaveTextContent('em outubro de 2026');
    const aviso = screen.getByRole('region', { name: 'Para você resolver' });
    expect(aviso).toHaveTextContent('5 pedidos de extensão esperam a sua aprovação.');
    expect(within(aviso).getByRole('link', { name: 'Ver pedidos' })).toHaveAttribute('href', '/extensoes/aprovar');
  });

  it('gráfico por status: troca de período pela URL e mostra estado vazio em vez de eixos sem nada', async () => {
    entrarComo('carlos');
    const { user } = renderApp('/inicio');
    const lista = await screen.findByRole('list', { name: 'Pedidos por status, de 06/10 a 12/10' });
    expect(within(lista).getByText('Pendentes').closest('li')).toHaveTextContent('5');
    await user.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(screen.getByTestId('local-atual')).toHaveTextContent('/inicio?periodo=hoje');
    expect(await screen.findByRole('list', { name: 'Pedidos por status, hoje, 12/10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sem pedidos no período, explica em texto', async () => {
    entrarComo('olga');
    decidirExterno('p-9', 'aprovado');
    renderApp('/inicio?periodo=hoje');
    expect(await screen.findByText('Nenhum pedido de extensão hoje, 12/10.')).toBeInTheDocument();
  });

  it('histórico: valores escritos em cada mês e total, média e pico', async () => {
    entrarComo('carlos');
    renderApp('/inicio');
    const meses = await screen.findByRole('list', { name: 'Horas aprovadas por mês' });
    expect(within(meses).getAllByRole('listitem')).toHaveLength(6);
    expect(within(meses).getByText('outubro de 2026').closest('li')).toHaveTextContent('6h');
    expect(screen.getByText('Pico').nextElementSibling).toHaveTextContent('16h em ago/26');
  });

  it('falha ao carregar: mensagem amigável e "Tentar de novo" recupera', async () => {
    entrarComo('carlos');
    definirFalhaDeRede(true);
    const { user } = renderApp('/inicio');
    const alertas = await screen.findAllByRole('alert');
    expect(alertas[0]).toHaveTextContent('Não conseguimos carregar os dados');
    expect(document.body.textContent).not.toMatch(/ErroDeRede|simulada|Error/);
    definirFalhaDeRede(false);
    for (const botao of screen.getAllByRole('button', { name: 'Tentar de novo' })) await user.click(botao);
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(await kpi('Presentes')).toBeInTheDocument();
  });

  it('colaborador não tem painel: vê "Sem acesso" e "/" leva para Extensões', async () => {
    entrarComo('ana');
    renderApp('/inicio');
    expect(await screen.findByText('Você não tem acesso a esta tela')).toBeInTheDocument();
  });
});
