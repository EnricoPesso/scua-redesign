import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../mock/rede';
import { renderApp } from '../../test/render';
import { AREAS, CONFIGURACOES } from './catalogo';
import { dominios } from './cadastros/dominios';
import { feriados } from './cadastros/feriados';
import { grupos } from './cadastros/grupos';
import { localidadesPorIp } from './cadastros/localidades-por-ip';
import { notificacoes } from './cadastros/notificacoes';
import { parametros } from './cadastros/parametros';
import { templatesWhatsapp } from './cadastros/templates-whatsapp';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  definirFalhaDeRede(false);
  for (const c of [grupos, localidadesPorIp, parametros, notificacoes, dominios, feriados, templatesWhatsapp]) c.resetar();
});

const dialogo = () => screen.findByRole('dialog');

describe('Página de entrada', () => {
  it('mostra as 3 áreas e os 12 links', async () => {
    renderApp('/configuracoes');
    expect(await screen.findByRole('heading', { level: 1, name: 'Configurações' })).toBeInTheDocument();
    for (const a of AREAS) expect(screen.getByRole('heading', { level: 2, name: a.titulo })).toBeInTheDocument();
    for (const c of CONFIGURACOES) {
      const link = screen.getByRole('link', { name: `${c.titulo}${c.resumo}` });
      expect(link).toHaveAttribute('href', `/configuracoes/${c.slug}`);
    }
    expect(CONFIGURACOES).toHaveLength(12);
  });

  it('slug desconhecido mostra "não encontrada"', async () => {
    renderApp('/configuracoes/nao-existe');
    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent('Configurações');
  });
});

describe.each(CONFIGURACOES)('Tela $titulo', ({ slug, titulo, area }) => {
  it('abre com o título do catálogo, trilha e linhas, sem código técnico', async () => {
    renderApp(`/configuracoes/${slug}`);
    expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
    const tabela = await screen.findByRole('table', { name: titulo });
    await waitFor(() => expect(within(tabela).getAllByRole('row').length).toBeGreaterThan(1));
    const linhas = within(tabela).getAllByRole('row').slice(1);
    expect(linhas.length).toBeGreaterThan(0);
    expect(linhas[0]).not.toHaveTextContent(/Carregando|Nenhum/);
    expect(document.body).not.toHaveTextContent('EVT_');
    const trilha = screen.getByRole('navigation', { name: 'Trilha' });
    expect(within(trilha).getByRole('link', { name: 'Configurações' })).toHaveAttribute('href', '/configuracoes');
    expect(trilha).toHaveTextContent(AREAS.find((a) => a.id === area)!.titulo);
  });
});

