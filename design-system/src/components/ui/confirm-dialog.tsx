import { useRef } from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { Button } from "@/components/ui/button"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={(next) => (loading ? undefined : onOpenChange(next))}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop
          data-slot="confirm-dialog-backdrop"
          className="fixed inset-0 z-50 bg-[var(--color-backdrop)] transition-opacity duration-[var(--dur)] ease-[var(--ease)] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none"
        />
        <AlertDialogPrimitive.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialogPrimitive.Popup
            data-slot="confirm-dialog"
            initialFocus={destructive ? cancelRef : true}
            className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-[var(--shadow-3)] outline-none transition-[opacity,scale] duration-[var(--dur)] ease-[var(--ease)] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-none"
          >
            <div className="flex flex-col gap-2">
              <AlertDialogPrimitive.Title className="text-lg font-bold break-words text-foreground">{title}</AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="text-sm text-muted-foreground">
                {description}
              </AlertDialogPrimitive.Description>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button ref={cancelRef} variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
                {cancelLabel}
              </Button>
              <Button variant={destructive ? "destructive" : "primary"} loading={loading} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </AlertDialogPrimitive.Popup>
        </AlertDialogPrimitive.Viewport>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
