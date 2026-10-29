import type { ReactNode } from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      status: {
        success: "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
        warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
        danger: "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
        info: "bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
        neutral: "bg-[var(--color-neutral-bg)] text-[var(--color-neutral-text)]",
      },
    },
    defaultVariants: { status: "neutral" },
  }
)

type BadgeProps = {
  status?: "success" | "warning" | "danger" | "info" | "neutral"
  children: ReactNode
  className?: string
}

function Badge({ status = "neutral", children, className }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ status }), className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export { Badge }
export type { BadgeProps }