describe('Grupos: fluxo completo', () => {
  it('valida obrigatório com foco, recusa duplicado e adiciona', async () => {
    const { user } = renderApp('/configuracoes/grupos');
    await screen.findByText('Comercial');
    await user.click(screen.getByRole('button', { name: 'Adicionar grupo' }));
    const painel = await dialogo();
    expect(within(painel).getByRole('heading', { name: 'Novo grupo' })).toBeInTheDocument();

    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('Informe nome')).toBeInTheDocument();
    expect(within(painel).getByLabelText(/^Nome/)).toHaveFocus();

    await user.type(within(painel).getByLabelText(/^Nome/), 'comercial');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('Já existe um grupo com esse nome.')).toBeInTheDocument();
    expect(within(painel).getByLabelText(/^Nome/)).toHaveValue('comercial');

    await user.clear(within(painel).getByLabelText(/^Nome/));
    await user.type(within(painel).getByLabelText(/^Nome/), 'Jurídico');
    await user.type(within(painel).getByLabelText(/Limite mensal/), '12');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Grupo Jurídico adicionado.')).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Jurídico' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '12 h' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('abre a edição pelo link ?editar e mostra "Sem limite" quando o limite é vazio', async () => {
    const { user } = renderApp('/configuracoes/grupos?editar=grp-1');
    const painel = await dialogo();
    expect(within(painel).getByRole('heading', { name: 'Editar grupo' })).toBeInTheDocument();
    expect(within(painel).getByLabelText(/^Nome/)).toHaveValue('Comercial');
    await user.clear(within(painel).getByLabelText(/Limite mensal/));
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Grupo Comercial atualizado.')).toBeInTheDocument();
    const linha = (await screen.findByRole('cell', { name: 'Comercial' })).closest('tr')!;
    expect(linha).toHaveTextContent('Sem limite');
    expect(linha).toHaveTextContent('6');
  });

  it('exclui com confirmação, avisando o que acontece com as pessoas', async () => {
    const { user } = renderApp('/configuracoes/grupos');
    await user.click(await screen.findByRole('button', { name: 'Excluir Financeiro' }));
    const confirmacao = await screen.findByRole('alertdialog');
    expect(confirmacao).toHaveTextContent('Excluir o grupo Financeiro?');
    expect(confirmacao).toHaveTextContent('As pessoas deste grupo ficam sem grupo.');
    await user.click(within(confirmacao).getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('cell', { name: 'Financeiro' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir Financeiro' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Excluir' }));
    expect(await screen.findByText('Grupo Financeiro excluído.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('cell', { name: 'Financeiro' })).not.toBeInTheDocument());
  });

  it('erro ao carregar mostra aviso amigável e "Tentar de novo"', async () => {
    definirFalhaDeRede(true);
    const { user } = renderApp('/configuracoes/grupos');
    expect(await screen.findByText('Não conseguimos carregar os dados')).toBeInTheDocument();
    definirFalhaDeRede(false);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Comercial')).toBeInTheDocument();
  });
});

describe('Localidades por IP: fluxo completo', () => {
  it('pagina a lista, busca sem resultado e limpa a busca', async () => {
    const { user } = renderApp('/configuracoes/localidades-por-ip');
    await screen.findByText('Matriz, andar 1');
    expect(screen.getByText('Mostrando 1 a 10 de 18')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'zzzz');
    expect(await screen.findByText(/Nenhum resultado para “zzzz”/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(await screen.findByText('Matriz, andar 1')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('');
  });

  it('valida o endereço IP e a faixa repetida, e adiciona', async () => {
    const { user } = renderApp('/configuracoes/localidades-por-ip');
    await user.click(await screen.findByRole('button', { name: 'Adicionar localidade' }, { timeout: 10_000 }));
    const painel = await dialogo();
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('Informe localidade')).toBeInTheDocument();
    expect(within(painel).getByLabelText(/^Localidade/)).toHaveFocus();

    await user.type(within(painel).getByLabelText(/^Localidade/), 'Filial Manaus');
    await user.type(within(painel).getByLabelText(/^Endereço de rede/), '10.300.0.0');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('Cada número do endereço vai de 0 a 255')).toBeInTheDocument();
    expect(within(painel).getByLabelText(/^Endereço de rede/)).toHaveFocus();

    await user.clear(within(painel).getByLabelText(/^Endereço de rede/));
    await user.type(within(painel).getByLabelText(/^Endereço de rede/), '10.30.0.0');
    await user.clear(within(painel).getByLabelText(/^Localidade/));
    await user.type(within(painel).getByLabelText(/^Localidade/), 'Filial Manaus');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    // Máscara padrão /24: 10.30.0.0/24 não existe (a existente é /22), então salva.
    expect(await screen.findByText('Localidade Filial Manaus adicionada.')).toBeInTheDocument();
  }, 30_000);

  it('edita pelo link ?editar e a falha de salvar não perde o que foi digitado', async () => {
    const { user } = renderApp('/configuracoes/localidades-por-ip?editar=ip-1');
    const painel = await dialogo();
    expect(within(painel).getByLabelText(/^Localidade/)).toHaveValue('Matriz, andar 1');
    await user.clear(within(painel).getByLabelText(/^Localidade/));
    await user.type(within(painel).getByLabelText(/^Localidade/), 'Matriz, térreo');
    definirFalhaDeRede(true);
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await within(painel).findByText('Não conseguimos salvar. O que você preencheu continua aqui.')).toBeInTheDocument();
    expect(within(painel).getByLabelText(/^Localidade/)).toHaveValue('Matriz, térreo');
    definirFalhaDeRede(false);
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Localidade Matriz, térreo atualizada.')).toBeInTheDocument();
  });
});

describe('Listas fixas', () => {
  it('Parâmetros: sem adicionar nem excluir, só editar o valor', async () => {
    const { user } = renderApp('/configuracoes/parametros');
    await screen.findByText('Tolerância de entrada (minutos)');
    expect(screen.queryByRole('button', { name: /^Adicionar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Excluir/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar Tolerância de entrada (minutos)' }));
    const painel = await dialogo();
    expect(within(painel).getByLabelText(/^Parâmetro/)).toBeDisabled();
    await user.clear(within(painel).getByLabelText(/^Valor/));
    await user.type(within(painel).getByLabelText(/^Valor/), '15');
    await user.click(within(painel).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Parâmetro Tolerância de entrada (minutos) atualizado.')).toBeInTheDocument();
  });

  it('Notificações: sem adicionar nem excluir, canais com Sim/Não', async () => {
    renderApp('/configuracoes/notificacoes');
    const celula = await screen.findByRole('cell', { name: 'Usuário bloqueado no domínio' });
    expect(screen.queryByRole('button', { name: /^Adicionar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Excluir/ })).not.toBeInTheDocument();
    expect(within(celula.closest('tr')!).getAllByText(/^(Sim|Não)$/)).toHaveLength(3);
    // As duas descrições que estavam invertidas no sistema atual agora estão certas.
    expect(screen.getByText(/foi bloqueado \(desabilitado\)/)).toBeInTheDocument();
    expect(screen.getByText(/foi desbloqueado \(habilitado\)/)).toBeInTheDocument();
  });

  it('?novo=1 não abre painel em lista fixa', async () => {
    renderApp('/configuracoes/parametros?novo=1');
    await screen.findByText('Tolerância de entrada (minutos)');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
