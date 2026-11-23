import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render';
import { entrarComo } from '../extensoes/api/mocks/db';
import { resetarConfigAssistente } from '../assistente/preferencias';
import { BLOCOS_PADRAO } from './blocos';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.localStorage.clear();
  resetarConfigAssistente();
  entrarComo('carlos');
});
afterEach(() => vi.restoreAllMocks());

async function abrirInicio() {
  const app = renderApp('/inicio');
  await screen.findByRole('heading', { level: 1, name: 'Início' }, { timeout: 20_000 });
  return app;
}

/** Abre a caixa "Resumo do dia" do cabeçalho (ao lado do modo claro/escuro) e devolve a caixa. */
async function abrirResumo(user: Awaited<ReturnType<typeof abrirInicio>>['user']) {
  await user.click(await screen.findByRole('button', { name: /^Resumo do dia/ }, { timeout: 20_000 }));
  return (await screen.findByRole('heading', { level: 2, name: 'Resumo do dia' }, { timeout: 20_000 })).closest('section')!;
}

describe('"Resumo do dia" na caixa do cabeçalho', () => {
  it('não ocupa o Início por padrão (fica no cabeçalho; dá para ligar em Personalizar)', () => {
    expect(BLOCOS_PADRAO).not.toContain('resumo-dia');
  });

  it('o botão do cabeçalho mostra quantos itens há e a caixa fecha com Esc', async () => {
    const { user } = await abrirInicio();
    const botao = await screen.findByRole('button', { name: /^Resumo do dia, \d+ itens precisam de você$/ }, { timeout: 20_000 });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    await user.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(botao).toHaveFocus();
  });

  it('lista os itens com link para a tela e o botão "Resolver com o assistente"', async () => {
    const { user } = await abrirInicio();
    const bloco = await abrirResumo(user);
    const itens = await within(bloco).findAllByRole('listitem', {}, { timeout: 20_000 });
    expect(itens.length).toBeGreaterThanOrEqual(2);
    expect(itens[0]).toHaveTextContent('5 pedidos de extensão esperam a sua decisão');
    expect(within(itens[0]).getByRole('link', { name: 'Ver pedidos' })).toHaveAttribute('href', '/extensoes/aprovar');
    expect(within(bloco).getAllByRole('button', { name: 'Resolver com o assistente' }).length).toBe(itens.length);
    expect(within(bloco).getByRole('link', { name: 'Abrir o Radar de passivo' })).toHaveAttribute('href', '/radar-de-passivo');
    expect(within(bloco).getByRole('link', { name: 'Abrir a Previsão de jornada' })).toHaveAttribute('href', '/previsao');
  });

  it('"Resolver com o assistente" abre a conversa já no assunto, com o cartão de confirmação', async () => {
    const { user } = await abrirInicio();
    const bloco = await abrirResumo(user);
    const botoes = await within(bloco).findAllByRole('button', { name: 'Resolver com o assistente' }, { timeout: 20_000 });
    await user.click(botoes[0]);
    const janela = await screen.findByRole('dialog', { name: 'Assistente Scua' });
    expect(await within(janela).findByRole('region', { name: 'Confirmar aprovação em lote' }, { timeout: 20_000 })).toBeInTheDocument();
    // Abrir só a conversa não aprova nada.
    expect(within(janela).getByRole('button', { name: /^Aprovar \d+ pedidos?$/ })).toBeInTheDocument();
  });

  it('item sem aprovação em lote: o assistente explica e oferece abrir a tela', async () => {
    const { user } = await abrirInicio();
    const bloco = await abrirResumo(user);
    const itens = await within(bloco).findAllByRole('listitem', {}, { timeout: 20_000 });
    const passivo = itens.find((i) => i.textContent?.includes('sem aprovação nos últimos 7 dias'))!;
    await user.click(within(passivo).getByRole('button', { name: 'Resolver com o assistente' }));
    const janela = await screen.findByRole('dialog', { name: 'Assistente Scua' });
    expect(await within(janela).findByRole('link', { name: /Abrir o Radar de passivo/ }, { timeout: 20_000 })).toHaveAttribute('href', '/radar-de-passivo');
  });
});
