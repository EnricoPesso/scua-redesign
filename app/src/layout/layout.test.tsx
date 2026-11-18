import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { entrarComo } from '../features/extensoes/api/mocks/db';
import type { Permissoes } from '../features/extensoes/domain/types';
import { renderApp } from '../test/render';
import { buscarTelas, menuPara, papelDe, telaInicial, telasPara } from './menu';

const base: Permissoes = {
  usuario: { id: 'u', nome: 'U' },
  podePedir: true, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: false,
  podeVerRelatorios: false, podeGerirPessoas: false, podeAdministrar: false,
};
const gestor: Permissoes = { ...base, podeAprovar: true, podeVerRelatorios: true };
const admin: Permissoes = { ...gestor, podeGerirPessoas: true, podeAdministrar: true };

const rotulos = (p: Permissoes) => menuPara(p).flatMap((g) => g.itens.map((i) => i.rotulo));

describe('menu por perfil', () => {
  it('colaborador só vê Extensões de jornada, que é a tela inicial', () => {
    expect(rotulos(base)).toEqual(['Extensões de jornada']);
    expect(telaInicial(base)).toBe('/extensoes');
    expect(papelDe(base)).toBe('Colaboração');
  });

  it('gestão vê o dia a dia e os relatórios, sem cadastros nem administração', () => {
    expect(rotulos(gestor)).toEqual(['Início', 'Extensões de jornada', 'Ausências', 'Relatórios']);
    expect(telaInicial(gestor)).toBe('/inicio');
  });

  it('administração vê os 12 itens em 4 grupos', () => {
    expect(menuPara(admin).map((g) => g.titulo)).toEqual(['Dia a dia', 'Pessoas e jornadas', 'Análise', 'Administração']);
    expect(rotulos(admin)).toHaveLength(12);
  });

  it('quem não pode nada não tem tela inicial', () => {
    expect(telaInicial({ ...base, podePedir: false })).toBeNull();
  });

  it('a busca acha relatórios e configurações pelo nome, sem acento, e respeita o perfil', () => {
    const telas = telasPara(admin);
    expect(buscarTelas(telas, 'tempo de bloq')[0]).toMatchObject({ titulo: 'Tempo de bloqueio', para: '/relatorios/tempo-de-bloqueio' });
    expect(buscarTelas(telas, 'FERIADOS')[0].para).toBe('/configuracoes/feriados');
    expect(buscarTelas(telas, 'usuarios')[0].para).toBe('/usuarios');
    // "IP" aparece no título de duas telas e no resumo de outras: título vem primeiro.
    expect(buscarTelas(telas, 'ip').slice(0, 2).map((t) => t.titulo).sort()).toEqual(['Localidades por IP', 'Último IP por usuário']);
    expect(buscarTelas(telasPara(gestor), 'feriados')).toEqual([]);
    expect(buscarTelas(telas, 'xyzxyz')).toEqual([]);
  });
});

describe('casca do app', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.localStorage.clear();
  });

  const menu = () => screen.findAllByRole('navigation', { name: 'Menu principal' });

  it('cada item do menu é um link com endereço próprio, e o atual fica marcado', async () => {
    entrarComo('carlos');
    renderApp('/extensoes/aprovar');
    const [lateral] = await menu();
    const item = await within(lateral).findByRole('link', { name: 'Extensões de jornada' });
    expect(item).toHaveAttribute('href', '/extensoes');
    expect(item).toHaveAttribute('aria-current', 'page');
    expect(within(lateral).getByRole('link', { name: 'Usuários' })).toHaveAttribute('href', '/usuarios');
    expect(within(lateral).getByRole('link', { name: 'Relatórios' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Carlos Mendes')).toBeInTheDocument();
    expect(screen.getByText('Administração', { selector: 'span' })).toBeInTheDocument();
  });

  it('colaborador vê só o que pode usar', async () => {
    entrarComo('ana');
    renderApp('/extensoes');
    const [lateral] = await menu();
    await within(lateral).findByRole('link', { name: 'Extensões de jornada' });
    expect(within(lateral).getAllByRole('link')).toHaveLength(1);
  });

  it('"/" leva à primeira tela do perfil', async () => {
    entrarComo('ana');
    renderApp('/');
    await waitFor(() => expect(screen.getByTestId('local-atual').textContent).toMatch(/^\/extensoes/));
  });

  it('recolher o menu deixa só os ícones, mantém o nome para leitores de tela e lembra a escolha', async () => {
    entrarComo('carlos');
    const { user } = renderApp('/extensoes');
    const botao = await screen.findByRole('button', { name: 'Recolher menu' });
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    await user.click(botao);
    expect(screen.getByRole('button', { name: 'Expandir menu' })).toHaveAttribute('aria-expanded', 'false');
    const [lateral] = await menu();
    expect(within(lateral).getByRole('link', { name: 'Usuários' })).toBeInTheDocument();
    expect(window.localStorage.getItem('scua.menu.recolhido')).toBe('1');
  });

  it('busca de telas: digitar acha um relatório e Enter abre', async () => {
    entrarComo('carlos');
    const { user } = renderApp('/extensoes');
    await user.click(await screen.findByRole('button', { name: /Buscar tela/ }));
    const dialogo = await screen.findByRole('dialog', { name: 'Buscar tela' });
    await user.type(within(dialogo).getByRole('searchbox', { name: 'Nome da tela' }), 'ranking');
    expect(within(dialogo).getByRole('link', { name: /Ranking de exceções/ })).toHaveAttribute('href', '/relatorios/ranking-de-excecoes');
    expect(within(dialogo).getByRole('status')).toHaveTextContent('1 tela. Enter abre a primeira.');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByTestId('local-atual')).toHaveTextContent('/relatorios/ranking-de-excecoes'));
    expect(screen.queryByRole('dialog', { name: 'Buscar tela' })).not.toBeInTheDocument();
  });

  it('endereço que não existe mostra a página de "não encontrada" com o menu', async () => {
    entrarComo('carlos');
    renderApp('/nao-existe');
    expect(await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toHaveAttribute('href', '/');
    expect((await menu()).length).toBeGreaterThan(0);
  });

  it('tela fora do perfil mostra "Sem acesso"', async () => {
    entrarComo('olga');
    renderApp('/configuracoes');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sem acesso' })).toBeInTheDocument();
  });

  it('tem o atalho "Pular para o conteúdo"', async () => {
    entrarComo('carlos');
    renderApp('/extensoes');
    expect(await screen.findByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo');
  });
});
