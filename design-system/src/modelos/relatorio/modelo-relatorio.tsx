import type { ReactNode } from "react"
import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ErrorState } from "@/components/ui/error-state"
import { KpiCard } from "@/components/ui/kpi-card"
import { useToast } from "@/components/ui/use-toast"
import { exportarPlanilha } from "@/components/exportar-planilha"
import { formatNumber } from "@/lib/format-number"
import { formatarDataBr, hojeIso, nomeArquivo, periodoDe } from "@/lib/relatorio"
import { Filtros } from "./filtros"
import type { ColunaRelatorio, ConfigRelatorio, ValoresFiltro } from "./tipos"
import { useModeloRelatorio } from "./use-modelo-relatorio"

type ModeloRelatorioProps<T> = {
  config: ConfigRelatorio<T>
  // Data de referência do período padrão. Fixa em protótipo e teste; hoje no sistema real.
  hoje?: string
  // Trilha própria do app (ex.: com links do roteador, sem recarregar a página). Substitui a trilha padrão.
  trilha?: ReactNode
  // Filtros com que o relatório abre (ex.: lidos da URL); o que faltar usa o padrão.
  valoresIniciais?: ValoresFiltro
  // Avisa a cada Filtrar/Limpar, para o app guardar os filtros aplicados (ex.: na URL). `padrao` = sem filtro próprio.
  aoAplicar?: (aplicados: ValoresFiltro, padrao: boolean) => void
}

// Modelo único de relatório (variante A, escolhida em 2026-10-29):
// cabeçalho com Exportar → faixa de filtros → KPIs → tabela.
export function ModeloRelatorio<T extends object>({ config, hoje = hojeIso(), trilha, valoresIniciais, aoAplicar }: ModeloRelatorioProps<T>) {
  const r = useModeloRelatorio(config, hoje, { valoresIniciais, aoAplicar })
  const carregando = r.status === "carregando"
  const erro = r.status === "erro"
  const periodo = textoPeriodo(r.aplicados)

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          {trilha ?? <Trilha grupo={config.grupo} href={config.linkRelatorios} />}
          <h1 className="font-heading text-xl font-bold text-foreground">{config.titulo}</h1>
        </div>
        <BotaoExportar colunas={config.colunas} rows={r.rows} arquivo={nomeArquivo(config.arquivo, r.aplicados)} disabled={r.status !== "pronto" || r.rows.length === 0} />
      </header>

      <form
        aria-label="Filtros"
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)] sm:p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!r.erroPeriodo) r.filtrar()
        }}
      >
        <Filtros filtros={config.filtros} valores={r.rascunho} onChange={r.setRascunho} erroPeriodo={r.erroPeriodo} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={r.limpar}>
            Limpar filtros
          </Button>
          <Button type="submit" loading={carregando} disabled={Boolean(r.erroPeriodo)}>
            Filtrar
          </Button>
        </div>
      </form>

      {config.kpis.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {config.kpis.map((k) => (
            <KpiCard
              key={k.rotulo}
              label={k.rotulo}
              value={k.valor(r.rows)}
              decimals={k.decimais}
              unit={k.unidade}
              period={periodo}
              loading={carregando}
              // Em erro os números não são confiáveis: mostra "Sem dados" em vez do último valor.
              empty={!carregando && (erro || r.rows.length === 0)}
            />
          ))}
        </div>
      ) : null}

      {erro ? (
        <ErrorState
          title="Não foi possível carregar o relatório"
          description="O servidor não respondeu. Seus filtros foram mantidos."
          action={<Button onClick={r.tentarDeNovo}>Tentar de novo</Button>}
        />
      ) : (
        <DataTable
          columns={config.colunas}
          rows={r.rows}
          caption={periodo ? `${config.titulo}, ${periodo}` : config.titulo}
          loading={carregando}
          empty={<Vazio mensagem={config.vazio ?? "Nenhum registro encontrado para os filtros escolhidos."} podeLimpar={r.alterado} limpar={r.limpar} />}
        />
      )}
    </main>
  )
}

function textoPeriodo(v: ValoresFiltro) {
  const p = periodoDe(v)
  return p ? `${formatarDataBr(p.inicio)} a ${formatarDataBr(p.fim)}` : "Situação atual"
}

// Sem href (a lista de relatórios ainda não existe), "Relatórios" é texto, não um link morto.
function Trilha({ grupo, href }: { grupo: string; href?: string }) {
  return (
    <nav aria-label="Trilha" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          {href ? (
            <a href={href} className="rounded-sm text-[var(--color-brand-text)] underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
              Relatórios
            </a>
          ) : (
            "Relatórios"
          )}
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{grupo}</li>
      </ol>
    </nav>
  )
}

function Vazio({ mensagem, podeLimpar, limpar }: { mensagem: string; podeLimpar: boolean; limpar: () => void }): ReactNode {
  return (
    <span>
      {mensagem}{" "}
      {podeLimpar ? (
        <button type="button" className="font-semibold text-[var(--color-brand-text)] underline underline-offset-4" onClick={limpar}>
          Limpar filtros
        </button>
      ) : null}
    </span>
  )
}

function BotaoExportar<T>({ colunas, rows, arquivo, disabled }: { colunas: ColunaRelatorio<T>[]; rows: T[]; arquivo: string; disabled: boolean }) {
  const toast = useToast()
  function exportar() {
    const nome = exportarPlanilha({
      arquivo,
      colunas: colunas.map((c) => ({ header: c.header, texto: c.texto ?? ((row: T) => String(row[c.key as keyof T] ?? "")) })),
      linhas: rows,
    })
    toast.success(`${formatNumber(rows.length)} ${rows.length === 1 ? "registro exportado" : "registros exportados"} em ${nome}`)
  }
  return (
    <Button variant="secondary" disabled={disabled} onClick={exportar}>
      <DownloadIcon aria-hidden="true" />
      Exportar para Excel
    </Button>
  )
}
