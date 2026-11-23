import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../../mock/rede';
import { renderApp } from '../../../test/render';

const local = () => screen.getByTestId('local-atual').textContent;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  vi.restoreAllMocks();
});

describe('Previsão de jornada', () => {
  it('mostra os indicadores, o aviso de estimativa e a lista ordenada pelo risco', async () => {
    renderApp('/previsao');
    expect(await screen.findByRole('heading', { level: 1, name: 'Previsão de jornada' }, { timeout: 15_000 })).toBeInTheDocument();
    const resumo = screen.getByRole('region', { name: 'Resumo da semana' });
    for (const nome of ['Pessoas em risco alto', 'Regras em risco', 'Horas extras previstas', 'Custo previsto (R$)']) {
      expect(within(resumo).getByRole('group', { name: nome })).toBeInTheDocument();
    }
    expect(screen.getByText('Projeção feita a partir dos últimos dias registrados. É uma estimativa.')).toBeInTheDocument();
    const lista = await screen.findByRole('list', { name: 'Pessoas com risco previsto' });
    const itens = within(lista).getAllByRole('listitem').filter((li) => li.parentElement === lista);
    expect(itens.length).toBeGreaterThan(0);
    // O primeiro da lista é o mais arriscado: risco alto.
    expect(itens[0]).toHaveTextContent('Risco alto');
    // Cada pessoa tem uma faixa de 7 dias, com texto e não só cor.
    const faixa = within(itens[0]).getByRole('list', { name: /^Próximos 7 dias de / });
    expect(within(faixa).getAllByRole('listitem')).toHaveLength(7);
    expect(faixa).toHaveTextContent(/risco (alto|médio|baixo)|sem risco/);
  });

  it('abrir uma pessoa mostra o painel com riscos, motivo e ações, e o estado fica na URL', async () => {
    const { user } = renderApp('/previsao');
    const lista = await screen.findByRole('list', { name: 'Pessoas com risco previsto' });
    const botao = within(lista).getAllByRole('button', { name: /^Ver a previsão de / })[0];
    await user.click(botao);
    await waitFor(() => expect(local()).toMatch(/pessoa=u-/));
    const painel = await screen.findByRole('dialog');
    expect(within(painel).getByRole('heading', { name: 'Riscos por dia' })).toBeInTheDocument();
    expect(within(painel).getByRole('table')).toBeInTheDocument();
    for (const [nome, destino] of [['Ver o cadastro da pessoa', '/usuarios'], ['Abrir o dossiê', '/dossie?pessoa=']] as const) {
      expect(within(painel).getByRole('link', { name: nome }).getAttribute('href')).toContain(destino);
    }
    await user.click(within(painel).getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(local()).not.toContain('pessoa='));
  });

  it('abre direto na pessoa que está na URL', async () => {
    renderApp('/previsao?pessoa=u-ana');
    const painel = await screen.findByRole('dialog');
    expect(within(painel).getByText('Ana Souza')).toBeInTheDocument();
  });

  it('o filtro de nível vai para a URL e reduz a lista', async () => {
    const { user } = renderApp('/previsao');
    const lista = await screen.findByRole('list', { name: 'Pessoas com risco previsto' });
    const antes = within(lista).getAllByRole('button', { name: /^Ver a previsão de / }).length;
    await user.click(screen.getByRole('combobox', { name: 'Nível de risco' }));
    await user.click(await screen.findByRole('option', { name: 'Baixo' }));
    await waitFor(() => expect(local()).toContain('nivel=baixo'));
    await waitFor(() => {
      const itens = screen.queryAllByRole('button', { name: /^Ver a previsão de / });
      expect(itens.length).toBeLessThan(antes);
    });
  });

  it('filtro sem resultado mostra o vazio e "Limpar filtros" desfaz', async () => {
    // A equipe da Renata é toda da diretoria Pessoas: pedir outra diretoria nunca tem resultado, quaisquer que sejam os dados de exemplo.
    const { user } = renderApp('/previsao?gestor=u-renata&diretoria=Comercial');
    expect(await screen.findByText('Ninguém com esse filtro tem risco previsto.')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]);
    expect(await screen.findByRole('list', { name: 'Pessoas com risco previsto' })).toBeInTheDocument();
    expect(local()).not.toContain('gestor=');
  });

  it('mostra o esqueleto enquanto carrega', async () => {
    renderApp('/previsao');
    expect(await screen.findByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    await screen.findByRole('list', { name: 'Pessoas com risco previsto' });
  });

  it('erro mostra aviso amigável e "Tentar de novo" recupera', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/previsao');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não conseguimos carregar os dados');
    expect(alerta).not.toHaveTextContent(/Falha de rede simulada|ErroDeRede/);
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('list', { name: 'Pessoas com risco previsto' })).toBeInTheDocument();
  });
});
