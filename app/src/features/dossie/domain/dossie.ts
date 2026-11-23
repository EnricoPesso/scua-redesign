import { REGRAS, ocorrenciasDe, type Regra } from '../../../lib/conformidade';
import { gestorDe, type PessoaDiretorio } from '../../../mock/diretorio';
import { emMinutos, type DiaDeJornada } from '../../../mock/jornadaReal';

/** Períodos que o dossiê oferece, em dias corridos até ontem. */
export const PERIODOS = [7, 15, 30] as const;
export type Periodo = (typeof PERIODOS)[number];
export const PERIODO_PADRAO: Periodo = 30;
export const ehPeriodo = (v: unknown): v is Periodo => PERIODOS.includes(Number(v) as Periodo);

export interface OcorrenciaDoDia {
  regra: Regra;
  titulo: string;
  base: string;
  minutos: number;
}

export interface DiaDoDossie {
  dia: string;
  diaDaSemana: number;
  previstoInicio: string | null;
  previstoFim: string | null;
  intervaloPrevistoMin: number;
  primeiroLogon: string | null;
  ultimoLogoff: string | null;
  intervaloRealMin: number;
  extraAprovadaMin: number;
  extraSemAprovacaoMin: number;
  tentativasBloqueadas: number;
  pausasPrevistas: number;
  pausasFeitas: number;
  ocorrencias: OcorrenciaDoDia[];
}

export interface ResumoDoDossie {
  diasNoPeriodo: number;
  diasComUso: number;
  extraAprovadaMin: number;
  extraSemAprovacaoMin: number;
  tentativasBloqueadas: number;
  pausasPrevistas: number;
  pausasFeitas: number;
  totalOcorrencias: number;
  ocorrenciasPorRegra: Record<Regra, number>;
}

/** Tudo o que entra no código de integridade. A data de geração fica de fora de propósito. */
export interface ConteudoDoDossie {
  pessoa: { id: string; nome: string; login: string; matricula: string; departamento: string; gestor: string | null; estacao: string };
  periodo: { de: string; ate: string };
  resumo: ResumoDoDossie;
  /** Do dia mais recente ao mais antigo. */
  dias: DiaDoDossie[];
}

export interface Dossie extends ConteudoDoDossie {
  /** Data e hora de geração (ISO). */
  geradoEm: string;
  /** SHA-256 do conteúdo, em hexadecimal. */
  codigo: string;
}

const REGRAS_ORDEM = Object.keys(REGRAS) as Regra[];

/**
 * Monta o conteúdo do dossiê. `dias` vem em ordem de data e pode trazer dias anteriores a `de`:
 * eles só servem de referência (ex.: descanso entre jornadas) e não entram no dossiê.
 */
export function montarConteudo(pessoa: PessoaDiretorio, dias: DiaDeJornada[], de: string, ate: string): ConteudoDoDossie {
  const porDia = new Map<string, OcorrenciaDoDia[]>();
  for (const o of ocorrenciasDe(dias)) {
    const lista = porDia.get(o.dia) ?? [];
    lista.push({ regra: o.regra, titulo: REGRAS[o.regra].titulo, base: REGRAS[o.regra].base, minutos: o.minutos });
    porDia.set(o.dia, lista);
  }
  const linha: DiaDoDossie[] = dias
    .filter((d) => d.dia >= de && d.dia <= ate)
    .map((d) => ({
      dia: d.dia,
      diaDaSemana: d.diaDaSemana,
      previstoInicio: d.previstoInicio,
      previstoFim: d.previstoFim,
      intervaloPrevistoMin: d.intervaloPrevistoMin,
      primeiroLogon: d.primeiroLogon,
      ultimoLogoff: d.ultimoLogoff,
      intervaloRealMin: d.intervaloRealMin,
      extraAprovadaMin: d.extraAprovadaMin,
      extraSemAprovacaoMin: d.extraSemAprovacaoMin,
      tentativasBloqueadas: d.tentativasBloqueadas,
      pausasPrevistas: d.pausasPrevistas,
      pausasFeitas: d.pausasFeitas,
      ocorrencias: porDia.get(d.dia) ?? [],
    }))
    .reverse();

  const porRegra = Object.fromEntries(REGRAS_ORDEM.map((r) => [r, 0])) as Record<Regra, number>;
  for (const d of linha) for (const o of d.ocorrencias) porRegra[o.regra] += 1;
  const soma = (f: (d: DiaDoDossie) => number) => linha.reduce((t, d) => t + f(d), 0);

  return {
    pessoa: {
      id: pessoa.id,
      nome: pessoa.nome,
      login: pessoa.login,
      matricula: pessoa.matricula,
      departamento: pessoa.departamento,
      gestor: gestorDe(pessoa)?.nome ?? null,
      estacao: pessoa.estacao,
    },
    periodo: { de, ate },
    resumo: {
      diasNoPeriodo: linha.length,
      diasComUso: linha.filter((d) => d.primeiroLogon !== null).length,
      extraAprovadaMin: soma((d) => d.extraAprovadaMin),
      extraSemAprovacaoMin: soma((d) => d.extraSemAprovacaoMin),
      tentativasBloqueadas: soma((d) => d.tentativasBloqueadas),
      pausasPrevistas: soma((d) => d.pausasPrevistas),
      pausasFeitas: soma((d) => d.pausasFeitas),
      totalOcorrencias: soma((d) => d.ocorrencias.length),
      ocorrenciasPorRegra: porRegra,
    },
    dias: linha,
  };
}

