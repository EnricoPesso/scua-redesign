import { describe, expect, it } from 'vitest';
import { formatarData, formatarDataHora, formatarDuracao, horaDe, minutosEntre } from './formatacao';

describe('formatarDuracao', () => {
  it.each([
    [0, '0min'],
    [45, '45min'],
    [60, '1h'],
    [80, '1h20'],
    [65, '1h05'],
    [120, '2h'],
    [-5, '0min'],
  ])('%i minutos → %s', (minutos, esperado) => {
    expect(formatarDuracao(minutos)).toBe(esperado);
  });
});

describe('datas em pt-BR', () => {
  it('formata a data', () => {
    expect(formatarData('2026-10-12')).toBe('12/10/2026');
    expect(formatarData('2026-10-12T08:30:00')).toBe('12/10/2026');
  });
  it('formata data e hora com dois dígitos', () => {
    expect(formatarDataHora('2026-10-05T08:03:00')).toBe('05/10/2026 08:03');
  });
  it('calcula minutos entre dois instantes', () => {
    expect(minutosEntre('2026-10-12T18:10:00', '2026-10-12T19:30:00')).toBe(80);
  });
  it('converte minutos do dia em hora', () => {
    expect(horaDe(8 * 60 + 5)).toBe('08:05');
  });
});
