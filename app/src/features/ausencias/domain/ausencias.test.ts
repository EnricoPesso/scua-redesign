import { describe, expect, it } from 'vitest';
import {
  diasUteisEntre, formatarDuracao, maiorContinua, posicaoDaBarra, resumir, rotuloDoDia, textoDaAusencia, totaisPorPessoa, validarPeriodo,
  type Ausencia,
} from './ausencias';

const aus = (pessoaId: string, dia: string, inicio: string, fim: string, motivo: Ausencia['motivo'] = 'Pausa'): Ausencia =>
  ({ id: `${pessoaId}${dia}${inicio}`, pessoaId, dia, inicio, fim, motivo });

describe('formatarDuracao', () => {
  it.each([[65, '1h05'], [120, '2h'], [45, '45min'], [0, '0min'], [5, '5min'], [600, '10h']])('%i min vira %s', (min, texto) => {
    expect(formatarDuracao(min)).toBe(texto);
  });
});

describe('posicaoDaBarra', () => {
  it('posiciona em % do expediente de 10h', () => {
    expect(posicaoDaBarra(12 * 60, 13 * 60)).toEqual({ esquerda: 40, largura: 10 });
  });
  it('corta o que passa das bordas', () => {
    expect(posicaoDaBarra(7 * 60 + 30, 8 * 60 + 30)).toEqual({ esquerda: 0, largura: 5 });
    expect(posicaoDaBarra(17 * 60, 19 * 60)).toEqual({ esquerda: 90, largura: 10 });
  });
  it('devolve null fora do expediente', () => {
    expect(posicaoDaBarra(6 * 60, 7 * 60)).toBeNull();
    expect(posicaoDaBarra(18 * 60, 19 * 60)).toBeNull();
  });
});

describe('textoDaAusencia', () => {
  it('junta motivo, horário e duração', () => {
    expect(textoDaAusencia(aus('a', '2026-10-12', '12:00', '13:05', 'Almoço'))).toBe('Almoço, 12:00 a 13:05, 1h05');
  });
});

describe('resumir', () => {
  const lista = [aus('a', '2026-10-12', '12:00', '13:00'), aus('a', '2026-10-12', '13:00', '13:30'), aus('b', '2026-10-12', '10:00', '10:20')];
  it('calcula total, pessoas e média por pessoa por dia', () => {
    const r = resumir(lista, 4, 5);
    expect(r.totalMin).toBe(110);
    expect(r.pessoasComAusencia).toBe(2);
    expect(r.mediaMinPorPessoaDia).toBeCloseTo(5.5);
  });
  it('junta ausências encostadas na maior contínua', () => {
    expect(maiorContinua(lista)).toBe(90);
  });
  it('não divide por zero e aceita lista vazia', () => {
    expect(resumir([], 0, 0)).toEqual({ totalMin: 0, pessoasComAusencia: 0, mediaMinPorPessoaDia: 0, maiorContinuaMin: 0 });
  });
  it('não junta ausências de dias ou pessoas diferentes', () => {
    expect(maiorContinua([aus('a', '2026-10-12', '10:00', '10:30'), aus('a', '2026-10-13', '10:30', '11:30'), aus('b', '2026-10-12', '10:30', '10:40')])).toBe(60);
  });
  it('soma por pessoa', () => {
    expect(totaisPorPessoa(lista).get('a')).toBe(90);
  });
});

describe('validarPeriodo', () => {
  it('aceita até 31 dias', () => {
    expect(validarPeriodo('2026-10-01', '2026-10-31')).toBeNull();
    expect(validarPeriodo('2026-10-12', '2026-10-12')).toBeNull();
  });
  it('recusa mais de 31 dias com mensagem amigável', () => {
    expect(validarPeriodo('2026-10-01', '2026-11-01')).toBe('Escolha um período de no máximo 31 dias.');
  });
  it('recusa datas faltando ou invertidas', () => {
    expect(validarPeriodo('', '2026-10-01')).toMatch(/Preencha/);
    expect(validarPeriodo('2026-10-10', '2026-10-01')).toMatch(/não pode ser depois/);
  });
});

describe('dias', () => {
  it('só dias úteis', () => {
    expect(diasUteisEntre('2026-10-09', '2026-10-13')).toEqual(['2026-10-09', '2026-10-12', '2026-10-13']);
  });
  it('rótulo com dia da semana', () => {
    expect(rotuloDoDia('2026-10-12')).toBe('Seg 12/10');
  });
});