/** JSON com as chaves em ordem alfabética em todos os níveis: o mesmo conteúdo dá sempre o mesmo texto. */
export function formaCanonica(valor: unknown): string {
  if (valor === undefined) return 'null';
  if (valor === null || typeof valor !== 'object') return JSON.stringify(valor);
  if (Array.isArray(valor)) return `[${valor.map(formaCanonica).join(',')}]`;
  const o = valor as Record<string, unknown>;
  const chaves = Object.keys(o).filter((k) => o[k] !== undefined).sort();
  return `{${chaves.map((k) => `${JSON.stringify(k)}:${formaCanonica(o[k])}`).join(',')}}`;
}

/** SHA-256 (hexadecimal, 64 caracteres) da forma canônica do conteúdo. */
export async function codigoDeIntegridade(conteudo: ConteudoDoDossie): Promise<string> {
  const bytes = new TextEncoder().encode(formaCanonica(conteudo));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function montarDossie(pessoa: PessoaDiretorio, dias: DiaDeJornada[], de: string, ate: string, geradoEm: string): Promise<Dossie> {
  const conteudo = montarConteudo(pessoa, dias, de, ate);
  return { ...conteudo, geradoEm, codigo: await codigoDeIntegridade(conteudo) };
}

/* ---------- Apresentação ---------- */

const DIAS_DA_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
export const nomeDoDiaDaSemana = (n: number): string => DIAS_DA_SEMANA[n] ?? '';
/** "2026-10-09" vira "09/10/2026". */
export const dataBr = (dia: string): string => `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}`;
/** "sexta-feira, 09/10/2026". */
export const rotuloDoDia = (d: Pick<DiaDoDossie, 'dia' | 'diaDaSemana'>): string => `${nomeDoDiaDaSemana(d.diaDaSemana)}, ${dataBr(d.dia)}`;

/** Parte da barra do dia, em % da largura. */
export interface Faixa { esquerda: number; largura: number }
export type TipoDeFaixa = 'normal' | 'extraAprovada' | 'extraSemAprovacao';
export interface BarraDoDia {
  previsto: Faixa | null;
  faixas: (Faixa & { tipo: TipoDeFaixa })[];
}

/** A barra mostra das 5h às 23h. */
export const ESCALA = { inicio: 5 * 60, fim: 23 * 60 } as const;
const emPercentual = (min: number): number => {
  const p = ((Math.min(Math.max(min, ESCALA.inicio), ESCALA.fim) - ESCALA.inicio) / (ESCALA.fim - ESCALA.inicio)) * 100;
  return Math.round(p * 100) / 100;
};
const faixa = (de: number, ate: number): Faixa | null => {
  if (ate <= de) return null;
  const esquerda = emPercentual(de);
  return { esquerda, largura: Math.max(0.8, Math.round((emPercentual(ate) - esquerda) * 100) / 100) };
};

/**
 * Previsto × realizado × hora extra de um dia. O que fica dentro da jornada é "normal";
 * o que passa dela (antes ou depois) é hora extra, primeiro a aprovada e o resto sem aprovação.
 * Sem jornada prevista (fim de semana), todo o uso conta como sem aprovação.
 */
export function barraDoDia(d: DiaDoDossie): BarraDoDia {
  const pi = d.previstoInicio ? emMinutos(d.previstoInicio) : null;
  const pf = d.previstoFim ? emMinutos(d.previstoFim) : null;
  const previsto = pi !== null && pf !== null ? faixa(pi, pf) : null;
  const faixas: BarraDoDia['faixas'] = [];
  if (!d.primeiroLogon || !d.ultimoLogoff) return { previsto, faixas };
  const logon = emMinutos(d.primeiroLogon);
  const logoff = emMinutos(d.ultimoLogoff);
  const poe = (tipo: TipoDeFaixa, de: number, ate: number) => {
    const f = faixa(de, ate);
    if (f) faixas.push({ ...f, tipo });
  };
  if (pi === null || pf === null) {
    poe('extraSemAprovacao', logon, logoff);
    return { previsto, faixas };
  }
  poe('normal', Math.max(logon, pi), Math.min(logoff, pf));
  const antes = Math.max(0, pi - logon);
  const depois = Math.max(0, logoff - pf);
  let aprovada = d.extraAprovadaMin;
  if (antes > 0) {
    poe('extraAprovada', logon, pi);
    aprovada -= antes;
  }
  if (depois > 0) {
    const comAprovacao = Math.min(Math.max(aprovada, 0), depois);
    poe('extraAprovada', pf, pf + comAprovacao);
    poe('extraSemAprovacao', pf + comAprovacao, logoff);
  }
  return { previsto, faixas };
}

const duracao = (m: number): string => {
  const r = Math.round(m);
  if (r < 60) return `${r} min`;
  return r % 60 === 0 ? `${r / 60}h` : `${Math.floor(r / 60)}h${String(r % 60).padStart(2, '0')}`;
};

/** Texto alternativo da barra do dia. */
export function textoDaBarra(d: DiaDoDossie): string {
  const previsto = d.previstoInicio && d.previstoFim ? `Jornada prevista das ${d.previstoInicio} às ${d.previstoFim}.` : 'Sem jornada prevista.';
  if (!d.primeiroLogon || !d.ultimoLogoff) return `${previsto} Sem uso da estação.`;
  const extra = d.extraAprovadaMin + d.extraSemAprovacaoMin;
  const partes = [`${previsto} Estação usada das ${d.primeiroLogon} às ${d.ultimoLogoff}.`];
  if (extra > 0) {
    const sem = d.extraSemAprovacaoMin > 0 ? `, sendo ${duracao(d.extraSemAprovacaoMin)} sem aprovação` : ', todas com aprovação';
    partes.push(`${duracao(extra)} além da jornada${sem}.`);
  } else {
    partes.push('Sem horas além da jornada.');
  }
  return partes.join(' ');
}

export const nomeDoArquivo = (login: string, de: string, ate: string): string => `dossie-${login}-${de}-a-${ate}`;
