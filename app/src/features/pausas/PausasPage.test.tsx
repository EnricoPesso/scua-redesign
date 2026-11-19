import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render';
import { definirFalhaDeRede } from '../../mock/rede';
import { perfisDePausas } from './api';

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { perfisDePausas.resetar(); definirFalhaDeRede(false); });

const abrir = async () => {
  const app = renderApp('/pausas');
  await screen.findByRole('heading', { name: 'Pausas' });
  await screen.findByText('2 pausas de 15 min');
  return app;
};

describe('Tela de pausas', () => {
  it('lista os 3 perfis com o resumo legível', async () => {
    await abrir();
    expect(screen.getByText('Pausas Comercial')).toBeInTheDocument();
    expect(screen.getByText('3 pausas de 10 min')).toBeInTheDocument();
    expect(screen.getByText('1 pausa de 90 min')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('valida campos obrigatórios e limites antes de salvar', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Adicionar perfil de pausas' }));
    const painel = await screen.findByRole('dialog', { name: /perfil de pausas/ });
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('Informe nome do perfil')).toBeInTheDocument();
    await user.type(within(painel).getByLabelText(/Nome do perfil/), 'Pausas Noite');
    await user.clear(within(painel).getByLabelText(/Pausas por dia/));
    await user.type(within(painel).getByLabelText(/Pausas por dia/), '0');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('O mínimo é 1')).toBeInTheDocument();
  });

  it('adiciona um perfil e mostra na lista', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Adicionar perfil de pausas' }));
    const painel = await screen.findByRole('dialog', { name: /perfil de pausas/ });
    await user.type(within(painel).getByLabelText(/Nome do perfil/), 'Pausas Noite');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Pausas Noite')).toBeInTheDocument();
    expect(screen.getAllByText('2 pausas de 15 min')).toHaveLength(2);
  });

  it('não aceita nome repetido', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Adicionar perfil de pausas' }));
    const painel = await screen.findByRole('dialog', { name: /perfil de pausas/ });
    await user.type(within(painel).getByLabelText(/Nome do perfil/), 'pausas comercial');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('Já existe um perfil de pausas com esse nome. Use outro nome.')).toBeInTheDocument();
  });

  it('edita um perfil', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Editar Pausas Suporte' }));
    const painel = await screen.findByRole('dialog', { name: 'Editar perfil de pausas' });
    const campo = within(painel).getByLabelText(/Pausas por dia/);
    await user.clear(campo);
    await user.type(campo, '4');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('4 pausas de 10 min')).toBeInTheDocument();
  });

  it('exclui só depois da confirmação', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Excluir Pausas Suporte' }));
    const confirmacao = await screen.findByRole('alertdialog');
    expect(screen.getByText('Pausas Suporte')).toBeInTheDocument();
    await user.click(within(confirmacao).getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(screen.queryByText('Pausas Suporte')).not.toBeInTheDocument());
  });

  it('mostra erro ao carregar com "Tentar de novo"', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/pausas');
    expect(await screen.findByText('Não conseguimos carregar os dados')).toBeInTheDocument();
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Pausas Comercial')).toBeInTheDocument();
  });
});
