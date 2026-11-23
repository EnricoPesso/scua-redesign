import { avaliarLimite, type AvaliacaoLimite } from '../../extensoes/domain/limite';
import { emHoras, extraDoDia } from '../../../lib/conformidade';
import type { DiaDeJornada } from '../../../mock/jornadaReal';

/** Regras puras da tela "Meus dados". Recebem os dias da pessoa logada e devolvem o que a tela mostra. */

export interface ResumoDoPeriodo {
  /** Dias em que a estação foi usada. */
  diasComUso: number;
  /** Minutos além da jornada (com e sem aprovação). */
  extraMin: number;
  pausasFeitas: number;
  pausasPrevistas: number;
}

const usou = (d: DiaDeJornada) => d.primeiroLogon !== null;

export function resumoDoPeriodo(dias: DiaDeJornada[]): ResumoDoPeriodo {
  return {
    diasComUso: dias.filter(usou).length,
    extraMin: dias.reduce((s, d) => s + extraDoDia(d), 0),
    pausasFeitas: dias.reduce((s, d) => s + d.pausasFeitas, 0),
    pausasPrevistas: dias.reduce((s, d) => s + d.pausasPrevistas, 0),
  };
}

const maisRecenteAntes = (a: DiaDeJornada, b: DiaDeJornada) => b.dia.localeCompare(a.dia);

/** Os últimos `n` dias fechados, do mais recente ao mais antigo. */
export function ultimosDias(dias: DiaDeJornada[], n = 14): DiaDeJornada[] {
  return [...dias].sort(maisRecenteAntes).slice(0, n);
}

/** Os últimos 7 dias fechados (semana corrida: nunca fica vazia na segunda-feira). */
export function ultimaSemana(dias: DiaDeJornada[]): DiaDeJornada[] {
  return ultimosDias(dias, 7);
}

/** Dias do mês de `hoje` (YYYY-MM-DD) que já fecharam, ou seja, do dia 1 até ontem. */
export function diasDoMes(dias: DiaDeJornada[], hoje: string): DiaDeJornada[] {
  const mes = hoje.slice(0, 7);
  return dias.filter((d) => d.dia.startsWith(mes) && d.dia < hoje);
}

/**
 * Quanto do limite mensal de extensão do grupo já foi usado (só as extensões aprovadas contam).
 * `limiteHoras` vazio ou nulo = sem limite.
 */
export function usoDoLimiteMensal(
  diasDoMesAteOntem: DiaDeJornada[],
  limiteHoras: number | '' | null,
): { usadoMin: number; limiteMin: number | null; avaliacao: AvaliacaoLimite } {
  const usadoMin = diasDoMesAteOntem.reduce((s, d) => s + d.extraAprovadaMin, 0);
  const limiteMin = limiteHoras === '' || limiteHoras === null ? null : limiteHoras * 60;
  return { usadoMin, limiteMin, avaliacao: avaliarLimite(usadoMin, 0, limiteMin) };
}

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "2026-10-09" → "sex 09/10". */
export function rotuloDoDia(dia: string): string {
  const [, m, d] = dia.split('-');
  const semana = DIAS_CURTOS[new Date(`${dia}T12:00:00`).getDay()];
  return `${semana} ${d}/${m}`;
}

/** Linha da lista dos últimos dias, já em texto (a tabela e o arquivo baixado usam as mesmas). */
export interface LinhaDoDia {
  dia: string;
  rotulo: string;
  previsto: string;
  entrada: string;
  saida: string;
  intervalo: string;
  alemDaJornada: string;
  /** Minutos além da jornada, para a tabela destacar quando houver. */
  alemMin: number;
}

export function linhaDoDia(d: DiaDeJornada): LinhaDoDia {
  const extra = extraDoDia(d);
  return {
    dia: d.dia,
    rotulo: rotuloDoDia(d.dia),
    previsto: d.previstoInicio && d.previstoFim ? `${d.previstoInicio} às ${d.previstoFim}` : 'Sem jornada',
    entrada: d.primeiroLogon ?? '—',
    saida: d.ultimoLogoff ?? '—',
    intervalo: usou(d) ? emHoras(d.intervaloRealMin) : '—',
    alemDaJornada: extra > 0 ? emHoras(extra) : '—',
    alemMin: extra,
  };
}

/** Jornada combinada, lida do dia mais recente que tem jornada. null se não houver dado. */
export function jornadaCombinada(dias: DiaDeJornada[]): string | null {
  const d = [...dias].sort(maisRecenteAntes).find((x) => x.previstoInicio && x.previstoFim);
  if (!d) return null;
  const intervalo = d.intervaloPrevistoMin > 0 ? `, com ${emHoras(d.intervaloPrevistoMin)} de intervalo` : '';
  return `Segunda a sexta, das ${d.previstoInicio} às ${d.previstoFim}${intervalo}`;
}
