import { describe, expect, it } from 'vitest';
import { JUSTIFICATIVA_OUTRA } from './types';
import { validarPedido, type FormPedido } from './validacao';

const HOJE = '2026-10-12';
const valido: FormPedido = {
  paraQuem: 'mim', beneficiarioId: '', dataInicial: '2026-10-13', dataFinal: '2026-10-15',
  inicio: '18:00', fim: '20:00', justificativaCodigo: '3', detalhes: '',
};

describe('validarPedido', () => {
  it('formulário completo não tem erro', () => expect(validarPedido(valido, HOJE)).toEqual({}));
  it('último dia vazio é permitido', () => expect(validarPedido({ ...valido, dataFinal: '' }, HOJE)).toEqual({}));
  it('hoje é permitido', () => expect(validarPedido({ ...valido, dataInicial: HOJE, dataFinal: '' }, HOJE)).toEqual({}));
  it('"para mim" ignora o beneficiário', () => expect(validarPedido({ ...valido, beneficiarioId: '' }, HOJE).beneficiarioId).toBeUndefined());
  it('"para outra pessoa" exige escolher', () =>
    expect(validarPedido({ ...valido, paraQuem: 'outro' }, HOJE).beneficiarioId).toBe('Escolha para quem é a extensão'));
  it('exige o primeiro dia', () => expect(validarPedido({ ...valido, dataInicial: '' }, HOJE).dataInicial).toBe('Informe o primeiro dia'));
  it('recusa data impossível', () => expect(validarPedido({ ...valido, dataInicial: '2026-02-30' }, HOJE).dataInicial).toBe('Data inválida'));
  it('recusa passado', () =>
    expect(validarPedido({ ...valido, dataInicial: '2026-10-10' }, HOJE).dataInicial).toBe('A data não pode estar no passado'));
  it('último dia antes do primeiro', () =>
    expect(validarPedido({ ...valido, dataFinal: '2026-10-12' }, HOJE).dataFinal).toBe('O último dia precisa ser igual ou depois do primeiro'));
  it('exige início e fim', () => {
    const e = validarPedido({ ...valido, inicio: '', fim: '' }, HOJE);
    expect(e.inicio).toBe('Informe o horário de início');
    expect(e.fim).toBe('Informe o horário de fim');
  });
  it('fim precisa ser depois do início', () =>
    expect(validarPedido({ ...valido, inicio: '20:00', fim: '18:00' }, HOJE).fim).toBe('A hora final precisa ser depois da inicial'));
  it('exige motivo', () => expect(validarPedido({ ...valido, justificativaCodigo: '' }, HOJE).justificativaCodigo).toBe('Escolha um motivo'));
  it('"Outra" exige detalhes', () =>
    expect(validarPedido({ ...valido, justificativaCodigo: JUSTIFICATIVA_OUTRA, detalhes: '   ' }, HOJE).detalhes).toBe('Descreva o motivo'));
  it('detalhes com mais de 500 caracteres', () =>
    expect(validarPedido({ ...valido, detalhes: 'a'.repeat(501) }, HOJE).detalhes).toBe('Use no máximo 500 caracteres'));
});
