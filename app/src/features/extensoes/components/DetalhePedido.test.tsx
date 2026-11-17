import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../../test/render';
import { server } from '../../../test/server';
import { decidirExterno, entrarComo, type ChavePessoa } from '../api/mocks/db';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const local = () => screen.getByTestId('local-atual').textContent;
const detalhe = (nome: string) => screen.findByRole('dialog', { name: `Pedido de ${nome}` });

async function abrir(rota: string, quem: ChavePessoa = 'carlos') {
  entrarComo(quem);
  const app = renderApp(rota);
  await waitFor(() => expect(screen.queryByRole('status', { name: 'Carregando pedido' })).not.toBeInTheDocument());
  return app;
}

/** Conta os POST de decisão individual. */
function contarDecisoes() {
  const chamadas: string[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST' && /\/api\/extensoes\/[^/]+\/decisao$/.test(new URL(request.url).pathname)) chamadas.push(request.url);
  });
  return chamadas;
}

describe('Detalhe do pedido: conteúdo', () => {
  it('mostra status, período, horas, justificativa, uso do mês, quem pediu e o histórico', async () => {
    await abrir('/extensoes/aprovar/p-1');
    const painel = await detalhe('Ana Souza');
    const p = within(painel);
    expect(p.getByText('Pendente')).toBeInTheDocument();
    expect(p.getByText('pedido há 1 hora')).toBeInTheDocument();
    expect(p.getByText('13–15/10 · 18:00–20:00')).toBeInTheDocument();
    expect(p.getByText('3 dias × 2h = 6h')).toBeInTheDocument();
    expect(p.getByText('Janela de deploy')).toBeInTheDocument();
    expect(p.getByText('“Atualização do ERP”')).toBeInTheDocument();
    // Ana tem 6h aprovadas em outubro (p-5) e limite de 10h: com este pedido, 12h.
    expect(await p.findByRole('meter', { name: 'Limite do grupo' })).toHaveAttribute('aria-valuetext', expect.stringContaining('12h de 10h'));
    expect(p.getByRole('heading', { name: 'Ana neste mês' })).toBeInTheDocument();
    expect(p.getByText('Ana Souza (a própria pessoa)')).toBeInTheDocument();
    const historico = p.getByRole('list', { name: 'Histórico' });
    const itens = within(historico).getAllByRole('listitem').map((li) => li.textContent);
    expect(itens[0]).toContain('Você recebeu o aviso');
    expect(itens[1]).toContain('Pedido criado por Ana Souza');
  });

  it('lista outros pedidos pendentes da mesma pessoa', async () => {
    await abrir('/extensoes/aprovar/p-3');
    const p = within(await detalhe('Bia Rocha'));
    const outros = await p.findByRole('list', { name: 'Outros pedidos pendentes' });
    expect(within(outros).getByRole('link', { name: /29\/09/ })).toHaveAttribute('href', expect.stringContaining('/extensoes/aprovar/p-8'));
  });
});

