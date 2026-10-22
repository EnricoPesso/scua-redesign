import { Field as FieldPrimitive } from "@base-ui/react/field"
import { cn } from "@/lib/utils"

type FieldProps = FieldPrimitive.Root.Props & {
  label: string
  hint?: string
  error?: string
  inputProps?: FieldPrimitive.Control.Props
}

function Field({ label, hint, error, inputProps, className, ...props }: FieldProps) {
  return (
    <FieldPrimitive.Root invalid={Boolean(error)} className={cn("flex flex-col gap-1.5", className)} {...props}>
      <FieldPrimitive.Label className="text-sm font-semibold text-foreground">{label}</FieldPrimitive.Label>
      <FieldPrimitive.Control
        {...inputProps}
        className={cn(
          "h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground hover:border-foreground focus-visible:ring-3 focus-visible:ring-ring data-[invalid]:border-destructive disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
          inputProps?.className
        )}
      />
      {hint && !error ? (
        <FieldPrimitive.Description className="text-xs text-muted-foreground">{hint}</FieldPrimitive.Description>
      ) : null}
      {error ? (
        <FieldPrimitive.Error match className="text-xs font-medium text-[var(--scua-red-700)]">{error}</FieldPrimitive.Error>
      ) : null}
    </FieldPrimitive.Root>
  )
}

export { Field }
export type { FieldProps }
