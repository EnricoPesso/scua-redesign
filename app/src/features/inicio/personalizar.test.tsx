import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render';
import { entrarComo } from '../extensoes/api/mocks/db';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.localStorage.clear();
});

async function abrirInicio(quem: 'carlos' | 'olga' = 'carlos') {
  entrarComo(quem);
  const app = renderApp('/inicio');
  await screen.findByRole('heading', { level: 1, name: 'Início' }, { timeout: 20_000 });
  return app;
}

async function abrirPersonalizar(user: ReturnType<typeof renderApp>['user']) {
  await user.click(screen.getByRole('button', { name: 'Personalizar início' }));
  return within(await screen.findByRole('dialog', { name: 'Personalizar início' }));
}

const cartao = (titulo: string) => screen.queryByRole('heading', { level: 2, name: titulo });

describe('Início personalizável', () => {
  it('abre o painel com os blocos ligados, na ordem atual', async () => {
    const { user } = await abrirInicio();
    const p = await abrirPersonalizar(user);
    const lista = p.getByRole('list', { name: 'Blocos no seu início' });
    expect(within(lista).getAllByRole('listitem')[0]).toHaveTextContent('Pedidos para aprovar');
    expect(p.getByRole('checkbox', { name: 'Horas de extensão por mês' })).toBeChecked();
    expect(p.getByRole('checkbox', { name: 'Pedidos parados' })).not.toBeChecked();
  });

  it('liga, desliga e reordena; ao salvar o início muda e a escolha fica guardada', async () => {
    const { user, unmount } = await abrirInicio();
    const p = await abrirPersonalizar(user);
    await user.click(p.getByRole('checkbox', { name: 'Horas de extensão por mês' }));
    await user.click(p.getByRole('checkbox', { name: 'Pedidos parados' }));
    // "Pedidos parados" entra no fim da lista; sobe uma posição.
    await user.click(p.getByRole('button', { name: 'Subir Pedidos parados' }));
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Personalizar início' })).not.toBeInTheDocument());
    expect(cartao('Horas de extensão aprovadas por mês')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Pedidos parados' })).toBeInTheDocument();
    expect(screen.getByText('Início personalizado.')).toBeInTheDocument();

    // Recarregar mantém.
    unmount();
    await abrirInicio();
    expect(await screen.findByRole('heading', { level: 2, name: 'Pedidos parados' })).toBeInTheDocument();
    expect(cartao('Horas de extensão aprovadas por mês')).not.toBeInTheDocument();
  });

  it('"Restaurar padrão" volta ao painel original', async () => {
    window.localStorage.setItem('scua.inicio.u-carlos', JSON.stringify(['parados']));
    const { user } = await abrirInicio();
    expect(await screen.findByRole('heading', { level: 2, name: 'Pedidos parados' })).toBeInTheDocument();
    const p = await abrirPersonalizar(user);
    await user.click(p.getByRole('button', { name: 'Restaurar padrão' }));
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Horas de extensão aprovadas por mês' })).toBeInTheDocument();
    expect(cartao('Pedidos parados')).not.toBeInTheDocument();
  });

  it('qualquer indicador de relatório pode virar um bloco, seguindo o período do início', async () => {
    const { user } = await abrirInicio();
    const p = await abrirPersonalizar(user);
    await user.click(await p.findByRole('combobox', { name: 'Relatório' }));
    await user.click(await screen.findByRole('option', { name: 'Tempo de bloqueio' }));
    await user.click(await p.findByRole('combobox', { name: 'Indicador' }));
    await user.click(await screen.findByRole('option', { name: 'Bloqueios liberados' }));
    await user.click(p.getByRole('button', { name: 'Adicionar indicador' }));
    expect(p.getByRole('checkbox', { name: 'Tempo de bloqueio: Bloqueios liberados' })).toBeChecked();
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    const kpi = await screen.findByRole('group', { name: 'Bloqueios liberados' }, { timeout: 15_000 });
    await waitFor(() => expect(kpi).not.toHaveAttribute('aria-busy'));
    expect(kpi).toHaveTextContent(/\d/);
    expect(kpi).toHaveTextContent(/hoje, 12\/10/i);
  });

  it('a escolha é de cada pessoa: o que o Carlos salvou não muda o início da Olga', async () => {
    window.localStorage.setItem('scua.inicio.u-carlos', JSON.stringify(['parados']));
    await abrirInicio('olga');
    expect(await screen.findByRole('heading', { level: 2, name: 'Horas de extensão aprovadas por mês' })).toBeInTheDocument();
    expect(cartao('Pedidos parados')).not.toBeInTheDocument();
  });

  it('novos blocos de dia a dia mostram dados reais do período', async () => {
    window.localStorage.setItem('scua.inicio.u-carlos', JSON.stringify(['ausentes', 'parados', 'fora-jornada', 'ferias']));
    await abrirInicio();
    const ausentes = await screen.findByRole('list', { name: 'Quem mais esteve ausente' }, { timeout: 15_000 });
    expect(within(ausentes).getAllByRole('listitem').length).toBeGreaterThan(0);
    const parados = await screen.findByRole('list', { name: 'Pedidos parados' });
    // O mais antigo da fila do Carlos é o da Bia (setembro).
    expect(within(parados).getAllByRole('listitem')[0]).toHaveTextContent('Bia Rocha');
    expect(within(parados).getAllByRole('link')[0]).toHaveAttribute('href', '/extensoes/aprovar/p-8');
    expect(await screen.findByRole('heading', { level: 2, name: 'Acessos fora da jornada' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Próximas férias' })).toBeInTheDocument();
  });

  it('quem tirou tudo vê um convite para personalizar, não uma tela em branco', async () => {
    window.localStorage.setItem('scua.inicio.u-carlos', '[]');
    await abrirInicio();
    expect(await screen.findByText('Seu início está vazio')).toBeInTheDocument();
  });
});
