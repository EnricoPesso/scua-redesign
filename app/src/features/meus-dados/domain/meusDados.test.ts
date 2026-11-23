import { describe, expect, it } from 'vitest';
import type { DiaDeJornada } from '../../../mock/jornadaReal';
import {
  diasDoMes, jornadaCombinada, linhaDoDia, resumoDoPeriodo, rotuloDoDia, ultimaSemana, ultimosDias, usoDoLimiteMensal,
} from './meusDados';

function dia(data: string, extra: Partial<DiaDeJornada> = {}): DiaDeJornada {
  return {
    pessoaId: 'u-ana', dia: data, diaDaSemana: new Date(`${data}T12:00:00`).getDay(),
    previstoInicio: '08:00', previstoFim: '17:00', intervaloPrevistoMin: 60,
    primeiroLogon: '08:00', ultimoLogoff: '17:00', intervaloRealMin: 60,
    extraAprovadaMin: 0, extraSemAprovacaoMin: 0, tentativasBloqueadas: 0, minutosEvitados: 0,
    pausasPrevistas: 2, pausasFeitas: 2,
    ...extra,
  };
}

const AUSENTE = { primeiroLogon: null, ultimoLogoff: null, intervaloRealMin: 0, pausasFeitas: 0 };

describe('resumoDoPeriodo', () => {
  it('conta dias com uso, horas além da jornada (com e sem aprovação) e pausas', () => {
    const r = resumoDoPeriodo([
      dia('2026-10-05', { extraAprovadaMin: 60 }),
      dia('2026-10-06', { extraSemAprovacaoMin: 30, pausasFeitas: 1 }),
      dia('2026-10-07', AUSENTE),
    ]);
    expect(r).toEqual({ diasComUso: 2, extraMin: 90, pausasFeitas: 3, pausasPrevistas: 6 });
  });

  it('lista vazia dá zeros', () => {
    expect(resumoDoPeriodo([])).toEqual({ diasComUso: 0, extraMin: 0, pausasFeitas: 0, pausasPrevistas: 0 });
  });
});

describe('ultimosDias e ultimaSemana', () => {
  const dias = Array.from({ length: 20 }, (_, i) => dia(`2026-09-${String(i + 10).padStart(2, '0')}`));
  it('devolve os 14 mais recentes, do mais novo ao mais antigo', () => {
    const r = ultimosDias(dias);
    expect(r).toHaveLength(14);
    expect(r[0].dia).toBe('2026-09-29');
    expect(r[13].dia).toBe('2026-09-16');
  });
  it('a semana são os 7 últimos dias', () => {
    expect(ultimaSemana(dias)).toHaveLength(7);
  });
  it('não altera a lista original', () => {
    const copia = [...dias];
    ultimosDias(dias);
    expect(dias).toEqual(copia);
  });
});

describe('diasDoMes', () => {
  it('pega só o mês de hoje, até ontem', () => {
    const dias = [dia('2026-09-30'), dia('2026-10-01'), dia('2026-10-11'), dia('2026-10-12')];
    expect(diasDoMes(dias, '2026-10-12').map((d) => d.dia)).toEqual(['2026-10-01', '2026-10-11']);
  });
  it('no dia 1º o mês ainda não tem dias fechados', () => {
    expect(diasDoMes([dia('2026-09-30')], '2026-10-01')).toEqual([]);
  });
});

describe('usoDoLimiteMensal', () => {
  const dias = [dia('2026-10-01', { extraAprovadaMin: 120 }), dia('2026-10-02', { extraAprovadaMin: 240, extraSemAprovacaoMin: 60 })];
  it('soma só as extensões aprovadas e compara com o limite do grupo', () => {
    const r = usoDoLimiteMensal(dias, 10);
    expect(r.usadoMin).toBe(360);
    expect(r.limiteMin).toBe(600);
    expect(r.avaliacao.faixa).toBe('ok');
  });
  it('perto e acima do limite mudam a faixa', () => {
    expect(usoDoLimiteMensal(dias, 7).avaliacao.faixa).toBe('atencao');
    expect(usoDoLimiteMensal(dias, 5).avaliacao.faixa).toBe('excedido');
  });
  it('sem grupo ou limite vazio = sem limite', () => {
    expect(usoDoLimiteMensal(dias, '').avaliacao.faixa).toBe('sem-limite');
    expect(usoDoLimiteMensal(dias, null).limiteMin).toBeNull();
  });
});

describe('linhaDoDia', () => {
  it('formata um dia com hora além da jornada', () => {
    const l = linhaDoDia(dia('2026-10-09', { primeiroLogon: '08:05', ultimoLogoff: '18:30', intervaloRealMin: 45, extraAprovadaMin: 60, extraSemAprovacaoMin: 15 }));
    expect(l).toMatchObject({ rotulo: 'sex 09/10', previsto: '08:00 às 17:00', entrada: '08:05', saida: '18:30', intervalo: '45 min', alemDaJornada: '1h15', alemMin: 75 });
  });
  it('dia sem uso e sem jornada mostra traços', () => {
    const l = linhaDoDia(dia('2026-10-10', { ...AUSENTE, previstoInicio: null, previstoFim: null, intervaloPrevistoMin: 0 }));
    expect(l).toMatchObject({ previsto: 'Sem jornada', entrada: '—', saida: '—', intervalo: '—', alemDaJornada: '—', alemMin: 0 });
  });
});

describe('rotuloDoDia', () => {
  it('põe o dia da semana abreviado', () => {
    expect(rotuloDoDia('2026-10-11')).toBe('dom 11/10');
    expect(rotuloDoDia('2026-10-10')).toBe('sáb 10/10');
  });
});

describe('jornadaCombinada', () => {
  it('lê a jornada do dia mais recente que a tem', () => {
    const dias = [dia('2026-10-08'), dia('2026-10-09'), dia('2026-10-10', { previstoInicio: null, previstoFim: null })];
    expect(jornadaCombinada(dias)).toBe('Segunda a sexta, das 08:00 às 17:00, com 1h de intervalo');
  });
  it('sem dado devolve null', () => {
    expect(jornadaCombinada([])).toBeNull();
  });
});
