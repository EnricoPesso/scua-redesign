// Regras puras do modelo de relatório (sem React nem alias @/), para rodarem com node --test.

type Opcao = { value: string; label: string }

export type FiltroDef =
  | { tipo: "multi"; chave: string; rotulo: string; opcoes: Opcao[] }
  | { tipo: "select"; chave: string; rotulo: string; opcoes: Opcao[] }
  | { tipo: "texto"; chave: string; rotulo: string; placeholder?: string }
  // Sempre grava em "inicio" e "fim"; dias = tamanho do período padrão, terminando hoje.
  | { tipo: "periodo"; dias: number }

// multi → string[]; select/texto/período → string ("" = sem filtro).
export type ValoresFiltro = Record<string, string | string[]>

export const lerTexto = (v: ValoresFiltro, chave: string): string => (typeof v[chave] === "string" ? (v[chave] as string) : "")
export const lerLista = (v: ValoresFiltro, chave: string): string[] => (Array.isArray(v[chave]) ? (v[chave] as string[]) : [])

// Período completo ou undefined (relatório sem período, ou uma das datas em branco).
export function periodoDe(v: ValoresFiltro): { inicio: string; fim: string } | undefined {
  const inicio = lerTexto(v, "inicio")
  const fim = lerTexto(v, "fim")
  return inicio && fim ? { inicio, fim } : undefined
}

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
  const p = periodoDe(v)
  if (!p) return "Informe as duas datas."
  if (p.inicio > p.fim) return "A data final precisa ser igual ou posterior à inicial."
  return undefined
}

export function formatarDataBr(iso: string): string {
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}

export function nomeArquivo(base: string, v: ValoresFiltro): string {
  const p = periodoDe(v)
  return p ? `${base}_${p.inicio}_a_${p.fim}.csv` : `${base}.csv`
}
