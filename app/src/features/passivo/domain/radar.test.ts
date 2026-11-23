import { describe, expect, it } from 'vitest';
import { custoDaHoraExtra, custoDaOcorrencia, CUSTO_PADRAO, ocorrenciasDe } from '../../../lib/conformidade';
import { PESSOAS_DIRETORIO } from '../../../mock/diretorio';
import { CUSTO_HORA, diasDeTodos, type DiaDeJornada } from '../../../mock/jornadaReal';
import { calcularRadar, inicioDaSemana, lerAlvo, ocorrenciasDoAlvo, principaisGestores, SEM_GESTOR } from './radar';

/** Segunda, 5/10/2026 = dia da semana 1. */
function dia(pessoaId: string, data: string, semana: number, extra: Partial<DiaDeJornada> = {}): DiaDeJornada {
  return {
    pessoaId, dia: data, diaDaSemana: semana,
    previstoInicio: '08:00', previstoFim: '17:00', intervaloPrevistoMin: 60,
    primeiroLogon: '08:00', ultimoLogoff: '17:00', intervaloRealMin: 60,
    extraAprovadaMin: 0, extraSemAprovacaoMin: 0, tentativasBloqueadas: 0, minutosEvitados: 0,
    pausasPrevistas: 2, pausasFeitas: 2, ...extra,
  };
}
const HORA = { 'u-ana': 40, 'u-joao': 20, 'u-bia': 30, 'u-carlos': 60 };
const pessoas = PESSOAS_DIRETORIO.filter((p) => ['u-ana', 'u-joao', 'u-bia', 'u-carlos'].includes(p.id));
const parametros = CUSTO_PADRAO;

const dias: DiaDeJornada[] = [
  // Ana (Comercial, gestor Carlos): 3h de hora extra sem aprovação na segunda e intervalo curto na terça.
  dia('u-ana', '2026-10-05', 1, { extraSemAprovacaoMin: 180, ultimoLogoff: '20:00' }),
  dia('u-ana', '2026-10-06', 2, { intervaloRealMin: 30 }),
  // João (Comercial): 1h sem aprovação na semana seguinte; tentativa barrada no domingo.
  dia('u-joao', '2026-10-12', 1, { extraSemAprovacaoMin: 60, ultimoLogoff: '18:00' }),
  dia('u-joao', '2026-10-11', 0, { primeiroLogon: null, ultimoLogoff: null, tentativasBloqueadas: 2, minutosEvitados: 60 }),
  // Bia (Operações): nada fora da regra, só uma tentativa barrada.
  dia('u-bia', '2026-10-07', 3, { tentativasBloqueadas: 1, minutosEvitados: 90 }),
];

const calcular = (extra: Partial<Parameters<typeof calcularRadar>[0]> = {}) => calcularRadar({ dias, custoHora: HORA, pessoas, parametros, ...extra });

