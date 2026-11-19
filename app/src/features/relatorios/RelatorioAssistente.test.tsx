import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render';
import { entrarComo } from '../extensoes/api/mocks/db';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.localStorage.clear();
  entrarComo('carlos');
});

type Usuario = ReturnType<typeof renderApp>['user'];

/** Abre a conversa pela bolha e manda a mensagem. */
async function pedir(user: Usuario, texto: string) {
  await user.click(await screen.findByRole('button', { name: 'Assistente Scua' }));
  const janela = await screen.findByRole('dialog', { name: 'Assistente Scua' });
  await user.type(within(janela).getByRole('textbox', { name: 'Mensagem para o assistente' }), `${texto}{Enter}`);
  return within(janela).getByRole('log', { name: 'Conversa com o assistente' });
}

describe('Relatório: analisar com o assistente', () => {
  it('"analisa esse relatório" cita o título e os indicadores, com os mesmos números da tela', async () => {
    const { user } = renderApp('/relatorios/tempo-de-bloqueio');
    // Espera os dados chegarem: o assistente só enxerga o relatório pronto.
    const kpi = await screen.findByRole('group', { name: 'Bloqueios liberados' }, { timeout: 20_000 });
    await waitFor(() => expect(kpi).not.toHaveAttribute('aria-busy'), { timeout: 20_000 });

    const conversa = await pedir(user, 'analisa esse relatório');
    await waitFor(() => expect(conversa).toHaveTextContent('Tempo de bloqueio'), { timeout: 20_000 });
    expect(conversa).toHaveTextContent('Bloqueios liberados');
    const numero = /Bloqueios liberados: ([\d.]+)/.exec(conversa.textContent ?? '')?.[1];
    expect(numero).toBeDefined();
    await waitFor(() => expect(screen.getByRole('group', { name: 'Bloqueios liberados' })).toHaveTextContent(numero as string));
  });

  it('período sem dados: a resposta diz que não há dados com esses filtros', async () => {
    const { user } = renderApp('/relatorios/tempo-de-bloqueio?inicio=2020-01-01&fim=2020-01-31');
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Limpar filtros' })).toHaveLength(2), { timeout: 20_000 });

    const conversa = await pedir(user, 'analisa esse relatório');
    await waitFor(() => expect(conversa).toHaveTextContent('Não há dados com esses filtros.'), { timeout: 20_000 });
  });
});
