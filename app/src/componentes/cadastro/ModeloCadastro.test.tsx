import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localidadesPorIp as localidades } from '../../features/configuracoes/cadastros/localidades-por-ip';
import { perfisDePausas } from '../../features/pausas/api';
import { renderApp } from '../../test/render';
import { validarCadastro } from './ModeloCadastro';
import type { CampoCadastro } from './tipos';

interface Item { id: string; nome: string; minutos: number | ''; tipo: string; ativo: boolean }

const campos: CampoCadastro<Item>[] = [
  { tipo: 'texto', chave: 'nome', rotulo: 'Nome', obrigatorio: true, maximo: 10 },
  { tipo: 'numero', chave: 'minutos', rotulo: 'Minutos', obrigatorio: true, minimo: 1, maximo: 60 },
  { tipo: 'select', chave: 'tipo', rotulo: 'Tipo', obrigatorio: true, opcoes: [{ value: 'a', label: 'A' }] },
  { tipo: 'alternar', chave: 'ativo', rotulo: 'Ativo' },
];

describe('validarCadastro', () => {
  it('aponta obrigatórios vazios com o texto de cada tipo de campo', () => {
    expect(validarCadastro({ campos }, { nome: '  ', minutos: '', tipo: '', ativo: false })).toEqual({
      nome: 'Informe nome', minutos: 'Informe minutos', tipo: 'Escolha tipo',
    });
  });

  it('respeita limites de número e de tamanho, e aceita o que está certo', () => {
    expect(validarCadastro({ campos }, { nome: 'Nome comprido demais', minutos: 0, tipo: 'a', ativo: true })).toEqual({
      nome: 'Use no máximo 10 caracteres', minutos: 'O mínimo é 1',
    });
    expect(validarCadastro({ campos }, { nome: 'Ok', minutos: 61, tipo: 'a', ativo: true })).toEqual({ minutos: 'O máximo é 60' });
    expect(validarCadastro({ campos }, { nome: 'Ok', minutos: 30, tipo: 'a', ativo: true })).toEqual({});
  });

  it('as regras próprias do cadastro entram junto', () => {
    const validar = (d: Omit<Item, 'id'>) => (d.nome === 'x' ? { nome: 'Nome reservado' } : {});
    expect(validarCadastro({ campos, validar }, { nome: 'x', minutos: 5, tipo: 'a', ativo: true })).toEqual({ nome: 'Nome reservado' });
  });
});

describe('modelo de cadastro: coluna de ações', () => {
  it('é a última e não mostra texto no cabeçalho, mas tem nome para leitor de tela', async () => {
    renderApp('/configuracoes/parametros');
    await screen.findAllByRole('button', { name: /^Editar / }, { timeout: 20_000 });
    const cabecalhos = screen.getAllByRole('columnheader');
    const ultimo = cabecalhos.at(-1)!;
    expect(ultimo).toHaveTextContent('Ações');
    expect(ultimo.querySelector('.sr-only')).toHaveTextContent('Ações');
  });
});

describe('modelo de cadastro: paginação', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => localidades.resetar());

  it('depois de salvar um item da página 2, a lista continua na página 2', async () => {
    const { user } = renderApp('/configuracoes/localidades-por-ip');
    expect(await screen.findByText('Mostrando 1 a 10 de 18')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(screen.getByText('Mostrando 11 a 18 de 18')).toBeInTheDocument();
    const editar = screen.getAllByRole('button', { name: /^Editar / })[0];
    await user.click(editar);
    const painel = within(await screen.findByRole('dialog', { name: 'Editar localidade' }));
    await user.type(painel.getByLabelText('Localidade *'), ' (novo)');
    await user.click(painel.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar localidade' })).not.toBeInTheDocument());
    await screen.findByText(/\(novo\)/);
    expect(screen.getByText('Mostrando 11 a 18 de 18')).toBeInTheDocument();
  });
});

describe('modelo de cadastro no celular', () => {
  const original = window.matchMedia;
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Simula uma tela de celular: a consulta "(max-width: 767px)" passa a casar.
    window.matchMedia = ((consulta: string) => ({
      matches: consulta.includes('max-width: 767px'),
      media: consulta,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  });
  afterEach(() => {
    window.matchMedia = original;
    perfisDePausas.resetar();
  });

  it('mostra cartões com Editar e Excluir à vista, em vez da tabela', async () => {
    const { user } = renderApp('/pausas');
    const lista = await screen.findByRole('list', { name: 'Pausas' });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const cartoes = within(lista).getAllByRole('listitem');
    expect(cartoes).toHaveLength(3);
    expect(cartoes[0]).toHaveTextContent('Pausas Comercial');
    expect(screen.getByText('Mostrando 3 de 3')).toBeInTheDocument();

    await user.click(within(cartoes[0]).getByRole('button', { name: 'Editar Pausas Comercial' }));
    expect(await screen.findByRole('dialog', { name: 'Editar perfil de pausas' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(within(cartoes[1]).getByRole('button', { name: 'Excluir Pausas Suporte' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Pausas' })).getAllByRole('listitem')).toHaveLength(2));
  });
});
