import { describe, expect, it } from 'vitest';
import { abasPermitidas, ehAba } from './abas';
import type { Permissoes } from './types';

const base: Permissoes = { usuario: { id: 'u', nome: 'U' }, podePedir: false, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: false, podeVerRelatorios: false, podeGerirPessoas: false, podeAdministrar: false };

describe('abasPermitidas', () => {
  it('gestor', () => expect(abasPermitidas({ ...base, podePedir: true, podeAprovar: true })).toEqual(['aprovar', 'meus']));
  it('colaborador', () => expect(abasPermitidas({ ...base, podePedir: true })).toEqual(['meus']));
  it('RH', () => expect(abasPermitidas({ ...base, podeVerTodos: true })).toEqual(['todos']));
  it('ninguém', () => expect(abasPermitidas(base)).toEqual([]));
});

it('ehAba', () => {
  expect(ehAba('meus')).toBe(true);
  expect(ehAba('xyz')).toBe(false);
  expect(ehAba(undefined)).toBe(false);
});
