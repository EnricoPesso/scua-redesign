import { Button } from "@/components/ui/button"
import { BotaoExportar, CamposFiltro, Kpis, Tabela, Trilha } from "./compartilhado"
import { TITULO } from "./colunas"
import { useRelatorio } from "./use-relatorio"

// A) Barra no topo: filtros numa faixa, KPIs em linha, tabela larga. Abre com os últimos 7 dias.
export function VarianteA() {
  const r = useRelatorio()
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Trilha />
          <h1 className="font-heading text-xl font-bold text-foreground">{TITULO}</h1>
        </div>
        <BotaoExportar r={r} />
      </header>

      <form
        aria-label="Filtros"
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)] sm:p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!r.periodoInvalido) r.filtrar()
        }}
      >
        <CamposFiltro r={r} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={r.limpar}>
            Limpar
          </Button>
          <Button type="submit" loading={r.carregando} disabled={r.periodoInvalido}>
            Filtrar
          </Button>
        </div>
      </form>

      <Kpis r={r} />
      <Tabela r={r} />
    </main>
  )
}
