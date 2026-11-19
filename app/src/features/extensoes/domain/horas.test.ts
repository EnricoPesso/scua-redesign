import { describe, expect, it } from 'vitest';
import { contarDias, ehDataValida, formatarDuracao, minutosPorDia, paraMinutos, totalMinutos } from './horas';

describe('contarDias', () => {
  it('conta os dois extremos', () => expect(contarDias('2026-10-13', '2026-10-15')).toBe(3));
  it('data final vazia é um dia só', () => expect(contarDias('2026-10-13', '')).toBe(1));
  it('mesmo dia é um dia', () => expect(contarDias('2026-10-13', '2026-10-13')).toBe(1));
  it('atravessa o mês', () => expect(contarDias('2026-09-30', '2026-10-02')).toBe(3));
  it('final antes do início é 0', () => expect(contarDias('2026-10-15', '2026-10-13')).toBe(0));
  it('data impossível é 0', () => expect(contarDias('2026-02-30', '')).toBe(0));
  it('data vazia é 0', () => expect(contarDias('', '')).toBe(0));
});

describe('ehDataValida', () => {
  it('aceita data real', () => expect(ehDataValida('2026-10-12')).toBe(true));
  it('recusa 30 de fevereiro', () => expect(ehDataValida('2026-02-30')).toBe(false));
  it('recusa formato errado', () => expect(ehDataValida('12/10/2026')).toBe(false));
});

describe('minutos', () => {
  it('converte HH:MM', () => expect(paraMinutos('18:30')).toBe(1110));
  it('recusa hora inválida', () => expect(paraMinutos('25:00')).toBeNull());
  it('2h por dia', () => expect(minutosPorDia({ inicio: '18:00', fim: '20:00' })).toBe(120));
  it('fim igual ao início é 0', () => expect(minutosPorDia({ inicio: '18:00', fim: '18:00' })).toBe(0));
  it('fim antes do início é 0', () => expect(minutosPorDia({ inicio: '20:00', fim: '18:00' })).toBe(0));
  it('3 dias × 2h = 360 min', () => expect(totalMinutos('2026-10-13', '2026-10-15', { inicio: '18:00', fim: '20:00' })).toBe(360));
});

describe('formatarDuracao', () => {
  it.each([
    [0, '0h'],
    [30, '30min'],
    [120, '2h'],
    [90, '1h30'],
    [750, '12h30'],
    [65, '1h05'],
  ])('%i min → %s', (min, texto) => expect(formatarDuracao(min)).toBe(texto));
});