describe('Detalhe do pedido: aprovar', () => {
  it('aprova em um clique, avisa e abre o próximo da fila', async () => {
    const { user } = await abrir('/extensoes/aprovar/p-1');
    const p = within(await detalhe('Ana Souza'));
    await user.type(p.getByLabelText('Comentário (opcional)'), 'Ok, bom deploy');
    await user.click(p.getByRole('button', { name: 'Aprovar' }));
    expect(await screen.findByText('Pedido aprovado. Ana Souza vai receber o aviso.')).toBeInTheDocument();
    expect(await detalhe('Bia Rocha')).toBeInTheDocument();
    expect(local()).toBe('/extensoes/aprovar/p-3');
  });

  it('duplo clique em "Aprovar" gera uma requisição só', async () => {
    const chamadas = contarDecisoes();
    const { user } = await abrir('/extensoes/aprovar/p-1');
    const p = within(await detalhe('Ana Souza'));
    await user.dblClick(p.getByRole('button', { name: 'Aprovar' }));
    await screen.findByText('Pedido aprovado. Ana Souza vai receber o aviso.');
    await detalhe('Bia Rocha');
    // O segundo clique não pode aprovar o pedido seguinte da fila (Bia), que a pessoa nem viu.
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0]).toContain('/p-1/');
  });

  it('logo depois de avançar na fila, um clique em "Aprovar" no pedido seguinte é ignorado', async () => {
    const chamadas = contarDecisoes();
    const { user } = await abrir('/extensoes/aprovar/p-1');
    await user.click(within(await detalhe('Ana Souza')).getByRole('button', { name: 'Aprovar' }));
    const bia = within(await detalhe('Bia Rocha'));
    await user.click(bia.getByRole('button', { name: 'Aprovar' }));
    expect(chamadas).toHaveLength(1);
    // Passada a pausa, o clique volta a valer.
    await new Promise((r) => setTimeout(r, 650));
    await user.click(bia.getByRole('button', { name: 'Aprovar' }));
    await screen.findByText('Pedido aprovado. Bia Rocha vai receber o aviso.');
    expect(chamadas).toHaveLength(2);
  });

  it('com a fila acabando, fecha o painel', async () => {
    const { user } = await abrir('/extensoes/aprovar/p-4');
    for (const id of ['p-1', 'p-2', 'p-3', 'p-8']) decidirExterno(id, 'aprovado');
    const p = within(await detalhe('Rui Alves'));
    await user.click(p.getByRole('button', { name: 'Aprovar' }));
    await screen.findByText('Pedido aprovado. Rui Alves vai receber o aviso.');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Pedido de/ })).not.toBeInTheDocument());
    expect(local()).toBe('/extensoes/aprovar');
  });

  it('falha ao aprovar: aviso no painel com "Tentar de novo", e o pedido continua aberto', async () => {
    server.use(http.post('*/api/extensoes/:id/decisao', () => HttpResponse.json({ codigo: 'ERRO' }, { status: 500 })));
    const { user } = await abrir('/extensoes/aprovar/p-1');
    const p = within(await detalhe('Ana Souza'));
    await user.click(p.getByRole('button', { name: 'Aprovar' }));
    expect(await p.findByRole('alert')).toHaveTextContent('Não conseguimos registrar a decisão. Tente de novo.');
    expect(p.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    expect(local()).toBe('/extensoes/aprovar/p-1');
  });
});

