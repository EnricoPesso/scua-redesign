import { useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, SlidersHorizontalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateField } from "@/components/ui/date-field"
import { Drawer } from "@/components/ui/drawer"
import { MultiSelect } from "@/components/ui/multi-select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/format-number"
import { cn } from "@/lib/utils"
import { colaboradores, diasAtras, gestores, HOJE } from "./dados"
import { BotaoExportar, ChipsAtivos, Tabela, Trilha } from "./compartilhado"
import { periodoEntre, periodoTexto, TITULO } from "./colunas"
import { useRelatorio, type Relatorio } from "./use-relatorio"

// C) Resposta primeiro: frase-resumo, atalhos de período, demais filtros num drawer,
// KPIs comparados com o período anterior.

const atalhos = [
  { id: "7", rotulo: "Últimos 7 dias", inicio: diasAtras(6) },
  { id: "14", rotulo: "Últimos 14 dias", inicio: diasAtras(13) },
  { id: "mes", rotulo: "Este mês", inicio: `${HOJE.slice(0, 7)}-01` },
] as const

export function VarianteC() {
  const r = useRelatorio()
  const [drawer, setDrawer] = useState(false)
  const atalhoAtivo = r.aplicados.fim === HOJE ? atalhos.find((a) => a.inicio === r.aplicados.inicio)?.id : undefined
  const [personalizado, setPersonalizado] = useState(false)

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-3xl flex-col gap-2">
          <Trilha />
          <h1 className="font-heading text-xl font-bold text-foreground">{TITULO}</h1>
          <Resumo r={r} />
        </div>
        <BotaoExportar r={r} />
      </header>

      <section aria-label="Filtros" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Período" className="flex flex-wrap gap-2">
            {atalhos.map((a) => (
              <Button
                key={a.id}
                variant="secondary"
                aria-pressed={!personalizado && atalhoAtivo === a.id}
                className="aria-pressed:border-[var(--color-brand)] aria-pressed:bg-[var(--color-surface-muted)]"
                onClick={() => {
                  setPersonalizado(false)
                  r.filtrar({ ...r.aplicados, inicio: a.inicio, fim: HOJE })
                }}
              >
                {a.rotulo}
              </Button>
            ))}
            <Button
              variant="secondary"
              aria-pressed={personalizado || (!atalhoAtivo && !personalizado)}
              aria-expanded={personalizado}
              className="aria-pressed:border-[var(--color-brand)] aria-pressed:bg-[var(--color-surface-muted)]"
              onClick={() => setPersonalizado((v) => !v)}
            >
              Personalizado
            </Button>
          </div>
          <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
          <Button variant="secondary" onClick={() => setDrawer(true)}>
            <SlidersHorizontalIcon aria-hidden="true" />
            Colaboradores e gestores{r.qtdFiltrosAtivos ? ` (${r.qtdFiltrosAtivos})` : ""}
          </Button>
        </div>

        {personalizado ? (
          <form
            className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!r.periodoInvalido) r.filtrar()
            }}
          >
            <DateField className="w-full sm:w-48" label="Data inicial" value={r.rascunho.inicio} max={r.rascunho.fim} onChange={(v) => r.setRascunho({ ...r.rascunho, inicio: v })} />
            <DateField
              className="w-full sm:w-48"
              label="Data final"
              value={r.rascunho.fim}
              min={r.rascunho.inicio}
              onChange={(v) => r.setRascunho({ ...r.rascunho, fim: v })}
              error={r.periodoInvalido ? "A data final precisa ser igual ou posterior à inicial." : undefined}
            />
            <Button type="submit" loading={r.carregando} disabled={r.periodoInvalido}>
              Aplicar período
            </Button>
          </form>
        ) : null}

        <ChipsAtivos r={r} />
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiComparado r={r} label="Tentativas" atual={r.kpis.total} anterior={r.kpisAnteriores.total} />
        <KpiComparado r={r} label="Colaboradores" atual={r.kpis.colaboradores} anterior={r.kpisAnteriores.colaboradores} />
        <KpiComparado r={r} label="Gestores com equipe envolvida" atual={r.kpis.gestores} anterior={r.kpisAnteriores.gestores} />
        <KpiComparado r={r} label="Média por colaborador" atual={r.kpis.media} anterior={r.kpisAnteriores.media} decimais={1} />
      </div>

      <Tabela r={r} />

      <Drawer
        open={drawer}
        onOpenChange={setDrawer}
        title="Colaboradores e gestores"
        description="Deixe em branco para ver todos."
        footer={
          <>
            <Button variant="ghost" onClick={() => r.setRascunho({ ...r.rascunho, colaboradores: [], gestores: [] })}>
              Limpar
            </Button>
            <Button
              onClick={() => {
                r.filtrar({ ...r.aplicados, colaboradores: r.rascunho.colaboradores, gestores: r.rascunho.gestores })
                setDrawer(false)
              }}
            >
              Aplicar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <MultiSelect label="Colaboradores" placeholder="Todos" options={colaboradores} values={r.rascunho.colaboradores} onValuesChange={(v) => r.setRascunho({ ...r.rascunho, colaboradores: v })} />
          <MultiSelect label="Gestores" placeholder="Todos" options={gestores} values={r.rascunho.gestores} onValuesChange={(v) => r.setRascunho({ ...r.rascunho, gestores: v })} />
        </div>
      </Drawer>
    </main>
  )
}

