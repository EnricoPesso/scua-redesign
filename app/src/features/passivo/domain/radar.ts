import {
  custoDaHoraExtra,
  custoDaOcorrencia,
  ocorrenciasDe,
  REGRAS,
  type Ocorrencia,
  type ParametrosDeCusto,
  type Regra,
} from '../../../lib/conformidade';
import { isoDia } from '../../../mock/datas';
import { pessoaPorId, type PessoaDiretorio } from '../../../mock/diretorio';
import type { DiaDeJornada } from '../../../mock/jornadaReal';

/** Períodos que a tela oferece, em dias fechados (até ontem). */
export const PERIODOS = [7, 15, 30] as const;
export type Periodo = (typeof PERIODOS)[number];
export const PERIODO_PADRAO: Periodo = 30;

/** Chave do grupo "sem gestor" (quem está no topo da hierarquia). */
export const SEM_GESTOR = 'sem-gestor';

export interface OcorrenciaComCusto extends Ocorrencia {
  /** Valor estimado em R$. */
  custo: number;
  gestorId: string | null;
  diretoria: string;
}

export interface TotalPorRegra { regra: Regra; titulo: string; base: string; custo: number; ocorrencias: number }
export interface TotalPorGestor { gestorId: string; nome: string; custo: number; ocorrencias: number; pessoas: number }
export interface TotalPorDiretoria { diretoria: string; custo: number; ocorrencias: number; pessoas: number }
export interface TotalPorSemana { inicio: string; custo: number; evitado: number; ocorrencias: number }
export interface LinhaDoRanking {
  pessoaId: string;
  nome: string;
  diretoria: string;
  gestorNome: string;
  custo: number;
  ocorrencias: number;
  minutosSemAprovacao: number;
  evitado: number;
}

export interface ResumoRadar {
  /** Soma do custo de todas as ocorrências, em R$. */
  emRisco: number;
  /** Hora extra que o bloqueio impediu de acontecer, em R$. */
  evitado: number;
  minutosSemAprovacao: number;
  pessoasEnvolvidas: number;
  tentativasBarradas: number;
  /** Todas as ocorrências, da mais recente para a mais antiga. */
  ocorrencias: OcorrenciaComCusto[];
  porRegra: TotalPorRegra[];
  porGestor: TotalPorGestor[];
  porDiretoria: TotalPorDiretoria[];
  porSemana: TotalPorSemana[];
  ranking: LinhaDoRanking[];
}

export interface EntradaRadar {
  /** Dias fechados de todas as pessoas no período. */
  dias: DiaDeJornada[];
  /** Custo de uma hora normal, por pessoa. */
  custoHora: Record<string, number>;
  pessoas: PessoaDiretorio[];
  parametros: ParametrosDeCusto;
  /** Só esta diretoria. Vazio = todas. */
  diretoria?: string;
}

/** Segunda-feira da semana de `dia` (YYYY-MM-DD). */
export function inicioDaSemana(dia: string): string {
  const d = new Date(`${dia}T12:00:00`);
  return isoDia(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7), 12));
}

const porValorDesc = <T extends { custo: number }>(a: T, b: T) => b.custo - a.custo;

/**
 * Põe preço no risco: custo das ocorrências por pessoa (regras da CLT), o que o bloqueio evitou e as quebras
 * por regra, gestor, diretoria, pessoa e semana. Os valores são estimativas, não cálculo de folha.
 */
