import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../../mock/rede';
import { renderApp } from '../../../test/render';
import { resetarJornadas } from '../api';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  resetarJornadas();
});

const local = () => screen.getByTestId('local-atual').textContent;
const linhaDe = (id: string) => screen.getByRole('link', { name: id }).closest('tr')!;
const painel = (nome: string | RegExp) => screen.findByRole('dialog', { name: nome });
const digitar = (campo: HTMLElement, valor: string) => fireEvent.change(campo, { target: { value: valor } });
const hora = (grupo: HTMLElement, rotulo: string, valor: string) => fireEvent.change(within(grupo).getByLabelText(rotulo), { target: { value: valor } });

async function abrirLista() {
  const app = renderApp('/jornadas');
  await screen.findByRole('link', { name: 'ADM-8H' }, { timeout: 20_000 });
  return app;
}

describe('Lista de jornadas', () => {
  it('mostra título, botão de adicionar, horário resumido, carga semanal e Sim/Não em texto', async () => {
    await abrirLista();
    expect(screen.getByRole('heading', { level: 1, name: 'Jornadas de trabalho' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Adicionar jornada' })).toHaveAttribute('href', '/jornadas/nova');
    const adm = within(linhaDe('ADM-8H'));
    expect(adm.getByText('Seg a sex, 08:00–17:00')).toBeInTheDocument();
    expect(adm.getByText('40h')).toBeInTheDocument();
    expect(adm.getAllByText('Sim')).toHaveLength(2); // ativa e padrão
    expect(within(linhaDe('COM-44H')).getByText('Seg a sex, 08:00–17:00; Sáb, 08:00–12:00')).toBeInTheDocument();
    expect(within(linhaDe('COM-44H')).getByText('44h')).toBeInTheDocument();
    expect(within(linhaDe('TURNO-A')).getByText('37h30')).toBeInTheDocument();
    expect(screen.queryByText(/[✓✗]/)).not.toBeInTheDocument();
  });

  it('busca por identificador ou descrição, sem acento, e limpa a busca', async () => {
    const { user } = await abrirLista();
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'manha');
    expect(screen.getByRole('link', { name: 'TURNO-A' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'ADM-8H' })).not.toBeInTheDocument();
    expect(local()).toBe('/jornadas?q=manha');

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar' }));
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'zzz');
    expect(screen.getByText('Nenhuma jornada encontrada para “zzz”')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(await screen.findByRole('link', { name: 'ADM-8H' })).toBeInTheDocument();
  });

  it('mostra o erro com "Tentar de novo" e se recupera', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/jornadas');
    expect(await screen.findByText('Não conseguimos carregar os dados')).toBeInTheDocument();
    expect(screen.queryByText(/falha de rede/i)).not.toBeInTheDocument();
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: 'ADM-8H' })).toBeInTheDocument();
  });
});

