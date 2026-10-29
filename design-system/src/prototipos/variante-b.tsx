import { useState } from "react"
import { SlidersHorizontalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { BotaoExportar, CamposFiltro, ChipsAtivos, Kpis, Tabela, Trilha } from "./compartilhado"
import { TITULO } from "./colunas"
import { useRelatorio, type Relatorio } from "./use-relatorio"

// B) Filtros na lateral: coluna fixa no desktop, drawer no tablet/celular, chips dos filtros ativos.
export function VarianteB() {
  const r = useRelatorio()
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:py-8">
      <aside className="hidden lg:block">
        <form
          aria-label="Filtros"
          className="sticky top-6 flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-1)]"
          onSubmit={(e) => {
            e.preventDefault()
            if (!r.periodoInvalido) r.filtrar()
          }}
        >
          <h2 className="font-heading text-base font-bold text-foreground">Filtros</h2>
          <CamposFiltro r={r} empilhado />
          <AcoesFiltro r={r} />
        </form>
      </aside>

      <main className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Trilha />
            <h1 className="font-heading text-xl font-bold text-foreground">{TITULO}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="lg:hidden" onClick={() => setDrawer(true)}>
              <SlidersHorizontalIcon aria-hidden="true" />
              Filtros{r.qtdFiltrosAtivos ? ` (${r.qtdFiltrosAtivos})` : ""}
            </Button>
            <BotaoExportar r={r} />
          </div>
        </header>

        <ChipsAtivos r={r} />
        <Kpis r={r} className="lg:grid-cols-2 xl:grid-cols-4" />
        <Tabela r={r} />
      </main>

      <Drawer
        open={drawer}
        onOpenChange={setDrawer}
        title="Filtros"
        footer={
          <AcoesFiltro
            r={r}
            aoFiltrar={() => setDrawer(false)}
          />
        }
      >
        <CamposFiltro r={r} empilhado />
      </Drawer>
    </div>
  )
}

function AcoesFiltro({ r, aoFiltrar }: { r: Relatorio; aoFiltrar?: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="ghost" onClick={r.limpar}>
        Limpar
      </Button>
      <Button
        type={aoFiltrar ? "button" : "submit"}
        loading={r.carregando}
        disabled={r.periodoInvalido}
        onClick={
          aoFiltrar
            ? () => {
                r.filtrar()
                aoFiltrar()
              }
            : undefined
        }
      >
        Filtrar
      </Button>
    </div>
  )
}
