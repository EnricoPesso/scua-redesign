import type { Column } from "@/components/ui/data-table"
import type { Option } from "@/components/ui/select"

// Contrato do modelo único de relatório: cada relatório só declara filtros, KPIs, colunas e
// como buscar os dados. Layout, estados (carregando, vazio, erro) e exportação vêm do modelo.

export type FiltroDef =
  | { tipo: "multi"; chave: string; rotulo: string; opcoes: Option[] }
  | { tipo: "select"; chave: string; rotulo: string; opcoes: Option[] }
  | { tipo: "texto"; chave: string; rotulo: string; placeholder?: string }
  // Sempre grava em "inicio" e "fim"; dias = tamanho do período padrão, terminando hoje.
  | { tipo: "periodo"; dias: number }

// multi → string[]; select/texto/período → string ("" = sem filtro).
export type ValoresFiltro = Record<string, string | string[]>

export type KpiDef<T> = {
  rotulo: string
  valor: (rows: T[]) => number
  decimais?: number
  unidade?: string
}

// texto: como a coluna sai no CSV. Sem ele, usa o valor bruto do campo.
export type ColunaRelatorio<T> = Column<T> & { texto?: (row: T) => string }

export type ConfigRelatorio<T> = {
  titulo: string
  grupo: string
  arquivo: string
  filtros: FiltroDef[]
  kpis: KpiDef<T>[]
  colunas: ColunaRelatorio<T>[]
  buscar: (filtros: ValoresFiltro, signal: AbortSignal) => Promise<T[]>
  vazio?: string
}
