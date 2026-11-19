import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registrosExtras } from '../../../mock/auditoriaExtra';
import { renderApp } from '../../../test/render';
import { salvarAutomatica } from '../../assistente/preferencias';
import { entrarComo } from '../../extensoes/api/mocks/db';
import { listarJornadas, resetarJornadas } from '../api';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.localStorage.clear();
  resetarJornadas();
  entrarComo('carlos');
});

type Usuario = ReturnType<typeof renderApp>['user'];
const local = () => screen.getByTestId('local-atual').textContent;
const identificador = () => screen.getByRole('textbox', { name: /Identificador/ }) as HTMLInputElement;
const existe = async (id: string) => (await listarJornadas()).some((j) => j.identificador === id);

async function abrirNova() {
  const app = renderApp('/jornadas/nova');
  // O painel abre carregando a lista de jornadas; os campos vêm depois.
  await screen.findByRole('textbox', { name: /Identificador/ }, { timeout: 20_000 });
  return app;
}

/** Abre a conversa dentro do formulário e manda a mensagem. */
async function pedir(user: Usuario, texto: string) {
  const painel = screen.getByRole('region', { name: 'Assistente Scua' });
  const botao = within(painel).getByRole('button', { name: 'Preencher com IA' });
  if (botao.getAttribute('aria-expanded') !== 'true') await user.click(botao);
  const campo = within(painel).getByRole('textbox', { name: 'Mensagem para o assistente' });
  await user.type(campo, `${texto}{Enter}`);
  return painel;
}