describe('Detalhe do pedido: reprovar', () => {
  it('exige motivo, exige mensagem com "Outro" e depois reprova', async () => {
    const { user } = await abrir('/extensoes/aprovar/p-1');
    const p = within(await detalhe('Ana Souza'));
    await user.click(p.getByRole('button', { name: 'Reprovar' }));
    const passo = within(await screen.findByRole('dialog', { name: 'Reprovar pedido de Ana Souza' }));
    await user.click(passo.getByRole('button', { name: 'Confirmar reprovação' }));
    expect(passo.getByText('Escolha um motivo')).toBeInTheDocument();
    await user.click(passo.getByRole('radio', { name: 'Outro' }));
    await user.click(passo.getByRole('button', { name: 'Confirmar reprovação' }));
    expect(passo.getByText('Escreva uma mensagem explicando o motivo')).toBeInTheDocument();
    expect(passo.getByLabelText('Mensagem para Ana (obrigatório)')).toHaveFocus();
    await user.type(passo.getByLabelText('Mensagem para Ana (obrigatório)'), 'Sem orçamento este mês');
    await user.click(passo.getByRole('button', { name: 'Confirmar reprovação' }));
    expect(await screen.findByText('Pedido reprovado. Ana Souza vai receber o aviso.')).toBeInTheDocument();
    expect(await detalhe('Bia Rocha')).toBeInTheDocument();
    expect(local()).toBe('/extensoes/aprovar/p-3');
  });

  it('"Voltar" sai do passo de motivo sem reprovar', async () => {
    const { user } = await abrir('/extensoes/aprovar/p-1');
    const p = within(await detalhe('Ana Souza'));
    await user.click(p.getByRole('button', { name: 'Reprovar' }));
    const passo = within(await screen.findByRole('dialog', { name: 'Reprovar pedido de Ana Souza' }));
    await user.click(passo.getByRole('button', { name: 'Voltar' }));
    expect(await detalhe('Ana Souza')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument();
  });
});

describe('Detalhe do pedido: conflito e acesso', () => {
  it('critério 7: pedido decidido em outro canal mostra quem decidiu e os botões desativados', async () => {
    decidirExterno('p-1', 'aprovado', 'whatsapp');
    await abrir('/extensoes/aprovar/p-1');
    const p = within(await detalhe('Ana Souza'));
    expect(p.getByText(/^Este pedido já foi aprovado por Carlos Mendes via WhatsApp às \d\d:\d\d\.$/)).toBeInTheDocument();
    expect(p.getByRole('button', { name: 'Aprovar' })).toBeDisabled();
    expect(p.getByRole('button', { name: 'Reprovar' })).toBeDisabled();
  });

  it('conflito ao decidir (409) mostra o mesmo aviso', async () => {
    const { user } = await abrir('/extensoes/aprovar/p-1');
    const p = within(await detalhe('Ana Souza'));
    decidirExterno('p-1', 'reprovado', 'teams');
    await user.click(p.getByRole('button', { name: 'Aprovar' }));
    expect(await p.findByText(/^Este pedido já foi reprovado por Carlos Mendes via Teams às \d\d:\d\d\.$/)).toBeInTheDocument();
    expect(p.getByRole('button', { name: 'Aprovar' })).toBeDisabled();
  });

  it('sem permissão: mensagem e link de volta', async () => {
    await abrir('/extensoes/aprovar/p-1', 'olga');
    expect(await screen.findByText('Você não tem acesso a este pedido.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para minhas extensões' })).toHaveAttribute('href', '/extensoes/meus');
  });

  it('não encontrado: mensagem e "Voltar"', async () => {
    await abrir('/extensoes/aprovar/p-999');
    expect(await screen.findByText('Este pedido não existe ou foi removido.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });
});

describe('Detalhe do pedido: meus pedidos', () => {
  it('é só leitura, com Editar e Cancelar quando pendente', async () => {
    const { user } = await abrir('/extensoes/meus/p-1', 'ana');
    const p = within(await detalhe('Ana Souza'));
    expect(p.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();
    expect(p.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/extensoes/meus/p-1/editar');
    await user.click(p.getByRole('button', { name: 'Cancelar pedido' }));
    const confirmacao = within(await screen.findByRole('alertdialog'));
    expect(confirmacao.getByText('Cancelar o pedido de 13–15/10 · 18:00–20:00?')).toBeInTheDocument();
    expect(confirmacao.getByText('Carlos Mendes vai receber o aviso.')).toBeInTheDocument();
    await user.click(confirmacao.getByRole('button', { name: 'Cancelar pedido' }));
    expect(await screen.findByText('Pedido cancelado. Carlos Mendes vai receber o aviso.')).toBeInTheDocument();
    await waitFor(() => expect(local()).toBe('/extensoes/meus'));
  });

  it('reprovado: motivo em destaque e "Pedir de novo com outra data"', async () => {
    await abrir('/extensoes/meus/p-6', 'joao');
    const p = within(await detalhe('João Lima'));
    const motivo = p.getByRole('region', { name: 'Motivo da reprovação' });
    expect(within(motivo).getByText('Combinar outro horário')).toBeInTheDocument();
    expect(within(motivo).getByText('“Pode ser na quinta? Segunda tem reunião cedo.” — Carlos Mendes')).toBeInTheDocument();
    expect(p.getByRole('link', { name: 'Pedir de novo com outra data' })).toHaveAttribute('href', '/extensoes/meus/novo?base=p-6');
    expect(p.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument();
  });
});

describe('Detalhe do pedido: fechar', () => {
  it('Esc fecha, volta para a lista e devolve o foco à linha', async () => {
    const { user } = await abrir('/extensoes/aprovar');
    const link = await screen.findByRole('link', { name: 'Ana Souza' });
    await user.click(link);
    await detalhe('Ana Souza');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Pedido de/ })).not.toBeInTheDocument());
    expect(local()).toBe('/extensoes/aprovar');
    await waitFor(() => expect(screen.getByRole('link', { name: 'Ana Souza' })).toHaveFocus());
  });
});
