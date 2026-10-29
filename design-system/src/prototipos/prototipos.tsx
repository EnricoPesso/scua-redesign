import { cn } from "@/lib/utils"
import { VarianteA } from "./variante-a"
import { VarianteB } from "./variante-b"
import { VarianteC } from "./variante-c"
import { simulacoes } from "./use-relatorio"

// Página de comparação dos protótipos do modelo único de relatório.
// ?v=a|b|c escolhe a variante (o link fica estável para screenshot e revisão).

const variantes = {
  a: { nome: "A · Barra no topo", Componente: VarianteA },
  b: { nome: "B · Filtros na lateral", Componente: VarianteB },
  c: { nome: "C · Resposta primeiro", Componente: VarianteC },
} as const

type Chave = keyof typeof variantes

function lerVariante(): Chave {
  const v = new URLSearchParams(location.search).get("v")
  return v === "b" || v === "c" ? v : "a"
}

export function Prototipos() {
  const atual = lerVariante()
  const { Componente } = variantes[atual]
  const estado = new URLSearchParams(location.search).get("estado") ?? "normal"
  return (
    <>
      <nav aria-label="Variantes do protótipo" className="border-b border-border bg-[var(--color-surface-muted)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Protótipo · Modelo de relatório</p>
          <ul className="flex flex-wrap gap-1">
            {(Object.keys(variantes) as Chave[]).map((k) => (
              <li key={k}>
                <a
                  href={`?v=${k}`}
                  aria-current={k === atual ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-foreground hover:bg-card focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                    k === atual && "bg-card shadow-[var(--shadow-1)]",
                  )}
                >
                  {variantes[k].nome}
                </a>
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap items-center gap-1 sm:ml-auto" aria-label="Simular estado">
            {simulacoes.map((s) => (
              <li key={s}>
                <a
                  href={s === "normal" ? `?v=${atual}` : `?v=${atual}&estado=${s}`}
                  aria-current={s === estado ? "true" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-md px-2.5 text-xs font-semibold text-muted-foreground capitalize hover:bg-card focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                    s === estado && "bg-card text-foreground shadow-[var(--shadow-1)]",
                  )}
                >
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {/* key força estado limpo ao trocar de variante */}
      <Componente key={atual} />
    </>
  )
}
