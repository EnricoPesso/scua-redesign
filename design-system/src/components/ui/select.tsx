import { useId } from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string }

type SelectProps = {
  label: string
  options: Option[]
  value?: string | null
  onValueChange?: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  defaultOpen?: boolean
  className?: string
}

function Select({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Selecione",
  error,
  disabled,
  defaultOpen,
  className,
}: SelectProps) {
  const errorId = useId()
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <SelectPrimitive.Root
        items={options}
        value={value}
        onValueChange={(v) => onValueChange?.(v as string)}
        disabled={disabled}
        defaultOpen={defaultOpen}
      >
        <SelectPrimitive.Label className="text-sm font-semibold text-foreground">{label}</SelectPrimitive.Label>
        <SelectPrimitive.Trigger
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none hover:border-foreground focus-visible:ring-3 focus-visible:ring-ring data-[popup-open]:border-foreground data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted data-[disabled]:opacity-60 data-[disabled]:hover:border-input aria-[invalid=true]:border-destructive"
          )}
        >
          <SelectPrimitive.Value>
            {(v: string | null) =>
              v ? (options.find((o) => o.value === v)?.label ?? v) : <span className="text-muted-foreground">{placeholder}</span>
            }
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon className="text-muted-foreground">
            <ChevronDownIcon className="size-4" aria-hidden />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={4} alignItemWithTrigger={false} className="z-50">
            <SelectPrimitive.Popup className="max-h-64 min-w-[var(--anchor-width)] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-[var(--shadow-2)] outline-none">
              <SelectPrimitive.List>
                {options.map((o) => (
                  <SelectPrimitive.Item
                    key={o.value}
                    value={o.value}
                    className="flex h-10 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-none select-none data-[highlighted]:bg-secondary data-[disabled]:opacity-50"
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <CheckIcon className="size-4" aria-hidden />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.List>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error ? (
        <p id={errorId} className="text-xs font-medium text-[var(--color-danger-text)]">{error}</p>
      ) : null}
    </div>
  )
}

export { Select }
export type { SelectProps, Option }
