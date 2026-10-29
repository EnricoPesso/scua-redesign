import { cn } from "@/lib/utils"
import { ModeloRelatorio } from "@/modelos/relatorio"
import { HOJE } from "./dados"
import { configLiberacoes } from "./liberacoes"
import { estadoAtual, estados } from "./simular"
import { configTentativas } from "./tentativas"

// Exemplos do modelo único de relatório (variante A, escolhida em 2026-10-29).
// ?r=tentativas|liberacoes escolhe o relatório; ?estado=carregando|vazio|erro força um estado.

const relatorios = {
  tentativas: { nome: "Tentativas fora da jornada", pagina: <ModeloRelatorio config={configTentativas} hoje={HOJE} /> },
  liberacoes: { nome: "Liberações e bloqueios", pagina: <ModeloRelatorio config={configLiberacoes} hoje={HOJE} /> },
}

type Chave = keyof typeof relatorios

function relatorioAtual(): Chave {
  return new URLSearchParams(location.search).get("r") === "liberacoes" ? "liberacoes" : "tentativas"
}

const linkClass = "inline-flex min-h-10 items-center rounded-md px-3 font-semibold hover:bg-card focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"

export function Prototipos() {
  const atual = relatorioAtual()
  const estado = estadoAtual()
  const href = (r: Chave, e: string) => (e === "normal" ? `?r=${r}` : `?r=${r}&estado=${e}`)
  return (
    <>
      <nav aria-label="Exemplos do modelo de relatório" className="border-b border-border bg-[var(--color-surface-muted)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Modelo de relatório</p>
          <ul className="flex flex-wrap gap-1">
            {(Object.keys(relatorios) as Chave[]).map((k) => (
              <li key={k}>
                <a href={href(k, estado)} aria-current={k === atual ? "page" : undefined} className={cn(linkClass, "text-sm text-foreground", k === atual && "bg-card shadow-[var(--shadow-1)]")}>
                  {relatorios[k].nome}
                </a>
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap items-center gap-1 sm:ml-auto" aria-label="Simular estado">
            {estados.map((s) => (
              <li key={s}>
                <a
                  href={href(atual, s)}
                  aria-current={s === estado ? "true" : undefined}
                  className={cn(linkClass, "px-2.5 text-xs text-muted-foreground capitalize", s === estado && "bg-card text-foreground shadow-[var(--shadow-1)]")}
                >
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {relatorios[atual].pagina}
    </>
  )
}
