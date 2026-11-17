import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../../test/render';
import { server } from '../../../test/server';
import { entrarComo, listarDb } from '../api/mocks/db';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const local = () => screen.getByTestId('local-atual').textContent;
const painel = () => screen.findByRole('dialog', { name: /extensão/ });

/** Conta os POST em /api/extensoes (criação). */
function contarCriacoes() {
  const chamadas: string[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/extensoes') chamadas.push(request.url);
  });
  return chamadas;
}

async function abrir(rota: string, quem: 'ana' | 'carlos' = 'ana') {
  entrarComo(quem);
  const app = renderApp(rota);
  await painel();
  await waitFor(() => expect(screen.queryByRole('status', { name: 'Carregando' })).not.toBeInTheDocument());
  return app;
}

function preencherDias(inicial: string, final = '') {
  fireEvent.change(screen.getByLabelText('Primeiro dia'), { target: { value: inicial } });
  fireEvent.change(screen.getByLabelText('Último dia (opcional)'), { target: { value: final } });
}
function preencherHorario(inicio = '18:00', fim = '20:00') {
  fireEvent.change(screen.getByLabelText('Início'), { target: { value: inicio } });
  fireEvent.change(screen.getByLabelText('Fim'), { target: { value: fim } });
}
async function escolher(user: ReturnType<typeof renderApp>['user'], campo: string, opcao: string) {
  await user.click(screen.getByRole('combobox', { name: campo }));
  await user.click(await screen.findByRole('option', { name: opcao }));
}