describe('calcularRadar', () => {
  it('soma o custo das ocorrências de cada pessoa', () => {
    const r = calcular();
    const ana = ocorrenciasDe(dias.filter((d) => d.pessoaId === 'u-ana'));
    const joao = ocorrenciasDe(dias.filter((d) => d.pessoaId === 'u-joao').sort((a, b) => a.dia.localeCompare(b.dia)));
    const esperado = [...ana.map((o) => custoDaOcorrencia(o, 40, parametros)), ...joao.map((o) => custoDaOcorrencia(o, 20, parametros))].reduce((t, v) => t + v, 0);
    expect(r.emRisco).toBeCloseTo(esperado, 6);
    expect(r.emRisco).toBeGreaterThan(0);
  });

  it('avalia o evitado como hora extra que não aconteceu (domingo com adicional de descanso)', () => {
    const r = calcular();
    const esperado = custoDaHoraExtra(60, 20, parametros, true) + custoDaHoraExtra(90, 30, parametros, false);
    expect(r.evitado).toBeCloseTo(esperado, 6);
    expect(r.tentativasBarradas).toBe(3);
  });

  it('conta horas sem aprovação e pessoas envolvidas', () => {
    const r = calcular();
    expect(r.minutosSemAprovacao).toBe(240);
    expect(r.pessoasEnvolvidas).toBe(2);
    expect(r.ranking.map((l) => l.pessoaId)).toEqual(['u-ana', 'u-joao']);
  });

  it('todas as quebras fecham com o total em risco', () => {
    const r = calcular();
    const total = (l: { custo: number }[]) => l.reduce((t, x) => t + x.custo, 0);
    for (const quebra of [r.porRegra, r.porGestor, r.porDiretoria, r.porSemana, r.ranking]) expect(total(quebra)).toBeCloseTo(r.emRisco, 6);
    expect(r.porSemana.reduce((t, s) => t + s.evitado, 0)).toBeCloseTo(r.evitado, 6);
  });

  it('agrupa por regra com a base legal, do maior para o menor', () => {
    const r = calcular();
    expect(r.porRegra).toHaveLength(5);
    expect(r.porRegra[0].custo).toBeGreaterThanOrEqual(r.porRegra[1].custo);
    const semAprovacao = r.porRegra.find((x) => x.regra === 'semAprovacao')!;
    expect(semAprovacao.base).toBe('Súmula 338 do TST');
    expect(semAprovacao.ocorrencias).toBe(2);
    expect(r.porRegra.find((x) => x.regra === 'interjornada')!.custo).toBe(0);
  });

  it('agrupa por gestor e por diretoria', () => {
    const r = calcular();
    expect(r.porGestor).toHaveLength(1);
    expect(r.porGestor[0]).toMatchObject({ gestorId: 'u-carlos', nome: 'Carlos Mendes', pessoas: 2 });
    expect(r.porDiretoria.map((d) => d.diretoria)).toEqual(['Comercial']);
    expect(principaisGestores(r)).toHaveLength(1);
  });

  it('quem não tem gestor cai em "Sem gestor definido"', () => {
    const r = calcularRadar({
      dias: [dia('u-carlos', '2026-10-05', 1, { extraSemAprovacaoMin: 60 })],
      custoHora: HORA, pessoas, parametros,
    });
    expect(r.porGestor[0]).toMatchObject({ gestorId: SEM_GESTOR, nome: 'Sem gestor definido' });
  });

  it('separa por semana (de segunda a domingo), inclusive a que não teve ocorrência', () => {
    const r = calcular();
    expect(r.porSemana.map((s) => s.inicio)).toEqual(['2026-10-05', '2026-10-12']);
    expect(inicioDaSemana('2026-10-11')).toBe('2026-10-05');
    expect(inicioDaSemana('2026-10-12')).toBe('2026-10-12');
    expect(r.porSemana[0].ocorrencias).toBe(3);
  });

  it('o filtro de diretoria limita tudo à diretoria escolhida', () => {
    const r = calcular({ diretoria: 'Operações' });
    expect(r.emRisco).toBe(0);
    expect(r.ranking).toEqual([]);
    expect(r.evitado).toBeCloseTo(custoDaHoraExtra(90, 30, parametros), 6);
    expect(calcular({ diretoria: 'Comercial' }).emRisco).toBeCloseTo(calcular().emRisco, 6);
  });

  it('mudar os percentuais muda o valor na hora', () => {
    const base = calcular().emRisco;
    expect(calcular({ parametros: { ...parametros, encargos: 0.7 } }).emRisco).toBeGreaterThan(base);
    expect(calcular({ parametros: { ...parametros, adicionalHoraExtra: 0 } }).emRisco).toBeLessThan(base);
  });

  it('as ocorrências de um alvo vêm da mais recente para a mais antiga', () => {
    const r = calcular();
    const gestor = ocorrenciasDoAlvo(r, { tipo: 'gestor', id: 'u-carlos' });
    expect(gestor).toHaveLength(r.ocorrencias.length);
    expect(gestor.map((o) => o.dia)).toEqual(gestor.map((o) => o.dia).sort().reverse());
    expect(ocorrenciasDoAlvo(r, { tipo: 'pessoa', id: 'u-ana' })).toHaveLength(3);
  });

  it('período sem nenhum dia dá tudo zerado', () => {
    const r = calcular({ dias: [] });
    expect(r).toMatchObject({ emRisco: 0, evitado: 0, minutosSemAprovacao: 0, pessoasEnvolvidas: 0, tentativasBarradas: 0 });
    expect(r.porSemana).toEqual([]);
  });

  it('com os dados de exemplo há risco e valor evitado', () => {
    const r = calcularRadar({ dias: diasDeTodos(-30, -1), custoHora: CUSTO_HORA, pessoas: PESSOAS_DIRETORIO, parametros });
    expect(r.emRisco).toBeGreaterThan(0);
    expect(r.evitado).toBeGreaterThan(0);
    expect(principaisGestores(r)).toHaveLength(3);
  });
});

describe('lerAlvo', () => {
  it('aceita gestor e pessoa que existem e ignora o resto', () => {
    expect(lerAlvo('pessoa:u-ana')).toEqual({ tipo: 'pessoa', id: 'u-ana' });
    expect(lerAlvo('gestor:u-carlos')).toEqual({ tipo: 'gestor', id: 'u-carlos' });
    expect(lerAlvo('gestor:sem-gestor')).toEqual({ tipo: 'gestor', id: SEM_GESTOR });
    expect(lerAlvo('pessoa:fantasma')).toBeNull();
    expect(lerAlvo('outro:u-ana')).toBeNull();
    expect(lerAlvo(null)).toBeNull();
  });
});
