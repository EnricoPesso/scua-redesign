import type { FiltroDef, ValoresFiltro } from "../modelos/relatorio/tipos.ts"

// Regras puras do modelo de relatório (sem React), para poderem ser testadas com node --test.

export function hojeIso(agora = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`
}

export function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + dias)
  return hojeIso(d)
}

export function valoresPadrao(filtros: FiltroDef[], hoje: string): ValoresFiltro {
  const v: ValoresFiltro = {}
  for (const f of filtros) {
    if (f.tipo === "periodo") {
      v.inicio = somarDias(hoje, -(f.dias - 1))
      v.fim = hoje
    } else {
      v[f.chave] = f.tipo === "multi" ? [] : ""
    }
  }
  return v
}

export function erroPeriodo(filtros: FiltroDef[], v: ValoresFiltro): string | undefined {
  if (!filtros.some((f) => f.tipo === "periodo")) return undefined
  const { inicio, fim } = v
  if (!inicio || !fim) return "Informe as duas datas."
  if (inicio > fim) return "A data final precisa ser igual ou posterior à inicial."
  return undefined
}

// Conta só os filtros que o usuário escolheu (o período sempre existe e não conta).
export function contarFiltrosAtivos(filtros: FiltroDef[], v: ValoresFiltro): number {
  return filtros.reduce((n, f) => {
    if (f.tipo === "periodo") return n
    const valor = v[f.chave]
    return n + (Array.isArray(valor) ? valor.length : valor ? 1 : 0)
  }, 0)
}

export function formatarDataBr(iso: string): string {
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}

export function nomeArquivo(base: string, v: ValoresFiltro): string {
  const { inicio, fim } = v
  return typeof inicio === "string" && typeof fim === "string" && inicio && fim ? `${base}_${inicio}_a_${fim}.csv` : `${base}.csv`
}
