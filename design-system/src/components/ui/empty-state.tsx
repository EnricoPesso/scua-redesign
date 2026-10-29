import type { ReactNode } from "react"
import { InboxIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn("flex flex-col items-center gap-3 rounded-lg border border-dashed border-input bg-card px-6 py-10 text-center", className)}
    >
      <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <InboxIcon className="size-6" />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
