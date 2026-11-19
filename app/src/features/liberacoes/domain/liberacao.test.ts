import { describe, expect, it } from 'vitest';
import { conflitoDaLiberacao, formatarHorario, formatarPeriodo, situacaoDaLiberacao, sobrepoe, validarPeriodo, type DadosLiberacao } from './liberacao';

const base: DadosLiberacao = { diretoria: 'Comercial', area: '', de: '2026-10-10', ate: '2026-10-20', horaDe: '', horaAte: '', motivo: 'x' };
const com = (p: Partial<DadosLiberacao>): DadosLiberacao => ({ ...base, ...p });

describe('situacaoDaLiberacao', () => {
  const hoje = '2026-10-12';
  it('em vigor no meio do período', () => expect(situacaoDaLiberacao(base, hoje)).toBe('em-vigor'));
  it('em vigor no primeiro e no último dia', () => {
    expect(situacaoDaLiberacao(com({ de: hoje }), hoje)).toBe('em-vigor');
    expect(situacaoDaLiberacao(com({ ate: hoje }), hoje)).toBe('em-vigor');
  });
  it('agendada antes do início', () => expect(situacaoDaLiberacao(com({ de: '2026-10-13' }), hoje)).toBe('agendada'));
  it('encerrada depois do fim', () => expect(situacaoDaLiberacao(com({ ate: '2026-10-11' }), hoje)).toBe('encerrada'));
});

describe('formatação', () => {
  it('período', () => expect(formatarPeriodo('2026-10-12', '2026-11-03')).toBe('12/10 a 03/11/2026'));
  it('período inválido', () => expect(formatarPeriodo('', '2026-11-03')).toBe('—'));
  it('horário', () => {
    expect(formatarHorario('', '')).toBe('O dia todo');
    expect(formatarHorario('08:00', '12:00')).toBe('08:00 às 12:00');
  });
});

describe('sobrepoe', () => {
  it('sobrepõe com dias que se cruzam na mesma diretoria e área', () => expect(sobrepoe(base, com({ de: '2026-10-20', ate: '2026-10-25' }))).toBe(true));
  it('não sobrepõe com dias separados', () => expect(sobrepoe(base, com({ de: '2026-10-21', ate: '2026-10-25' }))).toBe(false));
  it('diretorias diferentes não conflitam', () => expect(sobrepoe(base, com({ diretoria: 'Financeiro' }))).toBe(false));
  it('áreas diferentes não conflitam; mesma área ignora caixa', () => {
    expect(sobrepoe(com({ area: 'Vendas' }), com({ area: 'Logística' }))).toBe(false);
    expect(sobrepoe(com({ area: 'Vendas' }), com({ area: ' vendas ' }))).toBe(true);
  });
  it('mesmo dia com horários que não se cruzam não conflita', () => {
    expect(sobrepoe(com({ horaDe: '08:00', horaAte: '12:00' }), com({ horaDe: '12:00', horaAte: '18:00' }))).toBe(false);
    expect(sobrepoe(com({ horaDe: '08:00', horaAte: '12:00' }), com({ horaDe: '11:00', horaAte: '18:00' }))).toBe(true);
  });
  it('dia todo cruza com qualquer horário', () => expect(sobrepoe(base, com({ horaDe: '08:00', horaAte: '09:00' }))).toBe(true));
});

describe('conflitoDaLiberacao', () => {
  it('devolve texto amigável e ignora o próprio item', () => {
    const existentes = [{ ...base, id: 'a' }];
    expect(conflitoDaLiberacao(base, existentes)).toBe('Já existe uma liberação para Comercial (toda a diretoria) em 10/10 a 20/10/2026. Ajuste as datas ou os horários.');
    expect(conflitoDaLiberacao(base, existentes, 'a')).toBeUndefined();
  });
  it('cita a área quando existe', () => {
    expect(conflitoDaLiberacao(com({ area: 'Vendas' }), [{ ...com({ area: 'Vendas' }), id: 'a' }])).toContain('área Vendas');
  });
});

describe('validarPeriodo', () => {
  it('sem erro quando tudo está certo', () => expect(validarPeriodo(base)).toEqual({}));
  it('fim antes do início', () => expect(validarPeriodo(com({ ate: '2026-10-01' })).ate).toBeDefined());
  it('um horário sem o outro', () => {
    expect(validarPeriodo(com({ horaDe: '08:00' })).horaAte).toBeDefined();
    expect(validarPeriodo(com({ horaAte: '08:00' })).horaDe).toBeDefined();
  });
  it('horário final não depois do inicial', () => expect(validarPeriodo(com({ horaDe: '10:00', horaAte: '10:00' })).horaAte).toBeDefined());
});
