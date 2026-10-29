import type { ReactNode } from "react"
import { TriangleAlertIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Recebe título e descrição já amigáveis: nunca exibe Error, stack ou mensagem técnica crua.
type ErrorStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn("flex flex-col items-center gap-3 rounded-lg border border-input bg-card px-6 py-10 text-center", className)}
    >
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]"
      >
        <TriangleAlertIcon className="size-6" />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export { ErrorState }
export type { ErrorStateProps }
