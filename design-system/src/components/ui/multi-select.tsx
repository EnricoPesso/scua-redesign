import { useId, useMemo } from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FieldError } from "./field-error"
import { listboxItemClass, listboxPopupClass } from "./listbox-styles"
import type { Option } from "./select"

type MultiSelectProps = {
  label: string
  options: Option[]
  values?: string[]
  defaultValues?: string[]
  onValuesChange?: (values: string[]) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  defaultOpen?: boolean
  modal?: boolean
  name?: string
  id?: string
  required?: boolean
  className?: string
}

function MultiSelect({
  label,
  options,
  values,
  defaultValues,
  onValuesChange,
  placeholder = "Buscar…",
  error,
  disabled,
  defaultOpen,
  modal,
  name,
  id,
  required,
  className,
}: MultiSelectProps) {
  const errorId = useId()
  const generatedId = useId()
  const inputId = id ?? generatedId
  const items = useMemo(() => options.map((o) => o.value), [options])
  const labels = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options])
  const labelOf = (v: string) => labels.get(v) ?? v
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <ComboboxPrimitive.Root
        multiple
        items={items}
        itemToStringLabel={labelOf}
        value={values}
        defaultValue={defaultValues}
        onValueChange={(v) => onValuesChange?.(v)}
        name={name}
        required={required}
        disabled={disabled}
        defaultOpen={defaultOpen}
        modal={modal}
      >
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">{label}</label>
        <ComboboxPrimitive.Chips
          className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-card pr-0 pl-2 hover:border-foreground focus-within:ring-3 focus-within:ring-ring data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted data-[disabled]:opacity-60 has-[[aria-invalid=true]]:border-destructive"
        >
          <ComboboxPrimitive.Value>
            {(selected: string[]) => (
              <>
                {selected.map((v) => (
                  <ComboboxPrimitive.Chip
                    key={v}
                    className="flex h-8 max-w-full items-center gap-1 rounded-sm bg-secondary pr-0 pl-2 text-sm text-foreground"
                  >
                    <span className="min-w-0 truncate">{labelOf(v)}</span>
                    <ComboboxPrimitive.ChipRemove
                      aria-label={`Remover ${labelOf(v)}`}
                      className="-my-1 flex size-10 shrink-0 items-center justify-center rounded-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
                    >
                      <XIcon className="size-4" aria-hidden />
                    </ComboboxPrimitive.ChipRemove>
                  </ComboboxPrimitive.Chip>
                ))}
                <ComboboxPrimitive.Input
                  id={inputId}
                  placeholder={selected.length ? "" : placeholder}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  className="h-10 min-w-24 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />
              </>
            )}
          </ComboboxPrimitive.Value>
          <ComboboxPrimitive.Trigger
            aria-label={`Abrir opções de ${label}`}
            className="ml-auto flex size-10 items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            <ChevronDownIcon className="size-4" aria-hidden />
          </ComboboxPrimitive.Trigger>
        </ComboboxPrimitive.Chips>
        <ComboboxPrimitive.Portal>
          <ComboboxPrimitive.Positioner sideOffset={4} className="z-50">
            <ComboboxPrimitive.Popup className={cn(listboxPopupClass, "w-[var(--anchor-width)]")}>
              <ComboboxPrimitive.Empty className="px-2 py-2.5 text-sm text-muted-foreground">
                Nenhum resultado
              </ComboboxPrimitive.Empty>
              <ComboboxPrimitive.List>
                {(v: string) => (
                  <ComboboxPrimitive.Item
                    key={v}
                    value={v}
                    className={listboxItemClass}
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
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}

export { MultiSelect }
export type { MultiSelectProps }
