import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export const fieldErrorClass = "text-xs font-medium text-[var(--color-danger-text)]"

type FieldErrorProps = { id?: string; children?: ReactNode; className?: string }

export function FieldError({ id, children, className }: FieldErrorProps) {
  if (!children) return null
  return (
    <p id={id} aria-live="polite" className={cn(fieldErrorClass, className)}>
      {children}
    </p>
  )
}
