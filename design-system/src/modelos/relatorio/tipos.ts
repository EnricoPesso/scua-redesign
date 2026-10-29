import type { Column } from "@/components/ui/data-table"
import type { FiltroDef, ValoresFiltro } from "@/lib/relatorio"

export type { FiltroDef, ValoresFiltro }

// Contrato do modelo único de relatório: cada relatório só declara filtros, KPIs, colunas e
// como buscar os dados. Layout, estados (carregando, vazio, erro) e exportação vêm do modelo.

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
  // Destino do "Relatórios" na trilha; sem ele, vira texto (a lista ainda não existe).
  linkRelatorios?: string
  arquivo: string
  filtros: FiltroDef[]
  kpis: KpiDef<T>[]
  colunas: ColunaRelatorio<T>[]
  buscar: (filtros: ValoresFiltro, signal: AbortSignal) => Promise<T[]>
  vazio?: string
}