export function calcularRadar({ dias, custoHora, pessoas, parametros, diretoria }: EntradaRadar): ResumoRadar {
  const alvo = pessoas.filter((p) => !diretoria || p.diretoria === diretoria);
  const porPessoa = new Map<string, DiaDeJornada[]>(alvo.map((p) => [p.id, []]));
  for (const d of dias) porPessoa.get(d.pessoaId)?.push(d);

  const ocorrencias: OcorrenciaComCusto[] = [];
  const ranking: LinhaDoRanking[] = [];
  const semanas = new Map<string, TotalPorSemana>();
  const semana = (dia: string) => {
    const inicio = inicioDaSemana(dia);
    let s = semanas.get(inicio);
    if (!s) semanas.set(inicio, (s = { inicio, custo: 0, evitado: 0, ocorrencias: 0 }));
    return s;
  };
  let evitado = 0;
  let minutosSemAprovacao = 0;
  let tentativasBarradas = 0;

  for (const pessoa of alvo) {
    const seus = (porPessoa.get(pessoa.id) ?? []).slice().sort((a, b) => a.dia.localeCompare(b.dia));
    const hora = custoHora[pessoa.id] ?? 0;
    for (const d of seus) semana(d.dia);

    const dela = ocorrenciasDe(seus).map<OcorrenciaComCusto>((o) => ({
      ...o,
      custo: custoDaOcorrencia(o, hora, parametros),
      gestorId: pessoa.gestorId,
      diretoria: pessoa.diretoria,
    }));
    let evitadoDela = 0;
    let semAprovacaoDela = 0;
    for (const d of seus) {
      // O que o bloqueio barrou seria hora extra; domingo vale o adicional de descanso.
      const valor = custoDaHoraExtra(d.minutosEvitados, hora, parametros, d.diaDaSemana === 0);
      evitadoDela += valor;
      semana(d.dia).evitado += valor;
      semAprovacaoDela += d.extraSemAprovacaoMin;
      tentativasBarradas += d.tentativasBloqueadas;
    }
    for (const o of dela) {
      const s = semana(o.dia);
      s.custo += o.custo;
      s.ocorrencias += 1;
    }
    evitado += evitadoDela;
    minutosSemAprovacao += semAprovacaoDela;
    ocorrencias.push(...dela);

    if (dela.length > 0) {
      ranking.push({
        pessoaId: pessoa.id,
        nome: pessoa.nome,
        diretoria: pessoa.diretoria,
        gestorNome: pessoa.gestorId ? (pessoaPorId(pessoa.gestorId)?.nome ?? '—') : '—',
        custo: dela.reduce((t, o) => t + o.custo, 0),
        ocorrencias: dela.length,
        minutosSemAprovacao: semAprovacaoDela,
        evitado: evitadoDela,
      });
    }
  }

  const soma = (lista: OcorrenciaComCusto[]) => lista.reduce((t, o) => t + o.custo, 0);

  const porRegra = (Object.keys(REGRAS) as Regra[])
    .map<TotalPorRegra>((regra) => {
      const dela = ocorrencias.filter((o) => o.regra === regra);
      return { regra, titulo: REGRAS[regra].titulo, base: REGRAS[regra].base, custo: soma(dela), ocorrencias: dela.length };
    })
    .sort(porValorDesc);

  const gestores = new Map<string, OcorrenciaComCusto[]>();
  const diretorias = new Map<string, OcorrenciaComCusto[]>();
  for (const o of ocorrencias) {
    const g = o.gestorId ?? SEM_GESTOR;
    gestores.set(g, [...(gestores.get(g) ?? []), o]);
    diretorias.set(o.diretoria, [...(diretorias.get(o.diretoria) ?? []), o]);
  }
  const qtdPessoas = (lista: OcorrenciaComCusto[]) => new Set(lista.map((o) => o.pessoaId)).size;
  const porGestor = [...gestores].map<TotalPorGestor>(([gestorId, lista]) => ({
    gestorId,
    nome: gestorId === SEM_GESTOR ? 'Sem gestor definido' : (pessoaPorId(gestorId)?.nome ?? '—'),
    custo: soma(lista),
    ocorrencias: lista.length,
    pessoas: qtdPessoas(lista),
  })).sort(porValorDesc);
  const porDiretoria = [...diretorias].map<TotalPorDiretoria>(([d, lista]) => ({
    diretoria: d, custo: soma(lista), ocorrencias: lista.length, pessoas: qtdPessoas(lista),
  })).sort(porValorDesc);

  ocorrencias.sort((a, b) => b.dia.localeCompare(a.dia) || b.custo - a.custo);
  ranking.sort((a, b) => b.custo - a.custo || a.nome.localeCompare(b.nome, 'pt-BR'));

  return {
    emRisco: soma(ocorrencias),
    evitado,
    minutosSemAprovacao,
    pessoasEnvolvidas: ranking.length,
    tentativasBarradas,
    ocorrencias,
    porRegra,
    porGestor,
    porDiretoria,
    porSemana: [...semanas.values()].sort((a, b) => a.inicio.localeCompare(b.inicio)),
    ranking,
  };
}

export interface AlvoDoDetalhe { tipo: 'gestor' | 'pessoa'; id: string }

/** As ocorrências que formam o valor de um gestor (todos os liderados) ou de uma pessoa. */
export function ocorrenciasDoAlvo(r: ResumoRadar, alvo: AlvoDoDetalhe): OcorrenciaComCusto[] {
  return r.ocorrencias.filter((o) => (alvo.tipo === 'pessoa' ? o.pessoaId === alvo.id : (o.gestorId ?? SEM_GESTOR) === alvo.id));
}

/** Os `n` gestores com mais valor em risco (só os que têm algum). */
export const principaisGestores = (r: ResumoRadar, n = 3): TotalPorGestor[] => r.porGestor.filter((g) => g.custo > 0).slice(0, n);

/** Interpreta "gestor:u-carlos" ou "pessoa:u-ana" (parâmetro `abrir` da URL); qualquer outra coisa é ignorada. */
export function lerAlvo(texto: string | null): AlvoDoDetalhe | null {
  const [tipo, id] = (texto ?? '').split(':');
  if (!id) return null;
  if (tipo === 'pessoa' && pessoaPorId(id)) return { tipo, id };
  if (tipo === 'gestor' && (id === SEM_GESTOR || pessoaPorId(id))) return { tipo, id };
  return null;
}
