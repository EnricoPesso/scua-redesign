import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../../mock/rede';
import { renderApp } from '../../../test/render';
import * as api from '../api';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  api.resetarUsuarios();
  vi.restoreAllMocks();
});

type App = ReturnType<typeof renderApp>;
const local = () => screen.getByTestId('local-atual').textContent;
const digitar = (campo: HTMLElement, valor: string) => fireEvent.change(campo, { target: { value: valor } });
const painel = (nome: string) => screen.findByRole('dialog', { name: nome });

async function abrirLista(rota = '/usuarios', esperar = 'Carlos Mendes') {
  const app = renderApp(rota);
  await screen.findByRole('link', { name: esperar }, { timeout: 20_000 });
  return app;
}
/** Abre o painel de um usuário por link direto e espera os dados carregarem. */
async function abrirDetalhe(rota: string, nome: string) {
  const app = renderApp(rota);
  const p = within(await screen.findByRole('dialog', { name: nome }, { timeout: 20_000 }));
  await p.findByRole('tab', { name: 'Dados' });
  return { ...app, p };
}
async function escolher(user: App['user'], combo: HTMLElement, opcao: string) {
  await user.click(combo);
  await user.click(await screen.findByRole('option', { name: opcao }));
}

describe('Lista de usuários', () => {
  it('mostra título, contagem, paginação e as colunas de cada pessoa', async () => {
    await abrirLista();
    expect(screen.getByRole('heading', { level: 1, name: 'Usuários' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('22 usuários');
    // 10 por página por padrão: a lista cabe na tela sem rolar tanto.
    expect(screen.getByText('1–10 de 22')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Itens por página/ })).toHaveTextContent('10');
    const linha = screen.getByRole('link', { name: 'Ana Souza' }).closest('tr')!;
    expect(within(linha).getByText('ana.souza')).toBeInTheDocument();
    expect(within(linha).getByText('Carlos Mendes')).toBeInTheDocument();
    expect(within(linha).getByText('Vendas')).toBeInTheDocument();
    expect(within(linha).getByText('COM-44H')).toBeInTheDocument();
    expect(within(linha).getByText('Ativo')).toBeInTheDocument();
  });

  it('por padrão esconde os inativos; Inativos e Todos mudam a lista', async () => {
    const { user } = await abrirLista();
    expect(screen.queryByRole('link', { name: 'Tiago Moreira' })).not.toBeInTheDocument();
    await escolher(user, screen.getByRole('combobox', { name: /Situação/ }), 'Inativos');
    expect(await screen.findByRole('link', { name: 'Tiago Moreira' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 usuários com esses filtros');
    expect(local()).toBe('/usuarios?situacao=inativos');
    expect(within(screen.getByRole('link', { name: 'Tiago Moreira' }).closest('tr')!).getByText('Inativo')).toBeInTheDocument();
    await escolher(user, screen.getByRole('combobox', { name: /Situação/ }), 'Todos');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^24 usuários$/));
  });

  it('busca por nome ou login sem acento, com atraso, e deixa a busca na URL', async () => {
    const { user } = await abrirLista();
    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nome ou login' }), 'JOAO');
    // O atraso evita buscar a cada tecla: a lista só muda depois da pausa.
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Carlos Mendes' })).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'João Lima' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 usuário com esses filtros');
    expect(local()).toBe('/usuarios?busca=JOAO');
  });

  it('filtra por gestor e por departamento', async () => {
    const { user } = await abrirLista();
    await escolher(user, screen.getByRole('combobox', { name: /Gestor/ }), 'Olga Prado');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3 usuários com esses filtros'));
    expect(screen.getByRole('link', { name: 'Xavier Pinto' })).toBeInTheDocument();
    expect(local()).toBe('/usuarios?gestor=u-olga');

    await escolher(user, screen.getByRole('combobox', { name: /Gestor/ }), 'Todos os gestores');
    await escolher(user, screen.getByRole('combobox', { name: /Departamento/ }), 'Logística');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3 usuários com esses filtros'));
    expect(screen.getByRole('link', { name: 'Bia Rocha' })).toBeInTheDocument();
    expect(local()).toBe('/usuarios?departamento=Log%C3%ADstica');
  });

  it('sem resultado mostra o vazio por filtro e "Limpar filtros" restaura tudo', async () => {
    const { user } = await abrirLista();
    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nome ou login' }), 'zzzz');
    expect(await screen.findByText('Nenhum usuário com esses filtros')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(await screen.findByRole('link', { name: 'Carlos Mendes' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar por nome ou login' })).toHaveValue('');
    expect(local()).toBe('/usuarios');
  });

  it('URL editada à mão com valores inválidos cai nos padrões', async () => {
    await abrirLista('/usuarios?pagina=abc&tamanho=7&situacao=xx&gestor=ninguem&departamento=Marte');
    expect(screen.getByRole('status')).toHaveTextContent(/^22 usuários$/);
    expect(screen.getByText('1–10 de 22')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Itens por página/ })).toHaveTextContent('10');
    expect(screen.getByRole('combobox', { name: /Situação/ })).toHaveTextContent('Ativos');
  });

  it('pagina em português, com 10, 25 ou 50 por página, e guarda página e tamanho na URL', async () => {
    const { user } = await abrirLista();
    expect(screen.getByText('1–10 de 22')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText('11–20 de 22')).toBeInTheDocument();
    expect(local()).toBe('/usuarios?pagina=2');
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText('21–22 de 22')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(await screen.findByText('11–20 de 22')).toBeInTheDocument();
    // Quem quiser ver mais de uma vez escolhe no seletor; trocar o tamanho volta para a primeira página.
    await escolher(user, screen.getByRole('combobox', { name: /Itens por página/ }), '25');
    expect(await screen.findByText('1–22 de 22')).toBeInTheDocument();
    expect(local()).toBe('/usuarios?tamanho=25');
  });

  it('abrir e fechar o painel de um usuário não muda página nem tamanho (problema #3 do sistema atual)', async () => {
    const { user } = await abrirLista('/usuarios?tamanho=10&pagina=2', 'Fábio Nunes');
    expect(screen.getByText('11–20 de 22')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Fábio Nunes' }));
    await painel('Fábio Nunes');
    expect(local()).toBe('/usuarios/u-fabio?tamanho=10&pagina=2');
    // A lista continua por baixo, na mesma página e com o mesmo tamanho.
    expect(screen.getByText('11–20 de 22')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(local()).toBe('/usuarios?tamanho=10&pagina=2'));
    expect(screen.getByText('11–20 de 22')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Itens por página/ })).toHaveTextContent('10');

  });

  it('o mesmo vale ao fechar o painel pelo botão ✕', async () => {
    const { user } = await abrirLista('/usuarios?tamanho=10&pagina=2', 'Fábio Nunes');
    await user.click(screen.getByRole('link', { name: 'Gabriela Teles' }));
    const p = within(await painel('Gabriela Teles'));
    await user.click(p.getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(local()).toBe('/usuarios?tamanho=10&pagina=2'));
    expect(screen.getByText('11–20 de 22')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Itens por página/ })).toHaveTextContent('10');
  });

  it('mostra o esqueleto enquanto carrega', async () => {
    vi.spyOn(api, 'listarUsuarios').mockReturnValue(new Promise(() => {}));
    renderApp('/usuarios');
    expect(await screen.findByRole('status', { name: 'Carregando usuários' }, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('erro ao carregar mostra texto amigável e "Tentar de novo" recupera', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/usuarios');
    expect(await screen.findByText('Não conseguimos carregar os dados', undefined, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.queryByText(/falha de rede/i)).not.toBeInTheDocument();
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: 'Carlos Mendes' })).toBeInTheDocument();
  });
});

describe('Detalhe: painel e abas', () => {
  it('abre por link direto na aba Dados, com nome, login e matrícula só de leitura', async () => {
    const { p } = await abrirDetalhe('/usuarios/u-ana', 'Ana Souza');
    expect(p.getByRole('tab', { name: 'Dados' })).toHaveAttribute('aria-selected', 'true');
    for (const rotulo of ['Nome', 'Login', 'Matrícula']) expect(p.getByLabelText(rotulo)).toHaveAttribute('readonly');
    expect(p.getByLabelText('Login')).toHaveValue('ana.souza');
    expect(p.getByLabelText(/E-mail/)).toHaveValue('ana.souza@scua.com.br');
    expect(p.getByRole('group', { name: 'Permissões' })).toBeInTheDocument();
    expect(p.getByText('Acessa as configurações e a administração do sistema.')).toBeInTheDocument();
    // A lista fica por baixo.
    expect(screen.getByRole('heading', { level: 1, name: 'Usuários', hidden: true })).toBeInTheDocument();
  });

  it('troca de aba e a aba fica na URL', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana', 'Ana Souza');
    for (const [rotulo, caminho] of [['Feriados', 'feriados'], ['Substituto', 'substituto'], ['Exceções', 'excecoes'], ['Férias', 'ferias']] as const) {
      await user.click(p.getByRole('tab', { name: rotulo }));
      await waitFor(() => expect(local()).toBe(`/usuarios/u-ana/${caminho}`));
      expect(p.getByRole('tab', { name: rotulo })).toHaveAttribute('aria-selected', 'true');
    }
    await user.click(p.getByRole('tab', { name: 'Dados' }));
    await waitFor(() => expect(local()).toBe('/usuarios/u-ana'));
  });

  it('abre direto numa aba pelo endereço e aba inválida volta para Dados', async () => {
    const { p } = await abrirDetalhe('/usuarios/u-ana/ferias', 'Ana Souza');
    expect(p.getByRole('tab', { name: 'Férias' })).toHaveAttribute('aria-selected', 'true');
  });

  it('aba inexistente na URL cai em Dados', async () => {
    const { p } = await abrirDetalhe('/usuarios/u-ana/xyz', 'Ana Souza');
    expect(p.getByRole('tab', { name: 'Dados' })).toHaveAttribute('aria-selected', 'true');
    expect(local()).toBe('/usuarios/u-ana');
  });

  it('usuário inexistente mostra a mensagem e "Voltar"', async () => {
    const { user } = renderApp('/usuarios/nao-existe?tamanho=10');
    const p = within(await painel('Usuário'));
    expect(await p.findByRole('alert')).toHaveTextContent('Este usuário não existe ou foi removido.');
    await user.click(p.getByRole('button', { name: 'Voltar' }));
    await waitFor(() => expect(local()).toBe('/usuarios?tamanho=10'));
  });

  it('Esc fecha o painel e devolve o foco ao link da linha', async () => {
    const { user } = await abrirLista();
    const link = screen.getByRole('link', { name: 'Ana Souza' });
    await user.click(link);
    await painel('Ana Souza');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(local()).toBe('/usuarios'));
    await waitFor(() => expect(link).toHaveFocus());
  });
});