describe('Jornada: preencher com o assistente', () => {
  it('preenche, destaca o que preencheu e deixa a pessoa salvar', async () => {
    const { user } = await abrirNova();
    // Com o formulário aberto, a bolha flutuante sai de cena: a conversa fica dentro dele.
    expect(screen.queryByRole('button', { name: 'Assistente Scua' })).not.toBeInTheDocument();

    const painel = await pedir(user, 'seg a sex, 7h às 16h, almoço 11 às 12, nome TESTE-7H');
    await waitFor(() => expect(identificador()).toHaveValue('TESTE-7H'));
    expect(identificador().closest('[data-ia]')).not.toBeNull();
    expect(screen.getByText('Preenchido pelo assistente. Confira antes de salvar.')).toBeInTheDocument();
    expect(within(painel).getByText(/Preenchi:/)).toHaveTextContent('07:00–16:00');
    expect(within(painel).getByText(/Confira e clique em Salvar\./)).toBeInTheDocument();
    expect(screen.getByText(/Resumo:/).parentElement).toHaveTextContent('07:00–16:00');
    expect(await existe('TESTE-7H')).toBe(false);
  });

  it('mexer num campo tira o destaque só dele', async () => {
    const { user } = await abrirNova();
    await pedir(user, 'seg a sex, 7h às 16h, almoço 11 às 12, nome TESTE-7H');
    await waitFor(() => expect(identificador()).toHaveValue('TESTE-7H'));
    await user.type(identificador(), 'X');
    expect(identificador().closest('[data-ia]')).toBeNull();
    // A semana continua destacada.
    expect(screen.getByRole('heading', { name: 'Horários da semana' }).closest('[data-ia]')).not.toBeNull();
  });

  it('salvar pela pessoa grava e registra na auditoria como feito com o assistente', async () => {
    const { user } = await abrirNova();
    await pedir(user, 'seg a sex, 7h às 16h, almoço 11 às 12, nome TESTE-7H, tipo Comercial');
    await waitFor(() => expect(identificador()).toHaveValue('TESTE-7H'));
    await user.type(screen.getByRole('textbox', { name: /Descrição/ }), 'Turno da manhã');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(async () => expect(await existe('TESTE-7H')).toBe(true));
    expect(registrosExtras()).toEqual([expect.objectContaining({ aba: 'jornadas', item: 'TESTE-7H', acao: 'Criou', viaAssistente: true, pessoaId: 'u-carlos', anterior: null })]);
  });

  it('salvar sem ter usado o assistente não marca a auditoria', async () => {
    const { user } = await abrirNova();
    await user.type(identificador(), 'MANUAL-1');
    await user.type(screen.getByRole('textbox', { name: /Descrição/ }), 'Feita à mão');
    await user.click(screen.getByRole('combobox', { name: /Tipo/ }));
    await user.click(await screen.findByRole('option', { name: 'Comercial' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(async () => expect(await existe('MANUAL-1')).toBe(true));
    expect(registrosExtras()).toEqual([]);
  });

  it('aprovação automática: valida antes; com erro não salva e mostra o problema', async () => {
    salvarAutomatica('u-carlos', true);
    const { user } = await abrirNova();
    // Falta descrição e tipo (obrigatórios): não pode salvar.
    const painel = await pedir(user, 'seg a sex, 7h às 16h, almoço 11 às 12, nome AUTO-1');
    expect(await within(painel).findByText(/Não salvei: há campos para corrigir no formulário\./)).toBeInTheDocument();
    expect(await existe('AUTO-1')).toBe(false);
    // O erro aparece no campo, como num salvar comum.
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Descrição/ })).toHaveAttribute('aria-invalid', 'true'));
  });

  it('aprovação automática: com tudo válido, salva sozinho e avisa', async () => {
    salvarAutomatica('u-carlos', true);
    const { user } = await abrirNova();
    await user.type(screen.getByRole('textbox', { name: /Descrição/ }), 'Automática');
    await pedir(user, 'seg a sex, 7h às 16h, almoço 11 às 12, nome AUTO-2, tipo Turno');
    await waitFor(async () => expect(await existe('AUTO-2')).toBe(true));
    // O formulário fecha e a conversa continua na janela do assistente, com o aviso.
    expect(await screen.findByText(/Salvei a jornada AUTO-2\./, undefined, { timeout: 10_000 })).toBeInTheDocument();
    expect(registrosExtras()[0]).toMatchObject({ item: 'AUTO-2', viaAssistente: true });
  });

  it('pedido feito no Início abre a Nova jornada e preenche sozinho', async () => {
    const { user } = renderApp('/inicio');
    await screen.findByRole('heading', { level: 1, name: 'Início' }, { timeout: 20_000 });
    await user.click(screen.getByRole('button', { name: 'Assistente Scua' }));
    await user.type(screen.getByRole('textbox', { name: 'Mensagem para o assistente' }), 'cria uma jornada seg a sex 8 às 17 nome NOVA-1{Enter}');
    await waitFor(() => expect(local()).toBe('/jornadas/nova'), { timeout: 15_000 });
    await waitFor(() => expect(identificador()).toHaveValue('NOVA-1'), { timeout: 15_000 });
    // A conversa aparece dentro do formulário, já aberta.
    const painel = screen.getByRole('region', { name: 'Assistente Scua' });
    expect(await within(painel).findByText(/Confira e clique em Salvar\./)).toBeInTheDocument();
  });

  it('quem não gere pessoas não consegue criar jornada pelo assistente', async () => {
    entrarComo('olga');
    const { user } = renderApp('/extensoes');
    await screen.findByRole('heading', { level: 1 }, { timeout: 20_000 });
    const antes = local();
    await user.click(screen.getByRole('button', { name: 'Assistente Scua' }));
    await user.type(screen.getByRole('textbox', { name: 'Mensagem para o assistente' }), 'cria uma jornada seg a sex 8 às 17 nome NOVA-2{Enter}');
    expect(await screen.findByText(/não tem acesso/i)).toBeInTheDocument();
    expect(local()).toBe(antes);
  });

  it('a Auditoria mostra a etiqueta "Assistente" na gravação feita com ele', async () => {
    const { user } = await abrirNova();
    await pedir(user, 'seg a sex, 7h às 16h, almoço 11 às 12, nome TESTE-7H, tipo Comercial');
    await waitFor(() => expect(identificador()).toHaveValue('TESTE-7H'));
    await user.type(screen.getByRole('textbox', { name: /Descrição/ }), 'Turno da manhã');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(async () => expect(await existe('TESTE-7H')).toBe(true));
    // O painel fecha depois de salvar; só então o menu volta a ficar acessível.
    await user.click((await screen.findAllByRole('link', { name: 'Auditoria' }))[0]);
    await user.click(await screen.findByRole('tab', { name: /Jornadas/ }, { timeout: 20_000 }));
    // No ambiente de teste a lista aparece em cartões (tela estreita); na tela larga é uma linha de tabela.
    const linha = (await screen.findByText('TESTE-7H', undefined, { timeout: 15_000 })).closest('li, tr') as HTMLElement;
    expect(within(linha).getByText('Assistente')).toBeInTheDocument();
    expect(within(linha).getByText(/Carlos Mendes/)).toBeInTheDocument();
  });
});
