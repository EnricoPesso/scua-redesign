import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

type ToggleProps = {
  label: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

function Toggle({ label, checked, defaultChecked, onCheckedChange, disabled, className }: ToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center gap-3 text-sm text-foreground has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60",
        className
      )}
    >
      <SwitchPrimitive.Root
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(c) => onCheckedChange?.(c)}
        disabled={disabled}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-input bg-muted outline-none transition-colors duration-[var(--dur-fast)] motion-reduce:transition-none focus-visible:ring-3 focus-visible:ring-ring data-[checked]:border-primary data-[checked]:bg-primary"
      >
        <SwitchPrimitive.Thumb className="block size-4 translate-x-1 rounded-full bg-foreground transition-transform duration-[var(--dur-fast)] motion-reduce:transition-none data-[checked]:translate-x-6 data-[checked]:bg-primary-foreground" />
      </SwitchPrimitive.Root>
      {label}
    </label>
  )
}

export { Toggle }
export type { ToggleProps }