describe('Formulário de pedido: novo', () => {
  it('abre com o título certo e, para colaborador, sem o campo "Para quem"', async () => {
    await abrir('/extensoes/meus/novo');
    expect(screen.getByRole('heading', { name: 'Nova extensão' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Para quem?' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar pedido' })).toBeEnabled();
  });

  it('critério 1: 3 dias × 2h mostram "6h" no resumo antes de enviar, com limite e aprovador', async () => {
    await abrir('/extensoes/meus/novo');
    expect(screen.getByText('Preencha os dias e o horário para ver o total.')).toBeInTheDocument();
    preencherDias('2026-10-21', '2026-10-23');
    preencherHorario('18:00', '20:00');
    expect(screen.getByText('3 dias × 2h = 6h de extensão')).toBeInTheDocument();
    // Ana já tem 6h aprovadas em outubro e o limite é 10h: 12h passa em 2h.
    const barra = await screen.findByRole('meter', { name: 'Limite do grupo' });
    expect(barra).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('12h de 10h')).toBeInTheDocument();
    expect(screen.getByText('Passa o limite em 2h, vai precisar de aprovação especial')).toBeInTheDocument();
    expect(screen.getByText(/Quem aprova:/)).toHaveTextContent('Quem aprova: Carlos Mendes');
  });

  it('as faixas do limite mudam com as horas: dentro, perto, passou e sem limite', async () => {
    const { user } = await abrir('/extensoes/meus/novo', 'carlos');
    await escolher(user, 'Colaborador', 'João Lima');
    preencherHorario('18:00', '20:00');
    preencherDias('2026-10-21');
    expect(await screen.findByText('Dentro do limite')).toBeInTheDocument();
    preencherDias('2026-10-21', '2026-10-25'); // 5 dias × 2h = 10h = 100% do limite
    expect(await screen.findByText('Perto do limite')).toBeInTheDocument();
    preencherDias('2026-10-21', '2026-10-26');
    expect(await screen.findByText('Passa o limite em 2h, vai precisar de aprovação especial')).toBeInTheDocument();
    await escolher(user, 'Colaborador', 'Bia Rocha');
    expect(await screen.findByText('Sem limite de extensão')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('esconde limite e aprovador quando a API do resumo responde 404, e o resto continua funcionando', async () => {
    server.use(http.get('*/api/beneficiarios/:id/resumo', () => HttpResponse.json({ codigo: 'NAO_ENCONTRADO' }, { status: 404 })));
    await abrir('/extensoes/meus/novo');
    preencherDias('2026-10-21', '2026-10-23');
    preencherHorario();
    expect(screen.getByText('3 dias × 2h = 6h de extensão')).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.queryByText(/Limite do grupo/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quem aprova/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar pedido' })).toBeEnabled();
  });

  it('critério 2: "Outra" sem detalhes impede o envio e mostra a mensagem no campo', async () => {
    const criacoes = contarCriacoes();
    const { user } = await abrir('/extensoes/meus/novo');
    preencherDias('2026-10-21');
    preencherHorario();
    await escolher(user, 'Por quê?', 'Outra');
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));
    const detalhes = screen.getByLabelText('Detalhes (obrigatório)');
    expect(await screen.findByText('Descreva o motivo')).toBeInTheDocument();
    expect(detalhes).toHaveFocus();
    expect(criacoes).toHaveLength(0);
    expect(local()).toBe('/extensoes/meus/novo');
  });

  it('mostra o erro do campo ao sair dele e leva o foco ao primeiro inválido ao enviar', async () => {
    const { user } = await abrir('/extensoes/meus/novo');
    const fim = screen.getByLabelText('Fim');
    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '19:00' } });
    fireEvent.change(fim, { target: { value: '18:00' } });
    expect(screen.queryByText('A hora final precisa ser depois da inicial')).not.toBeInTheDocument();
    await user.click(fim);
    await user.tab();
    expect(await screen.findByText('A hora final precisa ser depois da inicial')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(screen.getByLabelText('Primeiro dia')).toHaveFocus();
    expect(screen.getByText('Informe o primeiro dia')).toBeInTheDocument();
    expect(screen.getByText('Escolha um motivo')).toBeInTheDocument();
  });

  it('critério 3: o pedido criado vai para Meus pedidos como Pendente e para a fila do gestor', async () => {
    const { user } = await abrir('/extensoes/meus/novo');
    preencherDias('2026-10-21', '2026-10-23');
    preencherHorario();
    await escolher(user, 'Por quê?', 'Curso');
    await user.type(screen.getByLabelText('Detalhes (opcional)'), 'Treinamento interno');
    expect(screen.getByText('19/500')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    expect(await screen.findByText('Pedido enviado. Carlos Mendes vai receber o aviso.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /extensão/ })).not.toBeInTheDocument());
    expect(local()).toBe('/extensoes/meus');
    const linha = (await screen.findAllByRole('row')).find((r) => within(r).queryByText('21–23/10 · 18:00–20:00'));
    expect(linha).toBeDefined();
    expect(within(linha!).getByText('Pendente')).toBeInTheDocument();

    entrarComo('carlos');
    const fila = listarDb(new URLSearchParams({ aba: 'aprovar' }));
    expect(fila).not.toBe('proibido');
    if (fila !== 'proibido') expect(fila.itens.some((p) => p.beneficiario.nome === 'Ana Souza' && p.dataInicial === '2026-10-21')).toBe(true);
  });

  it('duplo clique em "Enviar pedido" gera uma requisição só', async () => {
    const criacoes = contarCriacoes();
    const { user } = await abrir('/extensoes/meus/novo');
    preencherDias('2026-10-21');
    preencherHorario();
    await escolher(user, 'Por quê?', 'Curso');
    await user.dblClick(screen.getByRole('button', { name: 'Enviar pedido' }));
    await screen.findByText(/Pedido enviado/);
    expect(criacoes).toHaveLength(1);
  });

  it('falha ao enviar: o painel fica aberto e preenchido, com aviso e "Tentar de novo"', async () => {
    server.use(http.post('*/api/extensoes', () => new HttpResponse(null, { status: 503 }), { once: true }));
    const { user } = await abrir('/extensoes/meus/novo');
    preencherDias('2026-10-21', '2026-10-22');
    preencherHorario('18:00', '20:30');
    await escolher(user, 'Por quê?', 'Curso');
    await user.type(screen.getByLabelText('Detalhes (opcional)'), 'Treinamento');
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('Não conseguimos enviar. Seus dados estão salvos aqui.');
    expect(aviso.textContent).not.toMatch(/503|HTTP|ProgressEvent/i);
    expect(screen.getByRole('dialog', { name: /extensão/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Primeiro dia')).toHaveValue('2026-10-21');
    expect(screen.getByLabelText('Último dia (opcional)')).toHaveValue('2026-10-22');
    expect(screen.getByLabelText('Fim')).toHaveValue('20:30');
    expect(screen.getByLabelText('Detalhes (opcional)')).toHaveValue('Treinamento');
    expect(screen.getByRole('combobox', { name: 'Por quê?' })).toHaveTextContent('Curso');

    await user.click(within(aviso).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText(/Pedido enviado/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /extensão/ })).not.toBeInTheDocument());
  });

  it('409 PERIODO_CONFLITANTE aparece no campo de dias e mantém o painel aberto', async () => {
    const { user } = await abrir('/extensoes/meus/novo');
    preencherDias('2026-10-14', '2026-10-14'); // Ana já tem p-1 pendente em 13–15/10
    preencherHorario();
    await escolher(user, 'Por quê?', 'Curso');
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(await screen.findByText('Já existe um pedido pendente para esse período.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /extensão/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Primeiro dia')).toHaveFocus();
    expect(screen.queryByText(/Não conseguimos enviar/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Primeiro dia'), { target: { value: '2026-10-28' } });
    expect(screen.queryByText('Já existe um pedido pendente para esse período.')).not.toBeInTheDocument();
  });

  it('gestor: "Para outra pessoa" é o padrão e exige escolher o colaborador', async () => {
    const { user } = await abrir('/extensoes/meus/novo', 'carlos');
    expect(screen.getByRole('radio', { name: 'Para outra pessoa' })).toBeChecked();
    await user.click(screen.getByRole('combobox', { name: 'Colaborador' }));
    expect((await screen.findAllByRole('option')).map((o) => o.textContent)).toEqual(['Ana Souza', 'João Lima', 'Bia Rocha', 'Rui Alves']);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('radio', { name: 'Para mim' }));
    expect(screen.queryByRole('combobox', { name: 'Colaborador' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Para outra pessoa' }));
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(await screen.findByText('Escolha para quem é a extensão')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Colaborador' })).toHaveFocus();
  });
});

describe('Formulário de pedido: fechar', () => {
  it('Esc fecha, volta para a lista com os filtros da URL e devolve o foco ao botão que abriu', async () => {
    entrarComo('ana');
    const { user } = renderApp('/extensoes/meus?status=pendente');
    const botao = await screen.findByRole('link', { name: '+ Nova extensão' });
    await user.click(botao);
    await painel();
    expect(local()).toBe('/extensoes/meus/novo?status=pendente');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /extensão/ })).not.toBeInTheDocument());
    expect(local()).toBe('/extensoes/meus?status=pendente');
    await waitFor(() => expect(botao).toHaveFocus());
  });

  it('Cancelar fecha', async () => {
    const { user } = await abrir('/extensoes/meus/novo');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /extensão/ })).not.toBeInTheDocument());
    expect(local()).toBe('/extensoes/meus');
  });
});

