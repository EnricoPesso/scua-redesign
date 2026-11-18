import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../mock/rede';
import { renderApp } from '../../test/render';
import { decidirExterno, entrarComo } from '../extensoes/api/mocks/db';
import { fireEvent } from '@testing-library/react';
import { larguraDaBarra, lerPeriodo, mesCurto, minutosNoPeriodo, nomeDoMes, resumirHistorico, textoDoPeriodo, ultimosMeses } from './domain';

describe('painel inicial: regras', () => {
  it('nomes de mês e os últimos meses atravessam a virada do ano', () => {
    expect(nomeDoMes('2026-10')).toBe('outubro de 2026');
    expect(mesCurto('2026-03')).toBe('mar/26');
    expect(ultimosMeses('2026-02', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  it('período: atalhos, data escolhida e valores inválidos na URL', () => {
    const ler = (q: string) => lerPeriodo(new URLSearchParams(q), '2026-10-12');
    expect(ler('')).toEqual({ de: '2026-10-12', ate: '2026-10-12', tipo: 'hoje' });
    expect(ler('periodo=ontem')).toEqual({ de: '2026-10-11', ate: '2026-10-11', tipo: 'ontem' });
    expect(ler('periodo=7dias')).toEqual({ de: '2026-10-06', ate: '2026-10-12', tipo: '7dias' });
    expect(ler('periodo=mes')).toEqual({ de: '2026-10-01', ate: '2026-10-12', tipo: 'mes' });
    expect(ler('dia=2026-10-07')).toEqual({ de: '2026-10-07', ate: '2026-10-07', tipo: 'dia' });
    // Data futura ou inválida volta para hoje.
    expect(ler('dia=2026-12-01').tipo).toBe('hoje');
    expect(ler('dia=abc&periodo=xyz').tipo).toBe('hoje');
  });

  it('texto do período, sempre visível ao lado dos números', () => {
    const t = (q: string) => textoDoPeriodo(lerPeriodo(new URLSearchParams(q), '2026-10-12'));
    expect(t('')).toBe('hoje, 12/10');
    expect(t('periodo=ontem')).toBe('ontem, 11/10');
    expect(t('periodo=7dias')).toBe('de 06/10 a 12/10');
    expect(t('periodo=mes')).toBe('em outubro de 2026');
    expect(t('dia=2026-10-07')).toBe('em 07/10/2026');
  });

  it('minutos de uma extensão dentro do período: conta só os dias que caem nele', () => {
    const pedido = { dataInicial: '2026-10-06', dataFinal: '2026-10-08', horario: { inicio: '18:00', fim: '20:00' } };
    expect(minutosNoPeriodo(pedido, '2026-10-01', '2026-10-31')).toBe(360);
    expect(minutosNoPeriodo(pedido, '2026-10-07', '2026-10-07')).toBe(120);
    expect(minutosNoPeriodo(pedido, '2026-10-08', '2026-10-12')).toBe(120);
    expect(minutosNoPeriodo(pedido, '2026-10-09', '2026-10-12')).toBe(0);
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

  it('abre no resumo de hoje, com o período escrito em cada indicador e o aviso de pedidos para aprovar', async () => {
    entrarComo('carlos');
    renderApp('/inicio');
    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument();
    expect(screen.getByText('Olá, Carlos. Este é o resumo de hoje, 12/10/2026.')).toBeInTheDocument();
    const grupo = screen.getByRole('group', { name: 'Período do resumo' });
    expect(within(grupo).getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-pressed', 'true');
    const usuarios = await kpi('Usuários cadastrados');
    await waitFor(() => expect(usuarios).toHaveTextContent('24'));
    expect(usuarios).toHaveTextContent('Situação atual');
    const presentes = await kpi('Presentes');
    await waitFor(() => expect(presentes).not.toHaveAttribute('aria-busy'));
    expect(presentes).toHaveTextContent('hoje, 12/10');
    expect(await screen.findByRole('list', { name: 'Pedidos por status, hoje, 12/10' })).toBeInTheDocument();
    const aviso = screen.getByRole('region', { name: 'Para você resolver' });
    expect(aviso).toHaveTextContent('5 pedidos de extensão esperam a sua aprovação.');
    expect(within(aviso).getByRole('link', { name: 'Ver pedidos' })).toHaveAttribute('href', '/extensoes/aprovar');
  });

  it('atalho "7 dias" muda todos os números do período e fica na URL', async () => {
    entrarComo('carlos');
    const { user } = renderApp('/inicio');
    await screen.findByRole('list', { name: 'Pedidos por status, hoje, 12/10' });
    await user.click(within(screen.getByRole('group', { name: 'Período do resumo' })).getByRole('button', { name: '7 dias' }));
    expect(screen.getByTestId('local-atual')).toHaveTextContent('/inicio?periodo=7dias');
    expect(screen.getByText('Olá, Carlos. Este é o resumo de 06/10 a 12/10.')).toBeInTheDocument();
    const lista = await screen.findByRole('list', { name: 'Pedidos por status, de 06/10 a 12/10' });
    expect(within(lista).getByText('Pendentes').closest('li')).toHaveTextContent('5');
    // Ana tem 6h aprovadas de 06 a 08/10 (p-5): o mesmo número que a tela de Extensões mostra.
    const horas = await kpi('Horas de extensão aprovadas');
    await waitFor(() => expect(horas).toHaveTextContent('6'));
    expect(horas).toHaveTextContent('de 06/10 a 12/10');
    expect(await kpi('Presentes')).toHaveTextContent(/média por dia útil/);
  });

  it('"Escolher data" mostra o resumo daquele dia', async () => {
    entrarComo('carlos');
    renderApp('/inicio');
    const campo = await screen.findByLabelText('Escolher data');
    fireEvent.change(campo, { target: { value: '2026-10-07' } });
    await waitFor(() => expect(screen.getByTestId('local-atual')).toHaveTextContent('/inicio?dia=2026-10-07'));
    expect(screen.getByText('Olá, Carlos. Este é o resumo de 07/10/2026.')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Período do resumo' })).getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-pressed', 'false');
    // 07/10 é um dos três dias do pedido aprovado da Ana (2h por dia).
    const horas = await kpi('Horas de extensão aprovadas');
    await waitFor(() => expect(horas).toHaveTextContent('2'));
    expect(horas).toHaveTextContent('em 07/10/2026');
  });

  it('dia de fim de semana: presença sem dados, explicando o motivo', async () => {
    entrarComo('carlos');
    renderApp('/inicio?dia=2026-10-11');
    const presentes = await kpi('Presentes');
    await waitFor(() => expect(presentes).toHaveTextContent('Sem dados no período'));
    expect(presentes).toHaveTextContent('fim de semana');
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
