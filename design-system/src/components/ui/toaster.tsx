import type { ReactNode } from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, XIcon, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info"

const TOAST_TIMEOUT = 5000

const toastStyles: Record<ToastType, { icon: LucideIcon; border: string; iconColor: string }> = {
  success: {
    icon: CircleCheckIcon,
    border: "border-l-[var(--color-toast-success)]",
    iconColor: "text-[var(--color-toast-success)]",
  },
  error: {
    icon: CircleAlertIcon,
    border: "border-l-[var(--color-toast-danger)]",
    iconColor: "text-[var(--color-toast-danger)]",
  },
  info: {
    icon: InfoIcon,
    border: "border-l-[var(--color-toast-info)]",
    iconColor: "text-[var(--color-toast-info)]",
  },
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()
  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport
        data-slot="toast-viewport"
        className="fixed right-4 bottom-[var(--toaster-bottom,1rem)] z-[60] flex w-[calc(100%-2rem)] flex-col gap-2 outline-none sm:w-96"
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.type as ToastType] ?? toastStyles.info
          const Icon = style.icon
          return (
            <ToastPrimitive.Root
              key={toast.id}
              toast={toast}
              data-slot="toast"
              className={cn(
                "flex items-center gap-3 rounded-lg border-l-4 bg-[var(--color-toast-bg)] py-2 pr-2 pl-4 text-[var(--color-toast-text)] shadow-[var(--shadow-2)] transition-[opacity,translate] duration-[var(--dur)] ease-[var(--ease)] data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 motion-reduce:transition-none",
                style.border
              )}
            >
              <Icon className={cn("size-5 shrink-0", style.iconColor)} aria-hidden />
              <ToastPrimitive.Content className="min-w-0 flex-1">
                <ToastPrimitive.Title className="text-sm font-semibold break-words" />
              </ToastPrimitive.Content>
              <ToastPrimitive.Close
                aria-label="Fechar notificação"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-[var(--color-toast-text)] outline-none transition-colors hover:bg-[var(--color-toast-text)]/15 focus-visible:ring-3 focus-visible:ring-[var(--color-toast-text)]"
              >
                <XIcon className="size-4" aria-hidden />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  )
}

function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastPrimitive.Provider timeout={TOAST_TIMEOUT}>
      {children}
      <ToastList />
    </ToastPrimitive.Provider>
  )
}

export { ToastProvider }
