import { describe, expect, it } from 'vitest';
import { diasDaPessoa, diasDeTodos, type DiaDeJornada } from '../mock/jornadaReal';
import { CUSTO_PADRAO, custoDaHoraExtra, custoDaOcorrencia, descansoEntre, emHoras, emReais, ocorrenciasDe } from './conformidade';

const dia = (parcial: Partial<DiaDeJornada>): DiaDeJornada => ({
  pessoaId: 'u-ana', dia: '2026-10-08', diaDaSemana: 4,
  previstoInicio: '08:00', previstoFim: '17:00', intervaloPrevistoMin: 60,
  primeiroLogon: '08:00', ultimoLogoff: '17:00', intervaloRealMin: 60,
  extraAprovadaMin: 0, extraSemAprovacaoMin: 0, tentativasBloqueadas: 0, minutosEvitados: 0,
  pausasPrevistas: 2, pausasFeitas: 2,
  ...parcial,
});

describe('ocorrenciasDe', () => {
  it('dia dentro da regra não gera ocorrência', () => {
    expect(ocorrenciasDe([dia({})])).toEqual([]);
  });

  it('acusa o que passa de 2 horas extras, a hora sem aprovação e o intervalo curto', () => {
    const achados = ocorrenciasDe([dia({ extraAprovadaMin: 100, extraSemAprovacaoMin: 50, intervaloRealMin: 40, ultimoLogoff: '19:30' })]);
    expect(achados.map((o) => [o.regra, o.minutos])).toEqual([['extraDiaria', 30], ['semAprovacao', 50], ['intervalo', 20]]);
  });

  it('acusa menos de 11 horas entre jornadas', () => {
    const ontem = dia({ dia: '2026-10-07', ultimoLogoff: '22:00', extraAprovadaMin: 120 });
    const hoje = dia({ dia: '2026-10-08', primeiroLogon: '07:30' });
    expect(descansoEntre(ontem, hoje)).toBe(570);
    expect(ocorrenciasDe([ontem, hoje]).find((o) => o.regra === 'interjornada')).toMatchObject({ dia: '2026-10-08', minutos: 90 });
  });

  it('dia sem uso da estação não entra na interjornada', () => {
    expect(descansoEntre(dia({ ultimoLogoff: null }), dia({ dia: '2026-10-09' }))).toBeNull();
  });
});

describe('custo', () => {
  it('hora extra: valor da hora com adicional e encargos', () => {
    expect(custoDaHoraExtra(60, 40, { ...CUSTO_PADRAO, encargos: 0 })).toBe(60);
    expect(custoDaHoraExtra(60, 40, { ...CUSTO_PADRAO, encargos: 0 }, true)).toBe(80);
    expect(custoDaHoraExtra(60, 40)).toBeCloseTo(81);
  });

  it('intervalo suprimido custa o tempo que faltou com 50% a mais', () => {
    expect(custoDaOcorrencia({ regra: 'intervalo', pessoaId: 'u-ana', dia: '2026-10-08', minutos: 30 }, 40)).toBe(30);
  });
});

describe('formatos', () => {
  it('horas e reais em português', () => {
    expect(emHoras(135)).toBe('2h15');
    expect(emHoras(60)).toBe('1h');
    expect(emHoras(45)).toBe('45 min');
    expect(emReais(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
    expect(emReais(1234.5, true).replace(/\s/g, ' ')).toBe('R$ 1.235');
  });
});

describe('dados de exemplo', () => {
  it('são determinísticos e só vão até ontem', () => {
    expect(diasDaPessoa('u-ana')).toEqual(diasDaPessoa('u-ana'));
    expect(diasDaPessoa('u-ana', -30, 5)).toHaveLength(30);
    expect(diasDaPessoa('ninguem')).toEqual([]);
  });

  it('têm ocorrências de todos os tipos principais, para as telas terem o que mostrar', () => {
    const porPessoa = new Map<string, DiaDeJornada[]>();
    for (const d of diasDeTodos()) porPessoa.set(d.pessoaId, [...(porPessoa.get(d.pessoaId) ?? []), d]);
    const regras = new Set([...porPessoa.values()].flatMap((dias) => ocorrenciasDe(dias).map((o) => o.regra)));
    expect(regras).toContain('semAprovacao');
    expect(regras).toContain('intervalo');
    expect(regras).toContain('extraDiaria');
    expect(regras).toContain('interjornada');
  });
});
