import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/format-number"
import { paginate } from "@/lib/paginate"

type Column<T> = {
  key: string
  header: string
  render?: (row: T) => ReactNode
  numeric?: boolean
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  caption: string
  pageSize?: number
  loading?: boolean
  empty?: ReactNode
}

const SKELETON_ROWS = 5

const navButtonClass = "aria-disabled:pointer-events-none aria-disabled:opacity-50"

function DataTable<T extends object>({
  columns,
  rows,
  caption,
  pageSize = 10,
  loading = false,
  empty = "Nenhum registro encontrado. Ajuste os filtros ou tente outro período.",
}: DataTableProps<T>) {
  const [requestedPage, setRequestedPage] = useState(1)
  const [prevRows, setPrevRows] = useState(rows)
  if (prevRows !== rows) {
    setPrevRows(rows)
    setRequestedPage(1)
  }
  const info = paginate({ total: rows.length, page: requestedPage, pageSize })
  const visible = rows.slice(info.from === 0 ? 0 : info.from - 1, info.to)

  return (
    <div className="rounded-lg border border-border bg-card" aria-busy={loading || undefined}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-[var(--color-surface-muted)]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn("px-4 py-3 font-semibold whitespace-nowrap text-foreground", col.numeric && "text-right tabular-nums")}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                  <tr key={i} className="border-t border-border">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : visible.length === 0
                ? (
                    <tr className="border-t border-border">
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                        {empty}
                      </td>
                    </tr>
                  )
                : visible.map((row, i) => (
                    <tr key={info.from + i} className="border-t border-border hover:bg-[var(--color-row-hover)]">
                      {columns.map((col) => (
                        <td key={col.key} className={cn("px-4 py-3 text-foreground", col.numeric && "text-right tabular-nums")}>
                          {col.render ? col.render(row) : (row[col.key as keyof T] as ReactNode)}
                        </td>
                      ))}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-sm text-muted-foreground" role="status">
          {loading ? "Carregando…" : `Mostrando ${formatNumber(info.from)} a ${formatNumber(info.to)} de ${formatNumber(rows.length)}`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className={navButtonClass}
            aria-disabled={loading || !info.hasPrev ? true : undefined}
            onClick={() => {
              if (loading || !info.hasPrev) return
              setRequestedPage(info.page - 1)
            }}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            className={navButtonClass}
            aria-disabled={loading || !info.hasNext ? true : undefined}
            onClick={() => {
              if (loading || !info.hasNext) return
              setRequestedPage(info.page + 1)
            }}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}

export { DataTable }
export type { Column, DataTableProps }
