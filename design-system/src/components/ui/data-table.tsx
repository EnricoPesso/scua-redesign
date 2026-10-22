import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { paginate } from "@/lib/paginate"

type Column<T> = {
  key: string
  header: string
  render?: (row: T) => ReactNode
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

function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
  pageSize = 10,
  loading = false,
  empty = "Nenhum registro encontrado",
}: DataTableProps<T>) {
  const [requestedPage, setRequestedPage] = useState(1)
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
                <th key={col.key} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap text-foreground">
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
                        <span aria-hidden className="block h-4 w-3/4 animate-pulse rounded-sm bg-muted motion-reduce:animate-none" />
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
                    <tr key={info.from + i} className="border-t border-border hover:bg-[var(--scua-gray-50)]">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-foreground">
                          {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                        </td>
                      ))}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-sm text-muted-foreground" role="status">
          {loading ? "Carregando..." : `Mostrando ${info.from} a ${info.to} de ${rows.length}`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={loading || !info.hasPrev}
            onClick={() => setRequestedPage(info.page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={loading || !info.hasNext}
            onClick={() => setRequestedPage(info.page + 1)}
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