describe('Adicionar jornada', () => {
  it('valida no envio e leva o foco ao primeiro campo com problema', async () => {
    const { user } = await abrirLista();
    await user.click(screen.getByRole('link', { name: 'Adicionar jornada' }));
    const p = within(await painel('Nova jornada'));
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await p.findByText('Informe o identificador')).toBeInTheDocument();
    expect(p.getByText('Informe a descrição')).toBeInTheDocument();
    expect(p.getByText('Escolha o tipo')).toBeInTheDocument();
    await waitFor(() => expect(p.getByLabelText('Identificador *')).toHaveFocus());
  });

  it('rejeita identificador repetido, saída antes da entrada e intervalo fora do expediente', async () => {
    const { user } = await abrirLista();
    await user.click(screen.getByRole('link', { name: 'Adicionar jornada' }));
    const p = within(await painel('Nova jornada'));
    digitar(p.getByLabelText('Identificador *'), 'adm-8h');
    digitar(p.getByLabelText('Descrição *'), 'Teste');
    await user.click(p.getByRole('combobox', { name: /Tipo/ }));
    await user.click(await screen.findByRole('option', { name: 'Turno' }));
    const terca = p.getByRole('group', { name: 'Terça-feira' });
    hora(terca, 'Saída', '07:00');
    const quarta = p.getByRole('group', { name: 'Quarta-feira' });
    hora(quarta, 'Início do intervalo', '07:00');
    hora(quarta, 'Fim do intervalo', '08:30');
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await p.findByText('Já existe uma jornada com este identificador')).toBeInTheDocument();
    expect(within(terca).getByText('A saída precisa ser depois da entrada')).toBeInTheDocument();
    expect(within(quarta).getByText('O intervalo precisa ficar dentro do expediente')).toBeInTheDocument();
  });

  it('pede pelo menos um dia de trabalho', async () => {
    const { user } = await abrirLista();
    await user.click(screen.getByRole('link', { name: 'Adicionar jornada' }));
    const p = within(await painel('Nova jornada'));
    for (const dia of ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']) {
      await user.click(within(p.getByRole('group', { name: dia })).getByRole('switch', { name: 'Trabalha' }));
    }
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await p.findByText('Marque pelo menos um dia de trabalho')).toBeInTheDocument();
  });

  it('atualiza o resumo ao vivo, copia a segunda para os dias úteis e salva', async () => {
    const { user } = await abrirLista();
    await user.click(screen.getByRole('link', { name: 'Adicionar jornada' }));
    const p = within(await painel('Nova jornada'));
    expect(p.getByText(/Seg a sex, 08:00–17:00\. Carga semanal de 40h/)).toBeInTheDocument();

    hora(p.getByRole('group', { name: 'Segunda-feira' }), 'Entrada', '07:00');
    hora(p.getByRole('group', { name: 'Segunda-feira' }), 'Saída', '16:00');
    expect(p.getByText(/Seg, 07:00–16:00; Ter a sex, 08:00–17:00/)).toBeInTheDocument();
    await user.click(p.getByRole('button', { name: 'Copiar segunda para os dias úteis' }));
    expect(p.getByText(/Seg a sex, 07:00–16:00\. Carga semanal de 40h/)).toBeInTheDocument();

    digitar(p.getByLabelText('Identificador *'), 'MAD-8H');
    digitar(p.getByLabelText('Descrição *'), 'Madrugador');
    await user.click(p.getByRole('combobox', { name: /Tipo/ }));
    await user.click(await screen.findByRole('option', { name: 'Administrativa' }));
    await user.click(p.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Jornada MAD-8H adicionada.')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'MAD-8H' })).toBeInTheDocument();
    await waitFor(() => expect(local()).toBe('/jornadas'));
    expect(within(linhaDe('MAD-8H')).getByText('Seg a sex, 07:00–16:00')).toBeInTheDocument();
  });

  it('avisa que marcar como padrão tira o padrão da outra, e só uma fica padrão', async () => {
    const { user } = await abrirLista();
    await user.click(screen.getByRole('link', { name: 'Adicionar jornada' }));
    const p = within(await painel('Nova jornada'));
    digitar(p.getByLabelText('Identificador *'), 'NOVA-PADRAO');
    digitar(p.getByLabelText('Descrição *'), 'Nova padrão');
    await user.click(p.getByRole('combobox', { name: /Tipo/ }));
    await user.click(await screen.findByRole('option', { name: 'Comercial' }));
    await user.click(p.getByRole('switch', { name: 'Padrão' }));
    expect(p.getByText('Ao salvar, ADM-8H deixa de ser a jornada padrão.')).toBeInTheDocument();
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    await screen.findByText('Jornada NOVA-PADRAO adicionada.');
    await waitFor(() => expect(within(linhaDe('ADM-8H')).queryAllByText('Sim')).toHaveLength(1));
    expect(within(linhaDe('NOVA-PADRAO')).getAllByText('Sim')).toHaveLength(2);
  });

  it('erro ao salvar preserva os dados e leva o foco ao aviso', async () => {
    const { user } = await abrirLista();
    await user.click(screen.getByRole('link', { name: 'Adicionar jornada' }));
    const p = within(await painel('Nova jornada'));
    digitar(p.getByLabelText('Identificador *'), 'FALHA-1');
    digitar(p.getByLabelText('Descrição *'), 'Vai falhar');
    await user.click(p.getByRole('combobox', { name: /Tipo/ }));
    await user.click(await screen.findByRole('option', { name: 'Turno' }));
    definirFalhaDeRede(true);
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    const aviso = await p.findByRole('alert');
    expect(aviso).toHaveTextContent('Não conseguimos salvar. O que você preencheu continua aqui.');
    await waitFor(() => expect(aviso).toHaveFocus());
    expect(p.getByLabelText('Identificador *')).toHaveValue('FALHA-1');
    expect(p.getByLabelText('Descrição *')).toHaveValue('Vai falhar');
  });
});

