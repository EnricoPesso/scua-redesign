import { useId } from "react"
import { cn } from "@/lib/utils"
import { CountUp } from "@/components/ui/count-up"
import { Skeleton } from "@/components/ui/skeleton"

type KpiCardProps = {
  label: string
  value: number
  period: string
  unit?: string
  decimals?: number
  loading?: boolean
  empty?: boolean
  className?: string
}

function KpiCard({ label, value, period, unit, decimals = 0, loading = false, empty = false, className }: KpiCardProps) {
  const labelId = useId()
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-busy={loading || undefined}
      data-slot="kpi-card"
      className={cn("flex flex-col gap-2 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-1)]", className)}
    >
      <p id={labelId} className="text-sm font-semibold text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <>
          <span className="sr-only">Carregando</span>
          <Skeleton className="h-10 w-2/3" />
        </>
      ) : empty ? (
        <p className="text-base font-semibold text-foreground">Sem dados no período</p>
      ) : (
        <p className="flex items-baseline gap-1.5 text-2xl font-bold text-foreground">
          <CountUp to={value} decimals={decimals} />
          {unit ? <span className="text-base font-semibold text-muted-foreground">{unit}</span> : null}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{period}</p>
    </div>
  )
}

export { KpiCard }
export type { KpiCardProps }
