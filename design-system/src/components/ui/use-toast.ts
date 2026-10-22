import { useMemo } from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"

export function useToast() {
  const { add } = ToastPrimitive.useToastManager()
  return useMemo(
    () => ({
      success: (message: string) => add({ title: message, type: "success" }),
      error: (message: string) => add({ title: message, type: "error", priority: "high", timeout: 0 }),
      info: (message: string) => add({ title: message, type: "info" }),
    }),
    [add]
  )
}
