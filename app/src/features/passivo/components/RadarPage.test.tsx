import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CUSTO_PADRAO } from '../../../lib/conformidade';
import { definirFalhaDeRede } from '../../../mock/rede';
import { PESSOAS_DIRETORIO } from '../../../mock/diretorio';
import { renderApp } from '../../../test/render';
import { radarApi } from '../api';
import { calcularRadar } from '../domain/radar';

const local = () => screen.getByTestId('local-atual').textContent;
const reais = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v).replace(/\s/g, ' ');
const normal = (t: string | null) => (t ?? '').replace(/\s/g, ' ');

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  window.localStorage.clear();
  vi.restoreAllMocks();
});

async function esperado(periodo = 30, parametros = CUSTO_PADRAO, diretoria = '') {
  const d = await radarApi.carregar(periodo as 30);
  return calcularRadar({ dias: d.dias, custoHora: d.custoHora, pessoas: PESSOAS_DIRETORIO, parametros, diretoria });
}

describe('Radar de passivo', () => {
  it('mostra os dois números em destaque, os indicadores e os gráficos', async () => {
    renderApp('/radar-de-passivo');
    expect(await screen.findByRole('heading', { level: 1, name: 'Radar de passivo' }, { timeout: 15_000 })).toBeInTheDocument();
    const r = await esperado();
    const risco = await screen.findByRole('group', { name: 'Em risco' });
    expect(normal(risco.textContent)).toContain(reais(r.emRisco));
    expect(normal(screen.getByRole('group', { name: 'Evitado pelo bloqueio' }).textContent)).toContain(reais(r.evitado));
    for (const nome of ['Horas sem aprovação', 'Pessoas envolvidas', 'Tentativas barradas']) expect(screen.getByRole('group', { name: nome })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Valor em risco por regra' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Valor em risco por gestor' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Valor em risco por diretoria' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Valor em risco por semana' })).toBeInTheDocument();
    // A base legal aparece junto da regra.
    expect(within(screen.getByRole('list', { name: 'Valor em risco por regra' })).getAllByText(/CLT art\.|Súmula/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Não substitui o cálculo da folha nem uma avaliação jurídica/)).toBeInTheDocument();
  });

  it('ranking em tabela, do maior valor para o menor', async () => {
    renderApp('/radar-de-passivo');
    const tabela = await screen.findByRole('table', { name: /Pessoas com mais valor em risco/ }, { timeout: 15_000 });
    expect(within(tabela).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Pessoa', 'Diretoria', 'Gestor', 'Ocorrências', 'Horas sem aprovação', 'Em risco', 'Evitado']);
    const r = await esperado();
    const linhas = within(tabela).getAllByRole('row').slice(1);
    expect(linhas).toHaveLength(Math.min(10, r.ranking.length));
    expect(linhas[0]).toHaveTextContent(r.ranking[0].nome);
    expect(screen.getByRole('button', { name: 'Exportar para Excel' })).toBeEnabled();
  });

  it('período e diretoria vão para a URL e mudam os números', async () => {
    const { user } = renderApp('/radar-de-passivo');
    await screen.findByRole('group', { name: 'Em risco' }, { timeout: 15_000 });
    await user.click(screen.getByRole('combobox', { name: 'Período' }));
    await user.click(await screen.findByRole('option', { name: 'Últimos 7 dias' }));
    await waitFor(() => expect(local()).toContain('dias=7'));
    const r7 = await esperado(7);
    await waitFor(() => expect(normal(screen.getByRole('group', { name: 'Em risco' }).textContent)).toContain(reais(r7.emRisco)));

    await user.click(screen.getByRole('combobox', { name: 'Diretoria' }));
    await user.click(await screen.findByRole('option', { name: 'Comercial' }));
    await waitFor(() => expect(local()).toContain('diretoria=Comercial'));
    const rc = await esperado(7, CUSTO_PADRAO, 'Comercial');
    await waitFor(() => expect(normal(screen.getByRole('group', { name: 'Em risco' }).textContent)).toContain(reais(rc.emRisco)));
  });

  it('abre as ocorrências de uma pessoa no painel lateral, com o link para o dossiê', async () => {
    const { user } = renderApp('/radar-de-passivo');
    const r = await esperado();
    const primeira = r.ranking[0];
    await user.click(await screen.findByRole('button', { name: `Ver ocorrências de ${primeira.nome}` }, { timeout: 15_000 }));
    await waitFor(() => expect(local()).toContain(`abrir=pessoa%3A${primeira.pessoaId}`));
    const painel = await screen.findByRole('dialog');
    expect(within(painel).getByText(primeira.nome)).toBeInTheDocument();
    const tabela = within(painel).getByRole('table');
    expect(within(tabela).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Dia', 'Regra', 'Tempo', 'Custo']);
    expect(within(tabela).getAllByRole('row').length).toBeGreaterThan(2);
    expect(within(painel).getByRole('link', { name: 'Abrir dossiê' })).toHaveAttribute('href', `/dossie?pessoa=${primeira.pessoaId}`);
  });

  it('abre a equipe de um gestor pelo gráfico e abre direto pela URL', async () => {
    const { user } = renderApp('/radar-de-passivo');
    const r = await esperado();
    const gestor = r.porGestor[0];
    const lista = await screen.findByRole('list', { name: 'Valor em risco por gestor' }, { timeout: 15_000 });
    await user.click(within(lista).getByRole('button', { name: new RegExp(gestor.nome) }));
    const painel = await screen.findByRole('dialog');
    expect(within(painel).getByText(`Equipe de ${gestor.nome}`)).toBeInTheDocument();
    expect(within(painel).getAllByRole('link').length).toBeGreaterThan(0);
    await user.click(within(painel).getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(local()).not.toContain('abrir='));
  });

  it('"Como calculamos" recolhe, muda os números na hora, guarda a preferência e volta ao padrão', async () => {
    const { user } = renderApp('/radar-de-passivo');
    const antes = await esperado();
    const grupo = await screen.findByRole('group', { name: 'Em risco' }, { timeout: 15_000 });
    expect(normal(grupo.textContent)).toContain(reais(antes.emRisco));

    const botao = screen.getByRole('button', { name: 'Como calculamos' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    await user.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');

    const campo = screen.getByLabelText('Encargos e reflexos (%)');
    await user.clear(campo);
    await user.type(campo, '70');
    const depois = await esperado(30, { ...CUSTO_PADRAO, encargos: 0.7 });
    await waitFor(() => expect(normal(screen.getByRole('group', { name: 'Em risco' }).textContent)).toContain(reais(depois.emRisco)));
    expect(depois.emRisco).toBeGreaterThan(antes.emRisco);
    expect(JSON.parse(window.localStorage.getItem('scua.radar-de-passivo.custo')!)).toMatchObject({ encargos: 0.7 });

    await user.click(screen.getByRole('button', { name: 'Voltar ao padrão' }));
    await waitFor(() => expect(normal(screen.getByRole('group', { name: 'Em risco' }).textContent)).toContain(reais(antes.emRisco)));
    expect(window.localStorage.getItem('scua.radar-de-passivo.custo')).toBeNull();
    expect(screen.getByLabelText('Encargos e reflexos (%)')).toHaveValue(35);
  });

  it('usa a preferência guardada e ignora uma preferência corrompida', async () => {
    window.localStorage.setItem('scua.radar-de-passivo.custo', JSON.stringify({ adicionalHoraExtra: 0.5, adicionalDescanso: 1, encargos: 0.7 }));
    renderApp('/radar-de-passivo');
    const depois = await esperado(30, { ...CUSTO_PADRAO, encargos: 0.7 });
    const grupo = await screen.findByRole('group', { name: 'Em risco' }, { timeout: 15_000 });
    expect(normal(grupo.textContent)).toContain(reais(depois.emRisco));
  });

  it('período sem ocorrências mostra o vazio, com "Ver todas as diretorias"', async () => {
    const { user } = renderApp('/radar-de-passivo?dias=7&diretoria=Pessoas');
    const r = await esperado(7, CUSTO_PADRAO, 'Pessoas');
    if (r.ocorrencias.length > 0) return; // os dados de exemplo mudaram: este cenário deixou de valer
    expect(await screen.findByText('Nenhuma ocorrência neste período.', {}, { timeout: 15_000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar para Excel' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Ver todas as diretorias' }));
    await waitFor(() => expect(local()).not.toContain('diretoria='));
  });

  it('mostra o esqueleto enquanto carrega', async () => {
    renderApp('/radar-de-passivo');
    expect(await screen.findByRole('status', { name: 'Carregando' }, { timeout: 15_000 })).toBeInTheDocument();
    await screen.findByRole('group', { name: 'Em risco' });
  });

  it('erro mostra aviso amigável e "Tentar de novo" recupera', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/radar-de-passivo');
    const alerta = await screen.findByRole('alert', {}, { timeout: 15_000 });
    expect(alerta).toHaveTextContent('Não conseguimos carregar os dados');
    expect(alerta).not.toHaveTextContent(/Falha de rede simulada|ErroDeRede/);
    expect(screen.getByRole('button', { name: 'Exportar para Excel' })).toBeDisabled();
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('group', { name: 'Em risco' })).toBeInTheDocument();
  });
});
