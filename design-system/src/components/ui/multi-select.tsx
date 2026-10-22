import { useId } from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Option } from "./select"

type MultiSelectProps = {
  label: string
  options: Option[]
  values?: string[]
  onValuesChange?: (values: string[]) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  defaultOpen?: boolean
  className?: string
}

function MultiSelect({
  label,
  options,
  values,
  onValuesChange,
  placeholder = "Buscar",
  error,
  disabled,
  defaultOpen,
  className,
}: MultiSelectProps) {
  const errorId = useId()
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v
  const items = options.map((o) => o.value)
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <ComboboxPrimitive.Root
        multiple
        items={items}
        itemToStringLabel={labelOf}
        value={values}
        onValueChange={(v) => onValuesChange?.(v)}
        disabled={disabled}
        defaultOpen={defaultOpen}
      >
        <ComboboxPrimitive.Label className="text-sm font-semibold text-foreground">{label}</ComboboxPrimitive.Label>
        <ComboboxPrimitive.Chips
          className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1 hover:border-foreground focus-within:ring-3 focus-within:ring-ring data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted data-[disabled]:opacity-60 has-[[aria-invalid=true]]:border-destructive"
        >
          <ComboboxPrimitive.Value>
            {(selected: string[]) => (
              <>
                {selected.map((v) => (
                  <ComboboxPrimitive.Chip
                    key={v}
                    className="flex items-center gap-1 rounded-sm bg-secondary py-0.5 pr-0.5 pl-2 text-sm text-foreground"
                  >
                    {labelOf(v)}
                    <ComboboxPrimitive.ChipRemove
                      aria-label={`Remover ${labelOf(v)}`}
                      className="flex size-7 items-center justify-center rounded-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
                    >
                      <XIcon className="size-4" aria-hidden />
                    </ComboboxPrimitive.ChipRemove>
                  </ComboboxPrimitive.Chip>
                ))}
                <ComboboxPrimitive.Input
                  placeholder={selected.length ? "" : placeholder}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  className="h-8 min-w-24 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />
              </>
            )}
          </ComboboxPrimitive.Value>
          <ComboboxPrimitive.Trigger
            aria-label={`Abrir opções de ${label}`}
            className="ml-auto flex size-8 items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            <ChevronDownIcon className="size-4" aria-hidden />
          </ComboboxPrimitive.Trigger>
        </ComboboxPrimitive.Chips>
        <ComboboxPrimitive.Portal>
          <ComboboxPrimitive.Positioner sideOffset={4} className="z-50">
            <ComboboxPrimitive.Popup className="max-h-64 w-[var(--anchor-width)] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-[var(--shadow-2)] outline-none">
              <ComboboxPrimitive.Empty className="px-2 py-2.5 text-sm text-muted-foreground">
                Nenhum resultado
              </ComboboxPrimitive.Empty>
              <ComboboxPrimitive.List>
                {(v: string) => (
                  <ComboboxPrimitive.Item
                    key={v}
                    value={v}
                    className="flex h-10 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-none select-none data-[highlighted]:bg-secondary"
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      <ComboboxPrimitive.ItemIndicator>
                        <CheckIcon className="size-4" aria-hidden />
                      </ComboboxPrimitive.ItemIndicator>
                    </span>
                    {labelOf(v)}
                  </ComboboxPrimitive.Item>
                )}
              </ComboboxPrimitive.List>
            </ComboboxPrimitive.Popup>
          </ComboboxPrimitive.Positioner>
        </ComboboxPrimitive.Portal>
      </ComboboxPrimitive.Root>
      {error ? (
        <p id={errorId} className="text-xs font-medium text-[var(--color-danger-text)]">{error}</p>
      ) : null}
    </div>
  )
}

export { MultiSelect }
export type { MultiSelectProps }
