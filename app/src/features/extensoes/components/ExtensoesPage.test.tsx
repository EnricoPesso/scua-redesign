import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../../test/render';
import { server } from '../../../test/server';
import { entrarComo } from '../api/mocks/db';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Página de extensões', () => {
  it('gestor cai em "Para aprovar" com a contagem de pendentes', async () => {
    renderApp('/extensoes');
    const aba = await screen.findByRole('tab', { name: 'Para aprovar (5)' });
    expect(aba).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tablist', { name: 'Abas de extensões' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Extensões de jornada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+ Nova extensão' })).toHaveAttribute('href', '/extensoes/meus/novo');
    expect(screen.queryByRole('tab', { name: 'Todos' })).not.toBeInTheDocument();
  });

  it('as abas são links reais, uma rota por aba', async () => {
    renderApp('/extensoes');
    expect(await screen.findByRole('tab', { name: 'Meus pedidos' })).toHaveAttribute('href', '/extensoes/meus');
  });

  it('setas do teclado trocam de aba', async () => {
    const { user } = renderApp('/extensoes');
    const primeira = await screen.findByRole('tab', { name: /Para aprovar/ });
    primeira.focus();
    await user.keyboard('{ArrowRight}');
    const meus = await screen.findByRole('tab', { name: 'Meus pedidos' });
    expect(meus).toHaveAttribute('aria-selected', 'true');
    expect(meus).toHaveFocus();
  });

  it('colaborador cai em "Meus pedidos" e não vê "Para aprovar"', async () => {
    entrarComo('ana');
    renderApp('/extensoes');
    expect(await screen.findByRole('tab', { name: 'Meus pedidos' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: /Para aprovar/ })).not.toBeInTheDocument();
  });

  it('RH cai em "Todos" e não tem "Nova extensão"', async () => {
    entrarComo('renata');
    renderApp('/extensoes');
    expect(await screen.findByRole('tab', { name: 'Todos' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('link', { name: '+ Nova extensão' })).not.toBeInTheDocument();
  });

  it('aba não permitida volta para a aba inicial', async () => {
    entrarComo('ana');
    renderApp('/extensoes/todos');
    expect(await screen.findByRole('tab', { name: 'Meus pedidos' })).toHaveAttribute('aria-selected', 'true');
  });

  it('quem não tem nenhuma aba vê um aviso', async () => {
    server.use(http.get('*/api/me/permissoes', () => HttpResponse.json({
      usuario: { id: 'u-x', nome: 'X' }, podePedir: false, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: false,
    })));
    renderApp('/extensoes');
    expect(await screen.findByText('Você não tem acesso às extensões de jornada.')).toBeInTheDocument();
  });

  it('falha ao carregar permissões mostra mensagem amigável e tenta de novo', async () => {
    server.use(http.get('*/api/me/permissoes', () => HttpResponse.json({ codigo: 'X' }, { status: 500 }), { once: true }));
    const { user } = renderApp('/extensoes');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos carregar os dados');
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('tab', { name: /Para aprovar/ })).toBeInTheDocument();
  });
});
