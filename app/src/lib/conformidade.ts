import { emMinutos, type DiaDeJornada } from '../mock/jornadaReal';

/**
 * Regras de jornada da CLT usadas pela Previsão de jornada, pelo Radar de passivo e pelo Dossiê.
 * São regras puras: recebem os dias registrados e devolvem o que foge da regra e quanto custa.
 * Os valores em R$ são estimativas para priorizar a gestão, não um cálculo de folha nem parecer jurídico.
 */
export const LIMITES = {
  /** CLT art. 59: até 2 horas extras por dia. */
  extraDiariaMin: 120,
  /** CLT art. 66: 11 horas de descanso entre duas jornadas. */
  interjornadaMin: 11 * 60,
  /** CLT art. 71: intervalo de pelo menos 1 hora em jornada acima de 6 horas. */
  intervaloMinimoMin: 60,
} as const;

export type Regra = 'extraDiaria' | 'interjornada' | 'intervalo' | 'semAprovacao' | 'descansoSemanal';

export const REGRAS: Record<Regra, { titulo: string; base: string; explicacao: string }> = {
  extraDiaria: { titulo: 'Mais de 2 horas extras no dia', base: 'CLT art. 59', explicacao: 'A jornada pode ser estendida em até 2 horas por dia.' },
  interjornada: { titulo: 'Menos de 11 horas entre jornadas', base: 'CLT art. 66', explicacao: 'Entre o fim de uma jornada e o começo da seguinte deve haver 11 horas de descanso.' },
  intervalo: { titulo: 'Intervalo menor que 1 hora', base: 'CLT art. 71', explicacao: 'Em jornada acima de 6 horas, o intervalo para refeição é de pelo menos 1 hora.' },
  semAprovacao: { titulo: 'Hora além da jornada sem aprovação', base: 'Súmula 338 do TST', explicacao: 'Trabalho além da jornada sem pedido aprovado: a hora é devida e não há registro de autorização.' },
  descansoSemanal: { titulo: 'Trabalho no dia de descanso', base: 'CLT art. 67', explicacao: 'Toda semana deve ter um descanso de 24 horas seguidas, de preferência no domingo.' },
};

export interface Ocorrencia {
  regra: Regra;
  pessoaId: string;
  dia: string;
  /** Minutos fora da regra (ex.: 35 minutos acima das 2 horas extras). */
  minutos: number;
}

/** Total de minutos além da jornada no dia, com e sem aprovação. */
export const extraDoDia = (d: DiaDeJornada): number => d.extraAprovadaMin + d.extraSemAprovacaoMin;

/** Minutos de descanso entre o logoff de `anterior` e o logon de `atual` (dias seguidos). null se algum não teve uso. */
export function descansoEntre(anterior: DiaDeJornada, atual: DiaDeJornada): number | null {
  if (!anterior.ultimoLogoff || !atual.primeiroLogon) return null;
  const fim = emMinutos(anterior.ultimoLogoff);
  const inicio = emMinutos(atual.primeiroLogon);
  const diasEntre = Math.round((new Date(`${atual.dia}T12:00:00`).getTime() - new Date(`${anterior.dia}T12:00:00`).getTime()) / 86_400_000);
  if (diasEntre < 1) return null;
  return diasEntre * 24 * 60 - fim + inicio;
}

/**
 * Tudo o que foge das regras numa sequência de dias de UMA pessoa, em ordem de data.
 * A interjornada compara cada dia com o dia anterior da lista.
 */
export function ocorrenciasDe(dias: DiaDeJornada[]): Ocorrencia[] {
  const achados: Ocorrencia[] = [];
  dias.forEach((d, i) => {
    const usou = d.primeiroLogon !== null;
    const extra = extraDoDia(d);
    if (extra > LIMITES.extraDiariaMin) achados.push({ regra: 'extraDiaria', pessoaId: d.pessoaId, dia: d.dia, minutos: extra - LIMITES.extraDiariaMin });
    if (d.extraSemAprovacaoMin > 0) achados.push({ regra: 'semAprovacao', pessoaId: d.pessoaId, dia: d.dia, minutos: d.extraSemAprovacaoMin });
    if (usou && d.previstoInicio && d.intervaloRealMin < LIMITES.intervaloMinimoMin) {
      achados.push({ regra: 'intervalo', pessoaId: d.pessoaId, dia: d.dia, minutos: LIMITES.intervaloMinimoMin - d.intervaloRealMin });
    }
    if (usou && d.diaDaSemana === 0) achados.push({ regra: 'descansoSemanal', pessoaId: d.pessoaId, dia: d.dia, minutos: extra });
    const anterior = dias[i - 1];
    if (anterior) {
      const descanso = descansoEntre(anterior, d);
      if (descanso !== null && descanso < LIMITES.interjornadaMin) {
        achados.push({ regra: 'interjornada', pessoaId: d.pessoaId, dia: d.dia, minutos: LIMITES.interjornadaMin - descanso });
      }
    }
  });
  return achados;
}

/** Como o custo é estimado. O cliente pode ajustar os percentuais. */
export interface ParametrosDeCusto {
  /** Adicional da hora extra em dia comum (0.5 = 50%). */
  adicionalHoraExtra: number;
  /** Adicional em domingo e feriado (1 = 100%). */
  adicionalDescanso: number;
  /** Acréscimo médio de encargos e reflexos sobre o valor da hora extra (0.35 = 35%). Estimativa do cliente. */
  encargos: number;
}

export const CUSTO_PADRAO: ParametrosDeCusto = { adicionalHoraExtra: 0.5, adicionalDescanso: 1, encargos: 0.35 };

/** Valor em R$ de `minutos` de hora extra para quem custa `custoHora` por hora normal. */
export function custoDaHoraExtra(minutos: number, custoHora: number, p: ParametrosDeCusto = CUSTO_PADRAO, emDescanso = false): number {
  const adicional = emDescanso ? p.adicionalDescanso : p.adicionalHoraExtra;
  return (minutos / 60) * custoHora * (1 + adicional) * (1 + p.encargos);
}

/**
 * Custo estimado de uma ocorrência, em R$:
 * - intervalo suprimido: o tempo que faltou, com 50% a mais (CLT art. 71 §4º);
 * - interjornada: as horas de descanso que faltaram, pagas como extras;
 * - hora sem aprovação e trabalho no dia de descanso: os minutos como hora extra (em dobro no descanso);
 * - mais de 2 horas extras no dia: R$ 0. A ocorrência fica registrada, mas essas horas ou já foram pagas
 *   (extensão aprovada) ou já estão contadas em "sem aprovação": somar de novo contaria o mesmo tempo duas vezes.
 */
export function custoDaOcorrencia(o: Ocorrencia, custoHora: number, p: ParametrosDeCusto = CUSTO_PADRAO): number {
  if (o.regra === 'extraDiaria') return 0;
  if (o.regra === 'intervalo') return (o.minutos / 60) * custoHora * 1.5;
  return custoDaHoraExtra(o.minutos, custoHora, p, o.regra === 'descansoSemanal');
}

const REAIS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const REAIS_SEM_CENTAVOS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
/** "R$ 1.234,50". Com `semCentavos`, "R$ 1.235" (para indicadores). */
export const emReais = (valor: number, semCentavos = false): string => (semCentavos ? REAIS_SEM_CENTAVOS : REAIS).format(valor);

/** 135 → "2h15"; 60 → "1h"; 45 → "45 min". */
export function emHoras(minutos: number): string {
  const m = Math.round(minutos);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  return resto === 0 ? `${h}h` : `${h}h${String(resto).padStart(2, '0')}`;
}
