import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../index.css"
import { ToastProvider } from "@/components/ui/toaster"
import { Prototipos } from "./prototipos"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <Prototipos />
    </ToastProvider>
  </StrictMode>,
)
