import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { definirFalhaDeRede } from '../../mock/rede';
import { RELATORIOS, TEMAS } from './catalogo';

afterEach(() => definirFalhaDeRede(false));

describe('Página de entrada dos relatórios', () => {
  it('mostra os 4 temas, cada um com a pergunta e os relatórios como links', async () => {
    renderApp('/relatorios');
    expect(await screen.findByRole('heading', { level: 1, name: 'Relatórios' })).toBeInTheDocument();
    for (const t of TEMAS) {
      const secao = screen.getByRole('region', { name: t.titulo });
      expect(within(secao).getByText(t.pergunta)).toBeInTheDocument();
    }
    const links = screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('/relatorios/'));
    expect(links).toHaveLength(RELATORIOS.length);
    expect(screen.getByRole('link', { name: /Tempo de bloqueio/ })).toHaveAttribute('href', '/relatorios/tempo-de-bloqueio');
  });

  it('a busca ignora acento e maiúsculas e some com os temas sem resultado', async () => {
    const { user } = renderApp('/relatorios');
    await user.type(await screen.findByRole('searchbox', { name: 'Buscar relatório' }), 'LIBERACOES');
    expect(screen.getByRole('link', { name: /Liberações por área/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Logon e logoff/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Acesso' })).not.toBeInTheDocument();
    expect(screen.getByTestId('local-atual')).toHaveTextContent('/relatorios?q=LIBERACOES');
  });

  it('sem resultado mostra o estado vazio e "Limpar busca" volta a lista', async () => {
    const { user } = renderApp('/relatorios');
    await user.type(await screen.findByRole('searchbox', { name: 'Buscar relatório' }), 'xyzxyz');
    expect(screen.getByText('Nenhum relatório encontrado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(screen.getByRole('searchbox', { name: 'Buscar relatório' })).toHaveValue('');
    expect(screen.getByRole('link', { name: /Logon e logoff/ })).toBeInTheDocument();
  });

  it('a busca vem da URL (link compartilhável)', async () => {
    renderApp('/relatorios?q=estacoes');
    expect(await screen.findByRole('searchbox', { name: 'Buscar relatório' })).toHaveValue('estacoes');
    expect(screen.getByRole('link', { name: /Estações/ })).toBeInTheDocument();
  });

  it('clicar num relatório abre o relatório sem recarregar', async () => {
    const { user } = renderApp('/relatorios');
    await user.click(await screen.findByRole('link', { name: /Tempo de bloqueio/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Tempo de bloqueio' })).toBeInTheDocument();
    expect(screen.getByTestId('local-atual')).toHaveTextContent('/relatorios/tempo-de-bloqueio');
  });
});

describe('Relatório aberto por rota (Tempo de bloqueio)', () => {
  it('mostra título, trilha com link, KPIs e linhas', async () => {
    renderApp('/relatorios/tempo-de-bloqueio');
    expect(await screen.findByText(/Mostrando 1 a 10 de/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tempo de bloqueio' })).toBeInTheDocument();
    expect(document.title).toBe('Tempo de bloqueio · Scua Logon');
    const trilha = screen.getByRole('navigation', { name: 'Trilha' });
    expect(within(trilha).getByRole('link', { name: 'Relatórios' })).toHaveAttribute('href', '/relatorios');
    expect(within(trilha).getByText('Bloqueios e liberações')).toBeInTheDocument();
    expect(screen.getByText('Tempo médio bloqueado')).toBeInTheDocument();
    expect(screen.getByText('Maior tempo bloqueado')).toBeInTheDocument();
    expect(screen.getAllByText(/^\d+h(\d{2})?$|^\d+min$/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/EVT_/)).not.toBeInTheDocument();
  });

  it('filtrar por um período menor reduz as linhas', async () => {
    const { user } = renderApp('/relatorios/tempo-de-bloqueio');
    const total = async () => (await screen.findByText(/Mostrando \d+ a \d+ de \d+/)).textContent!;
    const antes = await total();
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-10-12' } });
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));
    await screen.findByText(/Mostrando/);
    const depois = await total();
    expect(depois).not.toBe(antes);
  });

  it('sem resultado mostra a frase do relatório e "Limpar filtros" restaura', async () => {
    const { user } = renderApp('/relatorios/tempo-de-bloqueio');
    await screen.findByText(/Mostrando 1 a 10 de/);
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2020-01-31' } });
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2020-01-01' } });
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));
    expect(await screen.findByText(/Nenhum bloqueio com liberação nesse período\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(await screen.findByText(/Mostrando 1 a 10 de/)).toBeInTheDocument();
  });

  it('com falha de rede mostra o erro e "Tentar de novo" recupera', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/relatorios/tempo-de-bloqueio');
    expect(await screen.findByText('Não foi possível carregar o relatório')).toBeInTheDocument();
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText(/Mostrando 1 a 10 de/)).toBeInTheDocument();
  });

  it('relatório desconhecido cai em "Página não encontrada"', async () => {
    renderApp('/relatorios/nao-existe');
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });
});
