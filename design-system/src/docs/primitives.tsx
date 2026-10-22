import { useEffect, useRef, useState, type ReactNode } from "react"
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
        <h2 id={`${id}-titulo`} className="text-xl font-bold">{title}</h2>
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
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative min-w-0 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Uso</p>
        <Button variant="secondary" size="sm" onClick={copy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed" tabIndex={0} aria-label="Código de exemplo">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function lerVariavel(name: string): string {
  if (typeof document === "undefined") return ""
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function Swatch({ name }: { name: string }) {
  const value = lerVariavel(name)
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
  return (
    <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-4">
      {names.map((n) => <Swatch key={n} name={n} />)}
    </ul>
  )
}
