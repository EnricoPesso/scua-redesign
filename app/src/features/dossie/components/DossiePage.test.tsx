import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../../mock/rede';
import { renderApp } from '../../../test/render';

const local = () => screen.getByTestId('local-atual').textContent;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  vi.restoreAllMocks();
});

describe('Dossiê do colaborador', () => {
  it('sem pessoa escolhida mostra o que é o dossiê e deixa exportar e imprimir desabilitados', async () => {
    renderApp('/dossie');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dossiê do colaborador' }, { timeout: 15_000 })).toBeInTheDocument();
    expect(screen.getByText('Escolha uma pessoa para gerar o dossiê')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Imprimir ou salvar em PDF/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Exportar/ })).toBeDisabled();
  });

  it('com uma pessoa na URL mostra identificação, resumo, linha do tempo e código de integridade', async () => {
    renderApp('/dossie?pessoa=u-ana&periodo=15');
    expect(await screen.findByRole('heading', { level: 2, name: 'Dossiê de Ana Souza' }, { timeout: 15_000 })).toBeInTheDocument();
    expect(screen.getByText('1002')).toBeInTheDocument();
    expect(screen.getByText('SCUA-NB-021')).toBeInTheDocument();
    expect(screen.getByText('11/10/2026', { exact: false, selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Resumo do período' })).toBeInTheDocument();
    const dias = screen.getByRole('list', { name: 'Dias do período' });
    expect(within(dias).getAllByRole('heading', { level: 3 })).toHaveLength(15);
    // O dia mais recente (ontem, domingo) vem primeiro.
    expect(within(dias).getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('domingo, 11/10/2026');
    expect(within(dias).getAllByRole('img')[0]).toHaveAccessibleName(/Jornada prevista|Sem jornada prevista/);
    const codigo = screen.getByRole('heading', { name: 'Integridade do registro' }).closest('section')!.querySelector('code')!;
    expect(codigo.textContent).toMatch(/^[0-9a-f]{64}$/);
    expect(screen.getByText(/não substitui o controle de ponto oficial da empresa/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar/ })).toBeEnabled();
  });

  it('"Só dias com ocorrência" vai para a URL e esconde os dias sem ocorrência', async () => {
    const { user } = renderApp('/dossie?pessoa=u-ana');
    const dias = await screen.findByRole('list', { name: 'Dias do período' }, { timeout: 15_000 });
    const todos = within(dias).getAllByRole('heading', { level: 3 }).length;
    await user.click(screen.getByRole('checkbox', { name: 'Só dias com ocorrência' }));
    await waitFor(() => expect(local()).toContain('ocorrencias=1'));
    const filtrados = within(screen.getByRole('list', { name: 'Dias do período' })).getAllByRole('heading', { level: 3 }).length;
    expect(filtrados).toBeGreaterThan(0);
    expect(filtrados).toBeLessThan(todos);
    expect(screen.queryByText('Sem ocorrência')).not.toBeInTheDocument();
  });

  it('copiar o código avisa que copiou', async () => {
    // O user-event troca a área de transferência por uma de mentira: dá para conferir o que foi copiado.
    const { user } = renderApp('/dossie?pessoa=u-joao&periodo=7');
    await user.click(await screen.findByRole('button', { name: 'Copiar código' }, { timeout: 15_000 }));
    expect(await screen.findByText('Código copiado.')).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('falha de rede mostra o erro amigável e permite tentar de novo', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/dossie?pessoa=u-ana');
    expect(await screen.findByText('Não conseguimos carregar os dados', {}, { timeout: 15_000 })).toBeInTheDocument();
    expect(screen.queryByText(/Falha de rede/)).not.toBeInTheDocument();
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Dossiê de Ana Souza' })).toBeInTheDocument();
  });
});
