import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon, MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type CheckboxProps = {
  label: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  indeterminate?: boolean
  disabled?: boolean
  className?: string
}

function Checkbox({ label, checked, defaultChecked, onCheckedChange, indeterminate, disabled, className }: CheckboxProps) {
  return (
    <label
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-foreground has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60",
        className
      )}
    >
      <CheckboxPrimitive.Root
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(c) => onCheckedChange?.(c)}
        indeterminate={indeterminate}
        disabled={disabled}
        className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-input bg-card text-primary-foreground outline-none hover:border-foreground focus-visible:ring-3 focus-visible:ring-ring data-[checked]:border-primary data-[checked]:bg-primary data-[indeterminate]:border-primary data-[indeterminate]:bg-primary"
      >
        <CheckboxPrimitive.Indicator className="flex">
          {indeterminate ? <MinusIcon className="size-4" aria-hidden /> : <CheckIcon className="size-4" aria-hidden />}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label}
    </label>
  )
}

export { Checkbox }
export type { CheckboxProps }
