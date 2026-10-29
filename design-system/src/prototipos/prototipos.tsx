import { cn } from "@/lib/utils"
import { VarianteA } from "./variante-a"
import { simulacoes } from "./use-relatorio"

// Página do protótipo do modelo único de relatório (variante A, escolhida em 2026-10-29).
// ?estado=carregando|vazio|erro força um estado para revisão e screenshot.

export function Prototipos() {
  const estado = new URLSearchParams(location.search).get("estado") ?? "normal"
  return (
    <>
      <nav aria-label="Estados do protótipo" className="border-b border-border bg-[var(--color-surface-muted)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Protótipo · Modelo de relatório</p>
          <ul className="flex flex-wrap items-center gap-1 sm:ml-auto" aria-label="Simular estado">
            {simulacoes.map((s) => (
              <li key={s}>
                <a
                  href={s === "normal" ? "?" : `?estado=${s}`}
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
      <VarianteA />
    </>
  )
}
