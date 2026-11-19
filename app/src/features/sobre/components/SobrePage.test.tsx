import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../../mock/rede';
import { renderApp } from '../../../test/render';
import { sobreApi } from '../api';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  vi.restoreAllMocks();
});

describe('Sobre', () => {
  it('mostra licenças, versões, última atualização e o bloco de ajuda', async () => {
    renderApp('/sobre');
    // O primeiro render do arquivo carrega a tela sob demanda: damos mais tempo.
    expect(await screen.findByRole('heading', { level: 1, name: 'Sobre' }, { timeout: 15_000 })).toBeInTheDocument();
    const medidor = await screen.findByRole('meter', { name: 'Licenças em uso' });
    expect(medidor).toHaveAttribute('aria-valuenow', '4');
    expect(medidor).toHaveAttribute('aria-valuemax', '50');
    expect(medidor).toHaveAttribute('aria-valuetext', '4 de 50 licenças em uso');
    expect(screen.getByText('4 de 50 licenças em uso')).toBeInTheDocument();
    expect(screen.queryByText('Quase no limite')).not.toBeInTheDocument();
    expect(screen.getByText('Versão do aplicativo').nextSibling).toHaveTextContent('2.0.10.80');
    expect(screen.getByText('Versão do banco de dados').nextSibling).toHaveTextContent('3.02.16.114');
    expect(screen.getByText('Última atualização').nextSibling).toHaveTextContent('03/10/2026');
    expect(screen.getByRole('heading', { level: 2, name: 'Precisa de ajuda?' })).toBeInTheDocument();
  });

  it('o link de suporte abre em nova aba com rel seguro e avisa o leitor de tela', async () => {
    renderApp('/sobre');
    const link = await screen.findByRole('link', { name: /Falar com o suporte da Scua/ });
    expect(link).toHaveAttribute('href', 'https://scua.com.br/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.textContent).toBe('Falar com o suporte da Scua (abre em nova aba)');
  });

  it('avisa quando as licenças passam de 90%', async () => {
    vi.spyOn(sobreApi, 'obter').mockResolvedValue({ licencasUsadas: 48, licencasContratadas: 50, versaoApp: '2.0.10.80', versaoBanco: '3.02.16.114', atualizadoEm: '2026-10-03' });
    renderApp('/sobre');
    const selo = await screen.findByText('Quase no limite');
    expect(within(selo.closest('p')!).getByText(/Fale com o suporte da Scua para contratar mais/, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '48 de 50 licenças em uso');
  });

  it('copiar informações coloca o resumo na área de transferência e confirma com toast', async () => {
    const { user } = renderApp('/sobre');
    const botao = await screen.findByRole('button', { name: 'Copiar informações' });
    await waitFor(() => expect(botao).toBeEnabled());
    await user.click(botao);
    expect(await screen.findByText('Informações copiadas. Cole no seu chamado.')).toBeInTheDocument();
    const copiado = await navigator.clipboard.readText();
    expect(copiado).toContain('Versão do aplicativo: 2.0.10.80');
    expect(copiado).toContain('Versão do banco de dados: 3.02.16.114');
    expect(copiado).toContain('Licenças: 4 de 50 licenças em uso');
    expect(copiado).toContain('https://scua.com.br/');
  });

  it('sem área de transferência avisa e mostra o texto para copiar na mão', async () => {
    const { user } = renderApp('/sobre');
    const botao = await screen.findByRole('button', { name: 'Copiar informações' });
    await waitFor(() => expect(botao).toBeEnabled());
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    await user.click(botao);
    expect((await screen.findAllByText(/Não conseguimos copiar sozinhos/)).length).toBeGreaterThan(0);
    expect((screen.getByRole('textbox', { name: 'Resumo para copiar' }) as HTMLTextAreaElement).value).toContain('Versão do aplicativo: 2.0.10.80');
    expect(screen.queryByText('Informações copiadas. Cole no seu chamado.')).not.toBeInTheDocument();
  });

  it('copiar recusado pelo navegador também cai no texto manual', async () => {
    const { user } = renderApp('/sobre');
    const botao = await screen.findByRole('button', { name: 'Copiar informações' });
    await waitFor(() => expect(botao).toBeEnabled());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('negado')) }, configurable: true });
    await user.click(botao);
    expect(await screen.findByRole('textbox', { name: 'Resumo para copiar' })).toBeInTheDocument();
  });

  it('mostra o esqueleto enquanto carrega e o botão de copiar fica desabilitado', async () => {
    renderApp('/sobre');
    expect(await screen.findByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar informações' })).toBeDisabled();
    await screen.findByRole('meter');
  });

  it('erro ao carregar mostra aviso amigável e "Tentar de novo" recupera', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/sobre');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não conseguimos carregar os dados');
    expect(alerta).not.toHaveTextContent(/Falha de rede simulada|ErroDeRede/);
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('meter')).toBeInTheDocument();
  });
});
