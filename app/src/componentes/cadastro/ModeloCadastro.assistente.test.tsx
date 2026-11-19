import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FORMULARIOS } from '../../features/assistente/acoes';
import type { PedidoAssistente } from '../../features/assistente/contrato';
import { salvarAutomatica } from '../../features/assistente/preferencias';
import { entrarComo } from '../../features/extensoes/api/mocks/db';
import { configPausas } from '../../features/pausas/config';
import { perfisDePausas } from '../../features/pausas/api';
import { parametros } from '../../features/configuracoes/cadastros/parametros';
import { registrosExtras } from '../../mock/auditoriaExtra';
import { renderApp } from '../../test/render';

// Guarda os pedidos que a conversa faz (o contexto traz o formulário aberto) e segue para o modo simulado de verdade.
const pedidos = vi.hoisted(() => [] as PedidoAssistente[]);
vi.mock('../../features/assistente/api', async (original) => {
  const real = await original<typeof import('../../features/assistente/api')>();
  return { ...real, perguntar: (p: PedidoAssistente, s?: AbortSignal) => { pedidos.push(p); return real.perguntar(p, s); } };
});

const [CAMPO_NOME, , CAMPO_DURACAO] = configPausas.campos;
const nome = () => screen.getByRole('textbox', { name: new RegExp(CAMPO_NOME.rotulo) }) as HTMLInputElement;
const duracao = () => screen.getByRole('spinbutton', { name: new RegExp(CAMPO_DURACAO.rotulo.replace(/[()]/g, '\\$&')) }) as HTMLInputElement;
const local = () => screen.getByTestId('local-atual').textContent;
const existe = async (n: string) => (await perfisDePausas.listar()).some((p) => p.nome === n);
type Usuario = ReturnType<typeof renderApp>['user'];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.localStorage.clear();
  pedidos.length = 0;
  perfisDePausas.resetar();
  parametros.resetar();
  entrarComo('carlos');
});

async function abrirPausa() {
  const app = renderApp('/pausas?novo=1');
  await screen.findByRole('textbox', { name: new RegExp(CAMPO_NOME.rotulo) }, { timeout: 20_000 });
  return app;
}

/** Abre a conversa dentro do formulário e manda a mensagem. */
async function pedir(user: Usuario, texto: string) {
  const painel = await screen.findByRole('region', { name: 'Assistente Scua' }, { timeout: 20_000 });
  const botao = within(painel).getByRole('button', { name: 'Preencher com IA' });
  if (botao.getAttribute('aria-expanded') !== 'true') await user.click(botao);
  await user.type(within(painel).getByRole('textbox', { name: 'Mensagem para o assistente' }), `${texto}{Enter}`);
  return painel;
}

