import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render';
import { liberacoes } from './api';

let erroConsole: ReturnType<typeof vi.spyOn>;
beforeEach(() => { erroConsole = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { liberacoes.resetar(); });

const abrir = async () => {
  const app = renderApp('/liberacoes-por-diretoria');
  await screen.findByRole('heading', { name: 'Liberações por diretoria' });
  await screen.findByText('Feira de negócios fora do escritório');
  return app;
};
const data = (rotulo: string, v: string) => fireEvent.change(screen.getByLabelText(rotulo), { target: { value: v } });
async function escolherDiretoria(user: ReturnType<typeof renderApp>['user'], nome: string) {
  await user.click(screen.getByRole('combobox', { name: /Diretoria/ }));
  await user.click(await screen.findByRole('option', { name: nome }));
}

describe('Tela de liberações por diretoria', () => {
  it('lista as 5 liberações com a situação calculada e sem erro no console', async () => {
    await abrir();
    expect(screen.getByText('Em vigor')).toBeInTheDocument();
    expect(screen.getAllByText('Agendada')).toHaveLength(2);
    expect(screen.getAllByText('Encerrada')).toHaveLength(2);
    expect(screen.getAllByText('Toda a diretoria', { selector: 'td' })).toHaveLength(3);
    expect(screen.getByText('22:00 às 23:59')).toBeInTheDocument();
    expect(erroConsole).not.toHaveBeenCalled();
  });

  it('valida obrigatórios, datas e horários', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Adicionar liberação' }));
    const painel = await screen.findByRole('dialog', { name: 'Nova liberação' });
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('Escolha diretoria')).toBeInTheDocument();
    expect(within(painel).getByText('Informe motivo')).toBeInTheDocument();
    await escolherDiretoria(user, 'Pessoas');
    data('De *', '2026-11-20');
    data('Até *', '2026-11-10');
    data('Horário inicial (opcional)', '08:00');
    await user.type(within(painel).getByLabelText(/Motivo/), 'Evento');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('A data final não pode ser anterior à inicial')).toBeInTheDocument();
    expect(within(painel).getByText('Informe o horário final ou apague o inicial')).toBeInTheDocument();
  });

  it('adiciona uma liberação válida', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Adicionar liberação' }));
    const painel = await screen.findByRole('dialog', { name: 'Nova liberação' });
    await escolherDiretoria(user, 'Pessoas');
    data('De *', '2026-12-01');
    data('Até *', '2026-12-03');
    await user.type(within(painel).getByLabelText(/Motivo/), 'Confraternização');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Confraternização')).toBeInTheDocument();
    expect(screen.getByText('01/12 a 03/12/2026')).toBeInTheDocument();
  });

  it('bloqueia liberação que sobrepõe outra da mesma diretoria e área', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Adicionar liberação' }));
    const painel = await screen.findByRole('dialog', { name: 'Nova liberação' });
    await escolherDiretoria(user, 'Comercial');
    data('De *', '2026-10-14');
    data('Até *', '2026-10-30');
    await user.type(within(painel).getByLabelText(/Motivo/), 'Outro evento');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText(/Já existe uma liberação para Comercial \(toda a diretoria\)/)).toBeInTheDocument();
  });

  it('edita o motivo de uma liberação', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Editar Financeiro' }));
    const painel = await screen.findByRole('dialog', { name: 'Editar liberação' });
    const motivo = within(painel).getByLabelText(/Motivo/);
    await user.clear(motivo);
    await user.type(motivo, 'Auditoria externa');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Auditoria externa')).toBeInTheDocument();
  });

  it('exclui só depois da confirmação', async () => {
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Excluir Financeiro' }));
    const confirmacao = await screen.findByRole('alertdialog');
    expect(screen.getByText('Fechamento anual')).toBeInTheDocument();
    await user.click(within(confirmacao).getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(screen.queryByText('Fechamento anual')).not.toBeInTheDocument());
  });
});
