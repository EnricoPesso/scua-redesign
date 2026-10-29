import type { ValoresFiltro } from "@/modelos/relatorio"

// Simula a API: atraso de rede e ?estado=carregando|vazio|erro para revisar cada estado.

export const estados = ["normal", "carregando", "vazio", "erro"] as const
export type Estado = (typeof estados)[number]

export function estadoAtual(): Estado {
  const e = new URLSearchParams(location.search).get("estado")
  return estados.find((s) => s === e) ?? "normal"
}

const ATRASO_MS = 700

export function simular<T>(filtrar: (rows: T[], f: ValoresFiltro) => T[], rows: T[]) {
  return (f: ValoresFiltro, signal: AbortSignal) =>
    new Promise<T[]>((resolve, reject) => {
      const estado = estadoAtual()
      if (estado === "carregando") return
      const id = window.setTimeout(() => {
        if (estado === "erro") reject(new Error("Falha simulada"))
        else resolve(estado === "vazio" ? [] : filtrar(rows, f))
      }, ATRASO_MS)
      signal.addEventListener("abort", () => window.clearTimeout(id))
    })
}

// Ajudantes para os filtros dos exemplos.
export const lista = (f: ValoresFiltro, chave: string) => (Array.isArray(f[chave]) ? (f[chave] as string[]) : [])
export const texto = (f: ValoresFiltro, chave: string) => (typeof f[chave] === "string" ? (f[chave] as string) : "")
export const noPeriodo = (iso: string, f: ValoresFiltro) => {
  const dia = iso.slice(0, 10)
  return dia >= texto(f, "inicio") && dia <= texto(f, "fim")
}
