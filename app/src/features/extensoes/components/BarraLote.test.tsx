import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../../test/render';
import { server } from '../../../test/server';
import { decidirExterno, entrarComo } from '../api/mocks/db';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

async function abrirFila() {
  entrarComo('carlos');
  const app = renderApp('/extensoes/aprovar');
  await screen.findByRole('link', { name: 'Ana Souza' });
  return app;
}

function contarLotes() {
  const chamadas: string[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/extensoes/decisao-em-lote') chamadas.push(request.url);
  });
  return chamadas;
}

async function selecionar(user: ReturnType<typeof renderApp>['user'], ...nomes: string[]) {
  for (const nome of nomes) await user.click(screen.getByRole('checkbox', { name: `Selecionar ${nome}` }));
}

describe('Lote: seleção', () => {
  it('mostra a barra com quantidade e total de horas; a caixa do cabeçalho marca a página toda', async () => {
    const { user } = await abrirFila();
    expect(screen.queryByRole('region', { name: 'Ações em lote' })).not.toBeInTheDocument();
    await selecionar(user, 'Ana Souza', 'João Lima');
    const barra = screen.getByRole('region', { name: 'Ações em lote' });
    expect(barra).toHaveTextContent('2 selecionados · 8h no total');
    await user.click(screen.getByRole('checkbox', { name: 'Selecionar todos desta página' }));
    expect(barra).toHaveTextContent('5 selecionados · 14h no total');
    await user.click(screen.getByRole('checkbox', { name: 'Selecionar todos desta página' }));
    expect(screen.queryByRole('region', { name: 'Ações em lote' })).not.toBeInTheDocument();
  });

  it('não aparece em Meus pedidos', async () => {
    entrarComo('ana');
    renderApp('/extensoes/meus?de=');
    await screen.findAllByRole('link', { name: 'Ana Souza' });
    expect(screen.queryByRole('checkbox', { name: /Selecionar/ })).not.toBeInTheDocument();
  });
});

describe('Lote: aprovar', () => {
  it('confirma com nomes, horas e total, e aprova todos', async () => {
    const { user } = await abrirFila();
    await selecionar(user, 'Ana Souza', 'João Lima');
    await user.click(within(screen.getByRole('region', { name: 'Ações em lote' })).getByRole('button', { name: 'Aprovar' }));
    const dialogo = within(await screen.findByRole('dialog', { name: 'Aprovar 2 pedidos?' }));
    expect(dialogo.getByText('Ana Souza — 6h (13–15/10 · 18:00–20:00)')).toBeInTheDocument();
    expect(dialogo.getByText('João Lima — 2h (13–14/10 · 18:00–19:00)')).toBeInTheDocument();
    expect(dialogo.getByText('Total: 8h')).toBeInTheDocument();
    await user.click(dialogo.getByRole('button', { name: 'Aprovar 2' }));
    expect(await screen.findByText('2 pedidos aprovados. As pessoas vão receber o aviso.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Ana Souza' })).not.toBeInTheDocument());
    expect(screen.queryByRole('region', { name: 'Ações em lote' })).not.toBeInTheDocument();
  });

  it('duplo clique em "Aprovar 2" gera um envio só', async () => {
    const chamadas = contarLotes();
    const { user } = await abrirFila();
    await selecionar(user, 'Ana Souza', 'João Lima');
    await user.click(within(screen.getByRole('region', { name: 'Ações em lote' })).getByRole('button', { name: 'Aprovar' }));
    const dialogo = within(await screen.findByRole('dialog', { name: 'Aprovar 2 pedidos?' }));
    await user.dblClick(dialogo.getByRole('button', { name: 'Aprovar 2' }));
    await screen.findByText('2 pedidos aprovados. As pessoas vão receber o aviso.');
    expect(chamadas).toHaveLength(1);
  });

  it('resultado parcial: mostra quantos deram certo e o nome e o motivo de cada falha', async () => {
    const { user } = await abrirFila();
    decidirExterno('p-2', 'aprovado', 'whatsapp');
    await selecionar(user, 'Ana Souza', 'João Lima');
    await user.click(within(screen.getByRole('region', { name: 'Ações em lote' })).getByRole('button', { name: 'Aprovar' }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Aprovar 2 pedidos?' })).getByRole('button', { name: 'Aprovar 2' }));
    const resultado = within(await screen.findByRole('dialog', { name: 'Resultado da aprovação' }));
    expect(resultado.getByText('✓ 1 pedido aprovado')).toBeInTheDocument();
    expect(resultado.getByText('✕ 1 não foi aprovado')).toBeInTheDocument();
    expect(resultado.getByText(/^João Lima — já tinha sido aprovado por Carlos Mendes via WhatsApp às \d\d:\d\d$/)).toBeInTheDocument();
    await user.click(resultado.getByRole('button', { name: 'Ok' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Resultado da aprovação' })).not.toBeInTheDocument());
  });

  it('falha de rede: aviso dentro da confirmação, que continua aberta', async () => {
    server.use(http.post('*/api/extensoes/decisao-em-lote', () => HttpResponse.json({ codigo: 'ERRO' }, { status: 500 })));
    const { user } = await abrirFila();
    await selecionar(user, 'Ana Souza');
    await user.click(within(screen.getByRole('region', { name: 'Ações em lote' })).getByRole('button', { name: 'Aprovar' }));
    const dialogo = within(await screen.findByRole('dialog', { name: 'Aprovar 1 pedido?' }));
    await user.click(dialogo.getByRole('button', { name: 'Aprovar 1' }));
    expect(await dialogo.findByRole('alert')).toHaveTextContent('Não conseguimos registrar a decisão. Tente de novo.');
    expect(screen.getByRole('dialog', { name: 'Aprovar 1 pedido?' })).toBeInTheDocument();
  });
});

describe('Lote: reprovar', () => {
  it('um motivo para todos, obrigatório', async () => {
    const { user } = await abrirFila();
    await selecionar(user, 'Ana Souza', 'João Lima');
    await user.click(within(screen.getByRole('region', { name: 'Ações em lote' })).getByRole('button', { name: 'Reprovar' }));
    const dialogo = within(await screen.findByRole('dialog', { name: 'Reprovar 2 pedidos?' }));
    await user.click(dialogo.getByRole('button', { name: 'Reprovar 2' }));
    expect(dialogo.getByText('Escolha um motivo')).toBeInTheDocument();
    await user.click(dialogo.getByRole('radio', { name: 'Período errado' }));
    await user.click(dialogo.getByRole('button', { name: 'Reprovar 2' }));
    expect(await screen.findByText('2 pedidos reprovados. As pessoas vão receber o aviso.')).toBeInTheDocument();
  });
});