describe('Formulário de pedido: editar', () => {
  it('abre preenchido e atualiza o pedido pendente', async () => {
    const { user } = await abrir('/extensoes/meus/p-1/editar');
    expect(screen.getByRole('heading', { name: 'Editar extensão' })).toBeInTheDocument();
    expect(screen.getByLabelText('Primeiro dia')).toHaveValue('2026-10-13');
    expect(screen.getByLabelText('Último dia (opcional)')).toHaveValue('2026-10-15');
    expect(screen.getByLabelText('Início')).toHaveValue('18:00');
    expect(screen.getByRole('combobox', { name: 'Por quê?' })).toHaveTextContent('Janela de deploy');
    expect(screen.getByLabelText('Detalhes (opcional)')).toHaveValue('Atualização do ERP');
    fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '21:00' } });
    expect(screen.getByText('3 dias × 3h = 9h de extensão')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(await screen.findByText('Pedido atualizado. Carlos Mendes vai receber o aviso da mudança.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /extensão/ })).not.toBeInTheDocument());
    expect(local()).toBe('/extensoes/meus');
  });

  it('pedido que já foi decidido não é editável', async () => {
    await abrir('/extensoes/meus/p-5/editar');
    expect(await screen.findByText('Este pedido não pode mais ser editado.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar pedido' })).not.toBeInTheDocument();
  });

  it('pedido de outra pessoa não é editável por quem não o criou', async () => {
    await abrir('/extensoes/meus/p-1/editar', 'carlos');
    expect(await screen.findByText('Só quem criou o pedido pode editá-lo.')).toBeInTheDocument();
  });

  it('pedido que não existe mostra a mensagem certa', async () => {
    await abrir('/extensoes/meus/p-999/editar');
    expect(await screen.findByText('Este pedido não existe ou foi removido.')).toBeInTheDocument();
  });
});

describe('Formulário de pedido: pedir de novo', () => {
  it('abre preenchido com os dados do pedido, menos as datas', async () => {
    await abrir('/extensoes/meus/novo?base=p-5');
    await waitFor(() => expect(screen.getByLabelText('Início')).toHaveValue('18:00'));
    expect(screen.getByLabelText('Fim')).toHaveValue('20:00');
    expect(screen.getByRole('combobox', { name: 'Por quê?' })).toHaveTextContent('Janela de deploy');
    expect(screen.getByLabelText('Primeiro dia')).toHaveValue('');
    expect(screen.getByLabelText('Último dia (opcional)')).toHaveValue('');
    expect(screen.getByRole('heading', { name: 'Nova extensão' })).toBeInTheDocument();
  });
});