describe('Editar jornada', () => {
  it('abre por link direto, altera e salva', async () => {
    const { user } = renderApp('/jornadas/jor-adm-6h');
    const p = within(await painel('Editar jornada ADM-6H'));
    expect(p.getByLabelText('Identificador *')).toHaveValue('ADM-6H');
    const descricao = p.getByLabelText('Descrição *');
    digitar(descricao, 'Meio período da tarde');
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Jornada ADM-6H atualizada.')).toBeInTheDocument();
    expect(await screen.findByText('Meio período da tarde')).toBeInTheDocument();
    await waitFor(() => expect(local()).toBe('/jornadas'));
  });

  it('a jornada padrão não deixa desmarcar "Padrão" e explica o motivo', async () => {
    renderApp('/jornadas/jor-adm-8h');
    const p = within(await painel('Editar jornada ADM-8H'));
    expect(p.getByRole('switch', { name: 'Padrão' })).toHaveAttribute('aria-disabled', 'true');
    expect(p.getByText('Esta é a jornada padrão. Para trocar, marque outra jornada como padrão.')).toBeInTheDocument();
  });

  it('jornada inexistente mostra mensagem e Voltar', async () => {
    const { user } = renderApp('/jornadas/nao-existe');
    const p = within(await painel('Editar jornada'));
    expect(await p.findByRole('alert')).toHaveTextContent('Esta jornada não existe ou foi removida.');
    await user.click(p.getByRole('button', { name: 'Voltar' }));
    await waitFor(() => expect(local()).toBe('/jornadas'));
  });

  it('Esc fecha o painel e devolve o foco ao link', async () => {
    const { user } = await abrirLista();
    const link = screen.getByRole('link', { name: 'ADM-6H' });
    await user.click(link);
    await painel('Editar jornada ADM-6H');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(local()).toBe('/jornadas'));
    await waitFor(() => expect(link).toHaveFocus());
  });
});

describe('Excluir jornada', () => {
  it('pede confirmação e só então exclui', async () => {
    const { user } = await abrirLista();
    await user.click(screen.getByRole('button', { name: 'Excluir ADM-6H' }));
    const dialogo = within(await screen.findByRole('alertdialog'));
    expect(dialogo.getByText('Excluir a jornada ADM-6H?')).toBeInTheDocument();
    await user.click(dialogo.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('link', { name: 'ADM-6H' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir ADM-6H' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Excluir' }));
    expect(await screen.findByText('Jornada ADM-6H excluída.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('link', { name: 'ADM-6H' })).not.toBeInTheDocument());
  });

  it('a jornada padrão não pode ser excluída e o aviso explica por quê', async () => {
    const { user } = await abrirLista();
    await user.click(screen.getByRole('button', { name: 'Excluir ADM-8H' }));
    const dialogo = within(await screen.findByRole('alertdialog'));
    expect(dialogo.getByText('Não dá para excluir a jornada ADM-8H')).toBeInTheDocument();
    expect(dialogo.getByText(/jornada padrão, usada por quem não tem uma jornada própria/)).toBeInTheDocument();
    expect(dialogo.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
    await user.click(dialogo.getByRole('button', { name: 'Fechar' }));
    expect(screen.getByRole('link', { name: 'ADM-8H' })).toBeInTheDocument();
  });
});
