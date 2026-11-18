import { DEPARTAMENTOS, GESTORES_IDS } from '../dados';
import type { Usuario } from './tipos';

export const TAMANHOS_PAGINA = [10, 25, 50];
// 10 por página: a lista cabe na tela sem rolar muito; quem quiser mais escolhe no seletor.
export const TAMANHO_PADRAO = 10;
export type Situacao = 'ativos' | 'inativos' | 'todos';
const SITUACOES: Situacao[] = ['ativos', 'inativos', 'todos'];

export interface FiltrosUsuarios {
  busca: string;
  /** Id do gestor ou texto vazio. */
  gestor: string;
  departamento: string;
  situacao: Situacao;
  pagina: number;
  tamanho: number;
}

export const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Lê os filtros da URL. Qualquer valor inválido (editado à mão) cai no padrão. */
export function lerFiltros(params: URLSearchParams): FiltrosUsuarios {
  const gestor = params.get('gestor') ?? '';
  const departamento = params.get('departamento') ?? '';
  const situacao = params.get('situacao') as Situacao;
  const pagina = Number(params.get('pagina'));
  const tamanho = Number(params.get('tamanho'));
  return {
    busca: (params.get('busca') ?? '').trim(),
    gestor: GESTORES_IDS.includes(gestor) ? gestor : '',
    departamento: DEPARTAMENTOS.includes(departamento) ? departamento : '',
    situacao: SITUACOES.includes(situacao) ? situacao : 'ativos',
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
    tamanho: TAMANHOS_PAGINA.includes(tamanho) ? tamanho : TAMANHO_PADRAO,
  };
}

/** Há algum filtro além da situação padrão? (Mostrar "Limpar filtros" e o texto "com esses filtros".) */
export function temFiltro(f: FiltrosUsuarios): boolean {
  return Boolean(f.busca || f.gestor || f.departamento || f.situacao !== 'ativos');
}

/** Só os filtros que realmente restringem a lista (a situação "Todos" não conta). */
export function restringe(f: FiltrosUsuarios): boolean {
  return Boolean(f.busca || f.gestor || f.departamento || f.situacao === 'inativos');
}

export function filtrarUsuarios(usuarios: Usuario[], f: FiltrosUsuarios): Usuario[] {
  const termo = semAcento(f.busca.trim());
  return usuarios.filter((u) => {
    if (f.situacao === 'ativos' && !u.ativo) return false;
    if (f.situacao === 'inativos' && u.ativo) return false;
    if (f.gestor && u.gestorId !== f.gestor) return false;
    if (f.departamento && u.departamento !== f.departamento) return false;
    if (termo && !semAcento(`${u.nome} ${u.login}`).includes(termo)) return false;
    return true;
  });
}

/** "24 usuários" ou "3 usuários com esses filtros". */
export function textoContagem(total: number, f: FiltrosUsuarios): string {
  const base = `${total} ${total === 1 ? 'usuário' : 'usuários'}`;
  return restringe(f) ? `${base} com esses filtros` : base;
}