function Resumo({ r }: { r: Relatorio }) {
  if (r.carregando) {
    return (
      <>
        <span className="sr-only">Carregando resumo</span>
        <Skeleton className="h-7 w-full max-w-xl" />
      </>
    )
  }
  if (r.erro) return null
  const { total, colaboradores: pessoas } = r.kpis
  const diff = total - r.kpisAnteriores.total
  return (
    <p className="text-lg text-foreground" role="status">
      {total === 0 ? (
        <>Nenhuma tentativa fora da jornada {periodoEntre(r)}.</>
      ) : (
        <>
          <strong className="font-bold text-[var(--color-brand-text)]">
            {formatNumber(total)} {total === 1 ? "tentativa" : "tentativas"}
          </strong>{" "}
          de {formatNumber(pessoas)} {pessoas === 1 ? "colaborador" : "colaboradores"} {periodoEntre(r)}
          {diff === 0 ? ", igual ao período anterior." : `, ${formatNumber(Math.abs(diff))} a ${diff > 0 ? "mais" : "menos"} que no período anterior.`}
        </>
      )}
    </p>
  )
}

function KpiComparado({ r, label, atual, anterior, decimais = 0 }: { r: Relatorio; label: string; atual: number; anterior: number; decimais?: number }) {
  const diff = atual - anterior
  // Aqui "mais" é ruim (mais tentativas fora da jornada), então subir usa a cor de perigo.
  const Icone = diff > 0 ? ArrowUpIcon : diff < 0 ? ArrowDownIcon : MinusIcon
  const vazio = !r.carregando && r.rows.length === 0
  return (
    <div role="group" aria-label={label} aria-busy={r.carregando || undefined} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-1)]">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      {r.carregando ? (
        <Skeleton className="h-10 w-2/3" />
      ) : vazio || r.erro ? (
        <p className="text-base font-semibold text-foreground">Sem dados no período</p>
      ) : (
        <p className="text-2xl font-bold text-foreground tabular-nums">{formatNumber(atual, decimais)}</p>
      )}
      {!r.carregando && !vazio && !r.erro ? (
        <p
          className={cn(
            "flex items-center gap-1 text-xs font-semibold",
            diff > 0 ? "text-[var(--color-danger-text)]" : diff < 0 ? "text-[var(--color-success-text)]" : "text-muted-foreground",
          )}
        >
          <Icone className="size-3.5" aria-hidden="true" />
          {diff === 0 ? "Igual ao período anterior" : `${formatNumber(Math.abs(diff), decimais)} ${diff > 0 ? "a mais" : "a menos"} que o período anterior`}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{periodoTexto(r)}</p>
      )}
    </div>
  )
}
