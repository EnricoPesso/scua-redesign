import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../../mock/rede';
import { renderApp } from '../../../test/render';
import { entrarComo } from '../../extensoes/api/mocks/db';
import { O_QUE_NAO_REGISTRA, O_QUE_REGISTRA } from '../conteudo';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  vi.restoreAllMocks();
});

describe('Meus dados', () => {
  it('mostra as duas listas, a jornada, quem vê e os direitos do usuário logado', async () => {
    renderApp('/meus-dados');
    expect(await screen.findByRole('heading', { level: 1, name: 'Meus dados' }, { timeout: 15_000 })).toBeInTheDocument();
    const registra = await screen.findByRole('region', { name: 'O Scua registra' });
    expect(within(registra).getAllByRole('listitem')).toHaveLength(O_QUE_REGISTRA.length);
    const naoRegistra = screen.getByRole('region', { name: 'O Scua não registra' });
    expect(within(naoRegistra).getAllByRole('listitem')).toHaveLength(O_QUE_NAO_REGISTRA.length);
    expect(within(naoRegistra).getByText(/Imagem da tela/)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Minha jornada' })).toBeInTheDocument();
    expect(screen.getByText('Segunda a sexta, das 08:00 às 17:00, com 1h de intervalo')).toBeInTheDocument();
    const tabela = screen.getByRole('table', { name: /Seus últimos 14 dias/ });
    // 14 linhas de dados + cabeçalho.
    expect(within(tabela).getAllByRole('row')).toHaveLength(15);
    expect(within(tabela).getByRole('rowheader', { name: 'dom 11/10' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Últimos 7 dias' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Neste mês' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Quem vê meus dados' })).toBeInTheDocument();
    expect(screen.getByText('Pelo prazo definido pela sua empresa', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Meus direitos' })).toBeInTheDocument();
    expect(screen.getByText('Fale com o encarregado de dados da sua empresa.')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('o colaborador vê só os próprios dados, o nome do gestor e o link para pedir extensão', async () => {
    entrarComo('ana');
    renderApp('/meus-dados');
    const link = await screen.findByRole('link', { name: 'Pedir extensão de jornada' });
    expect(link).toHaveAttribute('href', '/extensoes/meus/novo');
    expect(await screen.findByText('Seu gestor, Carlos Mendes.')).toBeInTheDocument();
    expect(screen.getByText(/Estação principal:/).parentElement).toHaveTextContent('SCUA-NB-021');
    expect(screen.getByRole('button', { name: /Baixar meus dados/ })).toBeEnabled();
  });

  it('o gestor de topo (Carlos) vê os próprios dados e não tem gestor acima', async () => {
    renderApp('/meus-dados');
    expect(await screen.findByText(/Você não tem gestor acima de você/)).toBeInTheDocument();
    expect(screen.getByText(/Estação principal:/).parentElement).toHaveTextContent('SCUA-NB-014');
  });

  it('mostra o esqueleto enquanto carrega', async () => {
    renderApp('/meus-dados');
    expect(await screen.findByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Baixar meus dados/ })).toBeDisabled();
    await screen.findByRole('table');
  });

  it('erro ao carregar mostra aviso amigável e "Tentar de novo" recupera', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/meus-dados');
    const alerta = await screen.findByRole('alert');
    expect(alerta).not.toHaveTextContent(/Falha de rede simulada|ErroDeRede/);
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