describe('Cadastros do modelo único: preencher com o assistente', () => {
  it('preenche pelos rótulos, destaca o que preencheu e não salva sozinho', async () => {
    const { user } = await abrirPausa();
    // Com o formulário aberto, a conversa fica dentro dele.
    expect(screen.queryByRole('button', { name: 'Assistente Scua' })).not.toBeInTheDocument();
    const painel = await pedir(user, `${CAMPO_NOME.rotulo}: Café da tarde, ${CAMPO_DURACAO.rotulo}: 15`);
    await waitFor(() => expect(nome()).toHaveValue('Café da tarde'));
    expect(duracao()).toHaveValue(15);
    expect(nome().closest('[data-ia]')).not.toBeNull();
    expect(duracao().closest('[data-ia]')).not.toBeNull();
    expect(screen.getByText('Preenchido pelo assistente. Confira antes de salvar.')).toBeInTheDocument();
    expect(await within(painel).findByText(/Confira e clique em Salvar\./)).toBeInTheDocument();
    expect(await existe('Café da tarde')).toBe(false);
    // Mexer num campo tira o destaque só dele.
    await user.type(nome(), '!');
    expect(nome().closest('[data-ia]')).toBeNull();
    expect(duracao().closest('[data-ia]')).not.toBeNull();
  });

  it('valor fora do limite não entra: o campo não muda e a conversa avisa', async () => {
    const { user } = await abrirPausa();
    const antes = duracao().value;
    const painel = await pedir(user, `${CAMPO_DURACAO.rotulo}: 999`);
    expect(await within(painel).findByText(`Não preenchi: ${CAMPO_DURACAO.rotulo}.`)).toBeInTheDocument();
    expect(duracao()).toHaveValue(Number(antes));
    expect(duracao().closest('[data-ia]')).toBeNull();
    expect(screen.queryByText('Preenchido pelo assistente. Confira antes de salvar.')).not.toBeInTheDocument();
  });

  it('aprovação automática: valida, salva e avisa; cadastro sem aba na Auditoria não registra', async () => {
    salvarAutomatica('u-carlos', true);
    const { user } = await abrirPausa();
    await pedir(user, `${CAMPO_NOME.rotulo}: Lanche rápido, ${CAMPO_DURACAO.rotulo}: 15`);
    await waitFor(async () => expect(await existe('Lanche rápido')).toBe(true));
    expect(await screen.findByText(/Salvei perfil de pausas Lanche rápido./, undefined, { timeout: 10_000 })).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Lanche rápido' }, { timeout: 10_000 })).toBeInTheDocument();
    expect(registrosExtras()).toEqual([]);
  });

  it('aprovação automática: com campo inválido não salva e mostra o erro no campo', async () => {
    salvarAutomatica('u-carlos', true);
    const { user } = await abrirPausa();
    // O nome é obrigatório e ficou vazio.
    const painel = await pedir(user, `${CAMPO_DURACAO.rotulo}: 20`);
    expect(await within(painel).findByText(/Não salvei: há campos para corrigir no formulário\./)).toBeInTheDocument();
    await waitFor(() => expect(nome()).toHaveAttribute('aria-invalid', 'true'));
    expect((await perfisDePausas.listar()).length).toBe(3);
  });

  it('pedido feito no Início abre /pausas?novo=1 e preenche', async () => {
    const { user } = renderApp('/inicio');
    await screen.findByRole('heading', { level: 1, name: 'Início' }, { timeout: 20_000 });
    await user.click(screen.getByRole('button', { name: 'Assistente Scua' }));
    await user.type(screen.getByRole('textbox', { name: 'Mensagem para o assistente' }), `cria uma pausa ${CAMPO_NOME.rotulo}: Lanche{Enter}`);
    await waitFor(() => expect(local()).toBe('/pausas?novo=1'), { timeout: 15_000 });
    await waitFor(() => expect(nome()).toHaveValue('Lanche'), { timeout: 15_000 });
    expect(nome().closest('[data-ia]')).not.toBeNull();
  });

  it('cadastro com aba na Auditoria: grava via assistente e registra; campo fixo fica fora do alvo', async () => {
    const { user } = renderApp('/configuracoes/parametros?editar=par-1');
    await screen.findByRole('textbox', { name: /Valor/ }, { timeout: 20_000 });
    await pedir(user, 'Valor: 20');
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Valor/ })).toHaveValue('20'));
    const alvo = pedidos.at(-1)?.contexto.alvo;
    expect(alvo?.tipo === 'formulario' && alvo.campos.map((c) => c.chave)).toEqual(['valor']);
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(registrosExtras()).toHaveLength(1), { timeout: 10_000 });
    expect(registrosExtras()[0]).toMatchObject({
      aba: 'parametros', item: 'Tolerância de entrada (minutos)', acao: 'Alterou', viaAssistente: true, pessoaId: 'u-carlos',
      anterior: 'Valor: 10', novo: 'Valor: 20',
    });
  });

  it('salvar à mão, sem ter usado o assistente, não registra na Auditoria', async () => {
    const { user } = renderApp('/configuracoes/parametros?editar=par-1');
    const valor = await screen.findByRole('textbox', { name: /Valor/ }, { timeout: 20_000 });
    await user.clear(valor);
    await user.type(valor, '25');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(async () => expect((await parametros.listar())[0].valor).toBe('25'), { timeout: 10_000 });
    expect(registrosExtras()).toEqual([]);
  });

  // Garante que nenhum id da lista de formulários que o assistente sabe abrir ficou órfão.
  it.each(FORMULARIOS.map((f) => [f.id, f.rota] as const))('a rota de %s abre um formulário que se registra com o mesmo id', async (id, rota) => {
    const { user } = renderApp(rota);
    await pedir(user, 'oi');
    await waitFor(() => expect(pedidos.length).toBeGreaterThan(0), { timeout: 20_000 });
    expect(pedidos.at(-1)?.contexto.alvo).toMatchObject({ tipo: 'formulario', id });
  });
});
