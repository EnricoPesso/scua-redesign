import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DocSectionProps = {
  id: string
  title: string
  description: string
  children: ReactNode
}

export function DocSection({ id, title, description, children }: DocSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="flex scroll-mt-6 flex-col gap-5">
      <header className="flex flex-col gap-1 border-b border-border pb-3">
        <h2 id={`${id}-titulo`} className="text-xl font-bold text-balance">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  )
}

export function StateGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>
}

export function StateCell({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4", className)}>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  )
}

export function CodeBlock({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle")
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const flash = (next: "copied" | "failed") => {
    setStatus(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setStatus("idle"), 2000)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      flash("copied")
    } catch {
      flash("failed")
    }
  }

  return (
    <div className="relative min-w-0 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Uso</p>
        <Button variant="secondary" onClick={copy}>
          {status === "copied" ? <CheckIcon /> : <CopyIcon />}
          {status === "copied" ? "Copiado" : status === "failed" ? "Não foi possível copiar" : "Copiar"}
        </Button>
        <span className="sr-only" aria-live="polite">
          {status === "copied" ? "Copiado" : status === "failed" ? "Não foi possível copiar" : ""}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed" role="region" tabIndex={0} aria-label="Código de exemplo">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function useCssVars(names: string[]): Record<string, string> {
  return useMemo(() => {
    const vars: Record<string, string> = {}
    if (typeof document === "undefined") return vars
    const style = getComputedStyle(document.documentElement)
    for (const name of names) vars[name] = style.getPropertyValue(name).trim()
    return vars
  }, [names])
}

export function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="h-14 border-b border-border" style={{ background: `var(${name})` }} aria-hidden="true" />
      <div className="flex flex-col gap-0.5 p-2">
        <code className="font-mono text-xs font-semibold break-all">{name}</code>
        <span className="font-mono text-xs text-muted-foreground">{value || "—"}</span>
      </div>
    </li>
  )
}

export function SwatchGrid({ names }: { names: string[] }) {
  const vars = useCssVars(names)
  return (
    <ul role="list" className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-4">
      {names.map((n) => <Swatch key={n} name={n} value={vars[n]} />)}
    </ul>
  )
}
