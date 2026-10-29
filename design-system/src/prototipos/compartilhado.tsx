import { DownloadIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { DateField } from "@/components/ui/date-field"
import { ErrorState } from "@/components/ui/error-state"
import { KpiCard } from "@/components/ui/kpi-card"
import { MultiSelect } from "@/components/ui/multi-select"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { colaboradores, gestores } from "./dados"
import { colunas, periodoTexto, TITULO } from "./colunas"
import type { Relatorio } from "./use-relatorio"

export function Trilha() {
  return (
    <nav aria-label="Trilha" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <a href="#" className="rounded-sm text-[var(--color-brand-text)] underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
            Relatórios
          </a>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">Bloqueios e liberações</li>
      </ol>
    </nav>
  )
}

export function BotaoExportar({ r, className }: { r: Relatorio; className?: string }) {
  const toast = useToast()
  const semDados = r.carregando || r.erro || r.rows.length === 0
  return (
    <Button
      variant="secondary"
      className={className}
      disabled={semDados}
      onClick={() => toast.success(`Exportando ${r.rows.length} registros em CSV`)}
    >
      <DownloadIcon aria-hidden="true" />
      Exportar CSV
    </Button>
  )
}

export function CamposFiltro({ r, empilhado = false }: { r: Relatorio; empilhado?: boolean }) {
  const set = r.setRascunho
  return (
    <div className={cn("grid gap-4", empilhado ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
      <MultiSelect
        label="Colaboradores"
        placeholder="Todos"
        options={colaboradores}
        values={r.rascunho.colaboradores}
        onValuesChange={(v) => set({ ...r.rascunho, colaboradores: v })}
      />
      <MultiSelect
        label="Gestores"
        placeholder="Todos"
        options={gestores}
        values={r.rascunho.gestores}
        onValuesChange={(v) => set({ ...r.rascunho, gestores: v })}
      />
      <DateField label="Data inicial" value={r.rascunho.inicio} max={r.rascunho.fim} onChange={(v) => set({ ...r.rascunho, inicio: v })} />
      <DateField
        label="Data final"
        value={r.rascunho.fim}
        min={r.rascunho.inicio}
        onChange={(v) => set({ ...r.rascunho, fim: v })}
        error={r.periodoInvalido ? "A data final precisa ser igual ou posterior à inicial." : undefined}
      />
    </div>
  )
}

export function Kpis({ r, className }: { r: Relatorio; className?: string }) {
  const periodo = periodoTexto(r)
  // Em erro os números não são confiáveis: mostra "Sem dados" em vez do último valor.
  const vazio = !r.carregando && (r.erro || r.rows.length === 0)
  const comum = { period: periodo, loading: r.carregando, empty: vazio }
  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      <KpiCard label="Tentativas" value={r.kpis.total} {...comum} />
      <KpiCard label="Colaboradores" value={r.kpis.colaboradores} {...comum} />
      <KpiCard label="Gestores com equipe envolvida" value={r.kpis.gestores} {...comum} />
      <KpiCard label="Média por colaborador" value={r.kpis.media} decimals={1} {...comum} />
    </div>
  )
}

export function Tabela({ r }: { r: Relatorio }) {
  if (r.erro) {
    return (
      <ErrorState
        title="Não foi possível carregar o relatório"
        description="O servidor não respondeu. Seus filtros foram mantidos."
        action={<Button onClick={() => r.setSimulacao("normal")}>Tentar de novo</Button>}
      />
    )
  }
  return (
    <DataTable
      columns={colunas}
      rows={r.rows}
      caption={`${TITULO}, ${periodoTexto(r)}`}
      loading={r.carregando}
      empty={
        <span>
          Nenhuma tentativa fora da jornada nesse período.{" "}
          {r.qtdFiltrosAtivos > 0 ? (
            <button type="button" className="font-semibold text-[var(--color-brand-text)] underline underline-offset-4" onClick={r.limpar}>
              Limpar filtros
            </button>
          ) : null}
        </span>
      }
    />
  )
}

// Chips dos filtros aplicados; cada um remove o filtro e reaplica na hora.
export function ChipsAtivos({ r }: { r: Relatorio }) {
  const a = r.aplicados
  const chips = [
    ...a.colaboradores.map((c) => ({ id: `c-${c}`, texto: c, remover: () => r.filtrar({ ...a, colaboradores: a.colaboradores.filter((x) => x !== c) }) })),
    ...a.gestores.map((g) => ({ id: `g-${g}`, texto: `Gestor: ${g}`, remover: () => r.filtrar({ ...a, gestores: a.gestores.filter((x) => x !== g) }) })),
  ]
  if (chips.length === 0) return null
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
      {chips.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={c.remover}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm text-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
          >
            {c.texto}
            <XIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">(remover filtro)</span>
          </button>
        </li>
      ))}
      <li>
        <Button variant="link" onClick={r.limpar}>
          Limpar tudo
        </Button>
      </li>
    </ul>
  )
}