describe('Detalhe: aba Dados', () => {
  it('salva com sucesso, mostra o aviso e mantém o painel aberto', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana', 'Ana Souza');
    digitar(p.getByLabelText(/E-mail/), 'ana.nova@scua.com.br');
    digitar(p.getByLabelText('WhatsApp'), '(11) 91234-5678');
    await user.click(p.getByRole('switch', { name: 'Administrador' }));
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Dados de Ana Souza salvos.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Ana Souza' })).toBeInTheDocument();
    expect(local()).toBe('/usuarios/u-ana');
    expect((await api.obterUsuario('u-ana'))?.permissoes.administrador).toBe(true);
    // Depois de salvar não há mais alterações pendentes: fechar não pede confirmação.
    await user.keyboard('{Escape}');
    await waitFor(() => expect(local()).toBe('/usuarios'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('o campo Grupo define o limite de extensão da pessoa', async () => {
    const { grupoDaPessoa, grupos } = await import('../../../mock/grupos');
    const { user, p } = await abrirDetalhe('/usuarios/u-ana', 'Ana Souza');
    const campo = await p.findByRole('combobox', { name: /Grupo/ });
    await waitFor(() => expect(campo).toHaveTextContent('Comercial'));
    await escolher(user, campo, 'Operações');
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    await screen.findByText('Dados de Ana Souza salvos.');
    const operacoes = (await grupos.listar()).find((g) => g.nome === 'Operações')!;
    expect(grupoDaPessoa('u-ana')).toBe(operacoes.id);
    await escolher(user, p.getByRole('combobox', { name: /Grupo/ }), 'Sem grupo');
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(grupoDaPessoa('u-ana')).toBeNull());
  });

  it('troca gestor, departamento e jornada e a lista mostra os novos valores', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana', 'Ana Souza');
    await escolher(user, p.getByRole('combobox', { name: /Gestor/ }), 'Olga Prado');
    await escolher(user, p.getByRole('combobox', { name: /Departamento/ }), 'Fiscal');
    await escolher(user, p.getByRole('combobox', { name: /Jornada/ }), 'TURNO-A');
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    await screen.findByText('Dados de Ana Souza salvos.');
    await user.keyboard('{Escape}');
    const linha = (await screen.findByRole('link', { name: 'Ana Souza' })).closest('tr')!;
    await waitFor(() => expect(within(linha).getByText('TURNO-A')).toBeInTheDocument());
    expect(within(linha).getByText('Olga Prado')).toBeInTheDocument();
    expect(within(linha).getByText('Fiscal')).toBeInTheDocument();
  });

  it('valida no envio e leva o foco ao primeiro campo com problema', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana', 'Ana Souza');
    digitar(p.getByLabelText(/E-mail/), 'isso-nao-e-email');
    digitar(p.getByLabelText('WhatsApp'), 'abc');
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await p.findByText(/Informe um e-mail válido/)).toBeInTheDocument();
    expect(p.getByText(/Informe o WhatsApp com DDD/)).toBeInTheDocument();
    await waitFor(() => expect(p.getByLabelText(/E-mail/)).toHaveFocus());
    expect(screen.queryByText('Dados de Ana Souza salvos.')).not.toBeInTheDocument();
  });

  it('erro ao salvar preserva os dados e leva o foco ao aviso', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana', 'Ana Souza');
    digitar(p.getByLabelText(/E-mail/), 'outra@scua.com.br');
    definirFalhaDeRede(true);
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    const aviso = await p.findByRole('alert');
    expect(aviso).toHaveTextContent('Não conseguimos salvar. O que você preencheu continua aqui.');
    await waitFor(() => expect(aviso).toHaveFocus());
    expect(p.getByLabelText(/E-mail/)).toHaveValue('outra@scua.com.br');
  });

  it('sair com alterações não salvas pede confirmação, e dá para continuar editando', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana', 'Ana Souza');
    digitar(p.getByLabelText(/E-mail/), 'mudou@scua.com.br');
    await user.keyboard('{Escape}');
    const dialogo = within(await screen.findByRole('alertdialog'));
    expect(dialogo.getByText('Descartar as alterações?')).toBeInTheDocument();
    await user.click(dialogo.getByRole('button', { name: 'Continuar editando' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(local()).toBe('/usuarios/u-ana');
    expect(p.getByLabelText(/E-mail/)).toHaveValue('mudou@scua.com.br');

    await user.click(p.getByRole('button', { name: 'Voltar à lista' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Descartar alterações' }));
    await waitFor(() => expect(local()).toBe('/usuarios'));
    expect((await api.obterUsuario('u-ana'))?.email).toBe('ana.souza@scua.com.br');
  });

  it('trocar de aba com alterações não salvas também pede confirmação', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana', 'Ana Souza');
    digitar(p.getByLabelText(/E-mail/), 'mudou@scua.com.br');
    await user.click(p.getByRole('tab', { name: 'Feriados' }));
    const dialogo = within(await screen.findByRole('alertdialog'));
    await user.click(dialogo.getByRole('button', { name: 'Descartar alterações' }));
    await waitFor(() => expect(local()).toBe('/usuarios/u-ana/feriados'));
  });
});

describe('Detalhe: aba Feriados', () => {
  it('marca um calendário e salva', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-joao/feriados', 'João Lima');
    expect(p.getByRole('checkbox', { name: 'Nacional' })).toBeChecked();
    expect(p.getByRole('checkbox', { name: 'Municipal' })).not.toBeChecked();
    await user.click(p.getByRole('checkbox', { name: 'Municipal' }));
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Feriados de João Lima salvos.')).toBeInTheDocument();
    expect((await api.obterUsuario('u-joao'))?.feriados).toContain('municipal');
  });
});

describe('Detalhe: aba Substituto', () => {
  it('mostra o resumo do substituto e remove com confirmação', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-carlos/substituto', 'Carlos Mendes');
    expect(p.getByText('Olga Prado aprova no lugar de Carlos Mendes de 20/10 a 31/10')).toBeInTheDocument();
    await user.click(p.getByRole('button', { name: 'Remover substituto' }));
    const dialogo = within(await screen.findByRole('alertdialog'));
    await user.click(dialogo.getByRole('button', { name: 'Cancelar' }));
    expect(p.getByText(/Olga Prado aprova no lugar/)).toBeInTheDocument();

    await user.click(p.getByRole('button', { name: 'Remover substituto' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remover substituto' }));
    expect(await screen.findByText('Substituto de Carlos Mendes removido.')).toBeInTheDocument();
    expect(await p.findByText('Nenhum substituto definido')).toBeInTheDocument();
    expect((await api.obterUsuario('u-carlos'))?.substituto).toBeNull();
  });

  it('sem substituto explica para que serve; a própria pessoa não aparece na lista; fim antes do início é recusado', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana/substituto', 'Ana Souza');
    expect(p.getByText('Nenhum substituto definido')).toBeInTheDocument();
    expect(p.getByText(/aprova os pedidos de extensão no lugar de Ana Souza/)).toBeInTheDocument();

    await user.click(p.getByRole('combobox', { name: /Quem aprova no lugar/ }));
    expect(screen.queryByRole('option', { name: 'Ana Souza' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('option', { name: 'Olga Prado' }));
    digitar(p.getByLabelText('De *'), '2026-10-16');
    digitar(p.getByLabelText('Até *'), '2026-10-14');
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await p.findByText('O fim não pode ser antes do início')).toBeInTheDocument();

    digitar(p.getByLabelText('Até *'), '2026-10-20');
    await user.click(p.getByRole('button', { name: 'Salvar' }));
    expect(await p.findByText('Olga Prado aprova no lugar de Ana Souza de 16/10 a 20/10')).toBeInTheDocument();
  });
});

describe('Detalhe: aba Exceções', () => {
  it('lista as exceções com data, horário e motivo', async () => {
    const { p } = await abrirDetalhe('/usuarios/u-ana/excecoes', 'Ana Souza');
    const lista = within(p.getByRole('list', { name: 'Exceções de jornada' }));
    const itens = lista.getAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent('14/10 · 10:00–16:00');
    expect(itens[0]).toHaveTextContent('Consulta médica');
  });

  it('sem exceções mostra o estado vazio', async () => {
    const { p } = await abrirDetalhe('/usuarios/u-bia/excecoes', 'Bia Rocha');
    expect(p.getByText('Nenhuma exceção de jornada')).toBeInTheDocument();
    expect(p.getByRole('button', { name: 'Adicionar exceção' })).toBeInTheDocument();
  });

  it('valida data passada, saída antes da entrada e motivo vazio', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-bia/excecoes', 'Bia Rocha');
    await user.click(p.getByRole('button', { name: 'Adicionar exceção' }));
    digitar(p.getByLabelText('Data *'), '2026-10-01');
    digitar(p.getByLabelText('Entrada *'), '10:00');
    digitar(p.getByLabelText('Saída *'), '09:00');
    await user.click(p.getByRole('button', { name: 'Salvar exceção' }));
    expect(await p.findByText('A data não pode ser anterior a hoje')).toBeInTheDocument();
    expect(p.getByText('A saída precisa ser depois da entrada')).toBeInTheDocument();
    expect(p.getByText('Informe o motivo')).toBeInTheDocument();
    await waitFor(() => expect(p.getByLabelText('Data *')).toHaveFocus());
  });

  it('adiciona uma exceção e remove com confirmação', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-bia/excecoes', 'Bia Rocha');
    await user.click(p.getByRole('button', { name: 'Adicionar exceção' }));
    digitar(p.getByLabelText('Data *'), '2026-10-15');
    digitar(p.getByLabelText('Entrada *'), '09:00');
    digitar(p.getByLabelText('Saída *'), '15:00');
    digitar(p.getByLabelText('Motivo *'), 'Reunião com cliente');
    await user.click(p.getByRole('button', { name: 'Salvar exceção' }));
    expect(await screen.findByText('Exceção de 15/10 adicionada.')).toBeInTheDocument();
    const lista = within(await p.findByRole('list', { name: 'Exceções de jornada' }));
    expect(lista.getByText('15/10 · 09:00–15:00')).toBeInTheDocument();

    await user.click(p.getByRole('button', { name: 'Remover exceção de 15/10' }));
    const dialogo = within(await screen.findByRole('alertdialog'));
    expect(dialogo.getByText('Remover a exceção de 15/10?')).toBeInTheDocument();
    await user.click(dialogo.getByRole('button', { name: 'Cancelar' }));
    expect(p.getByText('15/10 · 09:00–15:00')).toBeInTheDocument();
    await user.click(p.getByRole('button', { name: 'Remover exceção de 15/10' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remover' }));
    expect(await screen.findByText('Exceção de 15/10 removida.')).toBeInTheDocument();
    expect(await p.findByText('Nenhuma exceção de jornada')).toBeInTheDocument();
  });
});

describe('Detalhe: aba Férias', () => {
  it('lista os períodos e mostra o vazio de quem não tem', async () => {
    const { p } = await abrirDetalhe('/usuarios/u-ana/ferias', 'Ana Souza');
    expect(within(p.getByRole('list', { name: 'Períodos de férias' })).getByText('11/11 a 25/11')).toBeInTheDocument();
  });

  it('sem férias mostra o estado vazio', async () => {
    const { p } = await abrirDetalhe('/usuarios/u-bia/ferias', 'Bia Rocha');
    expect(p.getByText('Nenhum período de férias')).toBeInTheDocument();
  });

  it('recusa fim antes do início e período que se sobrepõe a outro da mesma pessoa', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana/ferias', 'Ana Souza');
    await user.click(p.getByRole('button', { name: 'Adicionar férias' }));
    digitar(p.getByLabelText('Início *'), '2026-12-10');
    digitar(p.getByLabelText('Fim *'), '2026-12-01');
    await user.click(p.getByRole('button', { name: 'Salvar férias' }));
    expect(await p.findByText('O fim não pode ser antes do início')).toBeInTheDocument();

    digitar(p.getByLabelText('Início *'), '2026-11-20');
    digitar(p.getByLabelText('Fim *'), '2026-12-05');
    await user.click(p.getByRole('button', { name: 'Salvar férias' }));
    expect(await p.findByText('Este período se sobrepõe às férias de 11/11 a 25/11')).toBeInTheDocument();
    expect(screen.queryByText(/Férias de .* adicionadas/)).not.toBeInTheDocument();
  });

  it('adiciona um período que começa logo depois do outro e remove com confirmação', async () => {
    const { user, p } = await abrirDetalhe('/usuarios/u-ana/ferias', 'Ana Souza');
    await user.click(p.getByRole('button', { name: 'Adicionar férias' }));
    digitar(p.getByLabelText('Início *'), '2026-11-26');
    digitar(p.getByLabelText('Fim *'), '2026-11-30');
    await user.click(p.getByRole('button', { name: 'Salvar férias' }));
    expect(await screen.findByText('Férias de 26/11 a 30/11 adicionadas.')).toBeInTheDocument();
    expect(await p.findByText('26/11 a 30/11')).toBeInTheDocument();

    await user.click(p.getByRole('button', { name: 'Remover férias de 26/11 a 30/11' }));
    const dialogo = within(await screen.findByRole('alertdialog'));
    expect(dialogo.getByText('Remover as férias de 26/11 a 30/11?')).toBeInTheDocument();
    await user.click(dialogo.getByRole('button', { name: 'Remover' }));
    expect(await screen.findByText('Férias de 26/11 a 30/11 removidas.')).toBeInTheDocument();
    await waitFor(() => expect(p.queryByText('26/11 a 30/11')).not.toBeInTheDocument());
    expect(p.getByText('11/11 a 25/11')).toBeInTheDocument();
  });
});
