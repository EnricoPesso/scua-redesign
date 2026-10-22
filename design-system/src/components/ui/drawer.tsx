import type { ReactNode } from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type DrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

function Drawer({ open, onOpenChange, title, description, children, footer, className }: DrawerProps) {
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Backdrop
          data-slot="drawer-backdrop"
          className="fixed inset-0 z-50 bg-[var(--color-backdrop)] transition-opacity duration-[var(--dur)] ease-[var(--ease)] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none"
        />
        <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex justify-end">
          <DrawerPrimitive.Popup
            data-slot="drawer"
            className={cn(
              "flex h-full w-full max-w-[28rem] translate-x-[var(--drawer-swipe-movement-x,0px)] flex-col border-l border-border bg-popover text-popover-foreground shadow-[var(--shadow-3)] outline-none transition-transform duration-[var(--dur)] ease-[var(--ease)] data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full motion-reduce:transition-none",
              className
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div className="flex min-w-0 flex-col gap-1">
                <DrawerPrimitive.Title className="text-lg font-bold text-foreground">{title}</DrawerPrimitive.Title>
                {description ? (
                  <DrawerPrimitive.Description className="text-sm text-muted-foreground">{description}</DrawerPrimitive.Description>
                ) : null}
              </div>
              <DrawerPrimitive.Close
                aria-label="Fechar"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
              >
                <XIcon className="size-5" aria-hidden />
              </DrawerPrimitive.Close>
            </div>
            <DrawerPrimitive.Content className="min-h-0 flex-1 overflow-y-auto p-5">{children}</DrawerPrimitive.Content>
            {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-border p-5">{footer}</div> : null}
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Viewport>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}

export { Drawer }
export type { DrawerProps }
