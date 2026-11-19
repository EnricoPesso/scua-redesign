/**
 * Peças comuns dos dados de exemplo dos relatórios: pessoas, ruído determinístico, período e filtros.
 * Nada aqui usa Math.random: o mesmo dia gera sempre os mesmos números.
 */
import { lerLista, periodoDe, type FiltroDef, type ValoresFiltro } from '@/lib/relatorio';
import { dia, quando } from '../../../mock/datas';
import { redeCancelavel } from '../../../mock/rede';
import { OPCOES_GESTORES, OPCOES_PESSOAS, gestorDe, type PessoaDiretorio } from '../../../mock/diretorio';
import { horaDe } from './formatacao';

export const SEM_GESTOR = 'Sem gestor';

/** Quem é a pessoa da linha: base comum dos relatórios por colaborador. */
export interface Identidade {
  pessoaId: string;
  colaborador: string;
  gestorId: string;
  gestor: string;
  area: string;
  departamento: string;
  estacao: string;
}

export function identidade(p: PessoaDiretorio): Identidade {
  const g = gestorDe(p);
  return { pessoaId: p.id, colaborador: p.nome, gestorId: g?.id ?? '', gestor: g?.nome ?? SEM_GESTOR, area: p.diretoria, departamento: p.departamento, estacao: p.estacao };
}

/** Número entre 0 e 1 que só depende dos argumentos (hash simples). */
export function ruido(...partes: number[]): number {
  let h = 2166136261;
  for (const x of partes) {
    h ^= x;
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Sábado e domingo não entram na jornada. `n` = dias a partir de hoje (negativo = passado). */
export function ehDiaUtil(n: number): boolean {
  const d = new Date(`${dia(n)}T12:00:00`).getDay();
  return d !== 0 && d !== 6;
}

/** Instante ISO local: `instante(-2, 8 * 60 + 30)` → "<anteontem>T08:30:00". */
export const instante = (n: number, minutosDoDia: number): string => quando(n, horaDe(Math.min(minutosDoDia, 1439)));

/** A data (parte do dia) está dentro do período do filtro? Sem período, sempre. */
export function noPeriodo(iso: string, f: ValoresFiltro): boolean {
  const p = periodoDe(f);
  if (!p) return true;
  const d = iso.slice(0, 10);
  return d >= p.inicio && d <= p.fim;
}

export const FILTRO_COLABORADORES: FiltroDef = { tipo: 'multi', chave: 'colaboradores', rotulo: 'Colaboradores', opcoes: OPCOES_PESSOAS };
export const FILTRO_GESTORES: FiltroDef = { tipo: 'multi', chave: 'gestores', rotulo: 'Gestores', opcoes: OPCOES_GESTORES };

/** Aplica os filtros "Colaboradores" e "Gestores" (vazio = todos). */
export function porPessoa<T extends { pessoaId: string; gestorId: string }>(rows: T[], f: ValoresFiltro): T[] {
  const cs = lerLista(f, 'colaboradores');
  const gs = lerLista(f, 'gestores');
  return rows.filter((r) => (!cs.length || cs.includes(r.pessoaId)) && (!gs.length || gs.includes(r.gestorId)));
}

/** O `buscar` padrão dos relatórios: filtra os dados de exemplo com atraso e falha simulados. */
export const buscarEm = <T>(filtrar: (f: ValoresFiltro) => T[]) => (f: ValoresFiltro, signal: AbortSignal): Promise<T[]> =>
  redeCancelavel(() => filtrar(f), signal);
